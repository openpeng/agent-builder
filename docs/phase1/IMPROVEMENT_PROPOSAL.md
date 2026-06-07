# Agent Market 架构改进方案

## 方案概述

将当前的 **Skill-centric 架构**（以 SKILL.md 为核心）重构为 **Agent-centric 架构**（以 agent.json 为核心），实现真正的跨平台 Agent 互操作。

## 核心设计原则

1. **Agent.json 是唯一真相来源**（Single Source of Truth）
2. **格式无关的 Agent 描述**（Format-agnostic Agent Descriptor）
3. **双向适配器**（Bidirectional Adapters）
4. **向后兼容**（Backward Compatible）

---

## 一、增强 agent.json 规范

### 1.1 当前 agent.json 结构（推测）

```json
{
  "name": "my-agent",
  "version": "1.0.0",
  "description": "...",
  "author": "...",
  "category": "general",
  "type": "agent",
  "tags": ["tag1"],
  "entry_point": "main.yaml",
  "dependencies": {}
}
```

### 1.2 增强后的 agent.json 规范

```json
{
  "schema_version": "2.0",
  "identity": {
    "name": "code-reviewer",
    "version": "1.2.0",
    "display_name": "Code Reviewer Agent",
    "description": "Reviews code changes and provides feedback",
    "author": "Your Name",
    "license": "MIT",
    "homepage_url": "https://...",
    "source_url": "https://..."
  },
  
  "classification": {
    "category": "utility",
    "type": "agent",
    "tags": ["code-review", "quality", "testing"]
  },
  
  "instructions": {
    "format": "markdown",
    "source": "inline",
    "content": "# Code Reviewer\n\n## What I do\n...",
    "// 或者": "file reference",
    "file": "instructions.md"
  },
  
  "capabilities": [
    {
      "type": "tool_call",
      "name": "analyze_diff",
      "description": "Analyze git diff and find issues"
    },
    {
      "type": "subagent",
      "name": "static_analyzer",
      "entry": "analyzers/static.yaml",
      "description": "Static code analysis subagent"
    },
    {
      "type": "mcp_server",
      "command": "node",
      "args": ["dist/index.js"],
      "tools": ["lint", "format", "test"]
    }
  ],
  
  "compatibility": {
    "platforms": {
      "cursor": {
        "supported": true,
        "format": "slash_command",
        "notes": "Install as .cursor/commands/*.md"
      },
      "claude_code": {
        "supported": true,
        "format": "skill",
        "notes": "Install as .claude/commands/*.md"
      },
      "codebuddy": {
        "supported": true,
        "format": "yaml_frontmatter_md",
        "adapter_required": true
      },
      "github_copilot": {
        "supported": true,
        "format": "agent_instruction"
      },
      "mcp": {
        "supported": true,
        "transport": "stdio"
      }
    },
    "runtime_requirements": {
      "node": ">=18.0.0",
      "python": ">=3.10"
    }
  },
  
  "structure": {
    "entry_point": "main.yaml",
    "subagents": [
      { "name": "worker", "file": "subagents/worker.yaml" },
      { "name": "validator", "file": "subagents/validator.yaml" }
    ],
    "resources": [
      { "type": "prompt_template", "file": "prompts/review.md" },
      { "type": "config", "file": "config/rules.json" }
    ]
  },
  
  "dependencies": {
    "agents": ["linter-agent@^1.0.0"],
    "npm": ["@anthropic/sdk@^1.0.0"],
    "python": ["aiosqlite>=0.19.0"]
  },
  
  "metadata": {
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-06-06T00:00:00Z",
    "publisher": "your-org",
    "download_count": 1523,
    "rating": 4.5
  }
}
```

### 1.3 关键字段说明

| 字段 | 用途 | 必填 |
|-----|------|------|
| `schema_version` | 用于版本演进 | ✅ |
| `instructions` | 核心指令内容，替代 SKILL.md | ✅ |
| `capabilities` | 描述 agent 能做什么 | ✅ |
| `compatibility.platforms` | 显式声明支持哪些平台 | ⚪ |
| `structure` | 描述包内文件结构 | ⚪ |

---

## 二、重构 agent-deploy 适配层

### 2.1 新的适配流程

```
┌─────────────┐
│ agent.json  │ ← 唯一输入
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  AgentDescriptor    │ ← 内部统一格式
│  解析器             │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  适配器注册表        │
│  - CursorAdapter    │
│  - ClaudeAdapter    │
│  - CodeBuddyAdapter │
│  - ...              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  目标工具格式输出    │
│  - .cursor/commands │
│  - .claude/commands │
│  - ...              │
└─────────────────────┘
```

### 2.2 核心代码重构

#### 修改 `adapt.ts`

```typescript
// agent-deploy/node/src/adapt.ts

import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface AgentDescriptor {
  name: string;
  displayName: string;
  version: string;
  description: string;
  instructions: string;  // 核心指令内容
  capabilities: Capability[];
  compatibility: Record<string, any>;
}

export interface Capability {
  type: "tool_call" | "subagent" | "mcp_server";
  name: string;
  description: string;
  [key: string]: any;
}

/**
 * 从 agent 目录加载 agent.json 并解析为统一的 AgentDescriptor
 */
export function loadAgentDescriptor(agentPath: string): AgentDescriptor {
  const agentJsonPath = join(agentPath, "agent.json");
  
  if (!existsSync(agentJsonPath)) {
    throw new Error(`agent.json not found in: ${agentPath}`);
  }
  
  const raw = readFileSync(agentJsonPath, "utf8");
  const agentJson = JSON.parse(raw);
  
  // 提取指令内容
  let instructions = "";
  
  if (agentJson.instructions) {
    if (agentJson.instructions.source === "inline") {
      instructions = agentJson.instructions.content;
    } else if (agentJson.instructions.source === "file") {
      const instructionPath = join(agentPath, agentJson.instructions.file);
      if (existsSync(instructionPath)) {
        instructions = readFileSync(instructionPath, "utf8");
      }
    }
  }
  
  // 向后兼容：如果没有 instructions 字段，尝试读取 SKILL.md
  if (!instructions) {
    const skillPath = join(agentPath, "SKILL.md");
    if (existsSync(skillPath)) {
      instructions = readFileSync(skillPath, "utf8");
      console.warn(`[DEPRECATED] Using SKILL.md as fallback. Consider migrating to agent.json instructions field.`);
    }
  }
  
  if (!instructions) {
    throw new Error(`No instructions found in agent.json or SKILL.md`);
  }
  
  return {
    name: agentJson.identity?.name || agentJson.name,
    displayName: agentJson.identity?.display_name || agentJson.display_name || agentJson.name,
    version: agentJson.identity?.version || agentJson.version || "1.0.0",
    description: agentJson.identity?.description || agentJson.description || "",
    instructions,
    capabilities: agentJson.capabilities || [],
    compatibility: agentJson.compatibility || {},
  };
}

/**
 * 将 AgentDescriptor 适配为目标工具格式
 */
export function adaptAgent(agentPath: string, target: string): AdaptationResult {
  // 1. 加载统一的 AgentDescriptor
  const descriptor = loadAgentDescriptor(agentPath);
  
  // 2. 选择对应的适配器
  const registry = loadRegistry();
  const toolConfig = registry.tools[target];
  
  if (!toolConfig) {
    throw new Error(`Unknown target tool: ${target}`);
  }
  
  // 3. 使用适配器转换
  return adaptDescriptorToTarget(descriptor, target, toolConfig);
}

/**
 * 根据目标工具转换 AgentDescriptor
 */
function adaptDescriptorToTarget(
  descriptor: AgentDescriptor,
  target: string,
  toolConfig: ToolConfig
): AdaptationResult {
  const slug = slugify(descriptor.name);
  
  switch (target) {
    case "cursor":
    case "opencode": {
      // Markdown 格式
      const content = `# ${descriptor.displayName}\n\n${descriptor.description}\n\n${descriptor.instructions}`;
      return {
        content,
        target_file: `.${target}/commands/${slug}.md`,
        format: "markdown",
      };
    }
    
    case "claude_code": {
      // Claude Code skill 格式
      const content = `# /${slug} — ${descriptor.displayName}\n\n## Description\n\n${descriptor.description}\n\n## Instructions\n\n${descriptor.instructions}`;
      return {
        content,
        target_file: `.claude/commands/${slug}.md`,
        format: "markdown",
      };
    }
    
    case "codebuddy": {
      // YAML frontmatter + Markdown
      const frontmatter = `---
name: ${descriptor.name}
version: ${descriptor.version}
description: ${descriptor.description}
---`;
      const content = `${frontmatter}\n\n${descriptor.instructions}`;
      return {
        content,
        target_file: `.codebuddy/skills/${slug}/SKILL.md`,
        format: "yaml+markdown",
      };
    }
    
    case "github_copilot": {
      const content = `# ${descriptor.displayName}\n\n> Version: ${descriptor.version}\n\n${descriptor.description}\n\n## Instructions\n\n${descriptor.instructions}`;
      return {
        content,
        target_file: `.github/agents/${slug}.md`,
        format: "markdown",
      };
    }
    
    case "mcp": {
      // MCP Server 配置
      // 如果 agent 包含 MCP capability，生成配置
      const mcpCap = descriptor.capabilities.find(c => c.type === "mcp_server");
      if (mcpCap) {
        const config = {
          mcpServers: {
            [descriptor.name]: {
              command: mcpCap.command,
              args: mcpCap.args,
              env: mcpCap.env || {},
            },
          },
        };
        return {
          content: JSON.stringify(config, null, 2),
          target_file: `mcp_config_${slug}.json`,
          format: "json",
        };
      }
      throw new Error(`Agent ${descriptor.name} does not have MCP capability`);
    }
    
    // ... 其他平台适配器
    
    default:
      throw new Error(`No adapter implemented for tool: ${target}`);
  }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
```

### 2.3 向后兼容策略

1. **读取顺序**：
   - 优先读取 `agent.json` 的 `instructions` 字段
   - 如果没有，fallback 到 `SKILL.md`
   - 如果都没有，报错

2. **迁移工具**：提供命令将 SKILL.md 迁移到 agent.json

```bash
# 新增 CLI 命令
npx @openpeng/agent-deploy migrate-skill ./my-agent
```

---

## 三、支持双向适配（导入/导出）

### 3.1 从各平台导入为 Agent

```typescript
// agent-deploy/node/src/import.ts

export interface ImportAdapter {
  detect(path: string): boolean;
  extract(path: string): AgentDescriptor;
}

export class CursorImportAdapter implements ImportAdapter {
  detect(path: string): boolean {
    return existsSync(join(path, ".cursor/commands"));
  }
  
  extract(commandPath: string): AgentDescriptor {
    const content = readFileSync(commandPath, "utf8");
    const lines = content.split("\n");
    const title = lines[0].replace(/^#\s*/, "");
    
    return {
      name: basename(commandPath, ".md"),
      displayName: title,
      version: "1.0.0",
      description: lines[2] || "",
      instructions: content,
      capabilities: [],
      compatibility: {
        platforms: {
          cursor: { supported: true, format: "slash_command" },
        },
      },
    };
  }
}

export class ClaudeCodeImportAdapter implements ImportAdapter {
  detect(path: string): boolean {
    return existsSync(join(path, ".claude/commands"));
  }
  
  extract(commandPath: string): AgentDescriptor {
    // 类似实现
  }
}

// 使用
export function importAgentFrom(sourcePath: string, sourceTool: string): AgentDescriptor {
  const adapters: Record<string, ImportAdapter> = {
    cursor: new CursorImportAdapter(),
    claude_code: new ClaudeCodeImportAdapter(),
    // ... 其他
  };
  
  const adapter = adapters[sourceTool];
  if (!adapter) {
    throw new Error(`No import adapter for ${sourceTool}`);
  }
  
  return adapter.extract(sourcePath);
}
```

### 3.2 新增 MCP 工具

```typescript
// 在 index.ts 添加新工具

{
  name: "import_agent",
  description: "Import an agent from a target tool's native format into agent.json format",
  inputSchema: {
    type: "object",
    properties: {
      source_path: { type: "string", description: "Path to the source command/skill file" },
      source_tool: { type: "string", description: "Source tool ID (cursor, claude_code, etc.)" },
      output_dir: { type: "string", description: "Output directory for agent.json" },
    },
    required: ["source_path", "source_tool", "output_dir"],
  },
}
```

---

## 四、市场服务端改进

### 4.1 验证上传的 agent.json

```python
# agent-market/src/market/verify.py

def verify_agent_json(agent_json: dict) -> tuple[bool, list[str]]:
    """验证 agent.json 的完整性和有效性"""
    errors = []
    
    # 必需字段检查
    if "schema_version" not in agent_json:
        errors.append("Missing schema_version field")
    
    if "identity" not in agent_json:
        errors.append("Missing identity section")
    else:
        required_identity = ["name", "version", "description"]
        for field in required_identity:
            if field not in agent_json["identity"]:
                errors.append(f"Missing identity.{field}")
    
    # 指令内容检查
    if "instructions" not in agent_json:
        # 向后兼容：允许没有 instructions 但有 SKILL.md
        errors.append("WARNING: No instructions field found. Consider adding it for better compatibility.")
    else:
        inst = agent_json["instructions"]
        if inst.get("source") == "inline" and not inst.get("content"):
            errors.append("instructions.source is 'inline' but content is empty")
        elif inst.get("source") == "file" and not inst.get("file"):
            errors.append("instructions.source is 'file' but file path is missing")
    
    return (len(errors) == 0, errors)
```

### 4.2 元数据提取优化

```python
# agent-market/src/market/package.py

def extract_metadata(package_path: Path) -> dict:
    """从包中提取 agent.json 元数据"""
    with tarfile.open(package_path, "r:gz") as tar:
        for member in tar.getmembers():
            if member.name.endswith("agent.json"):
                f = tar.extractfile(member)
                if f:
                    agent_json = json.load(f)
                    
                    # 优先使用新格式
                    if "identity" in agent_json:
                        return {
                            "name": agent_json["identity"]["name"],
                            "version": agent_json["identity"]["version"],
                            "display_name": agent_json["identity"].get("display_name", ""),
                            "description": agent_json["identity"].get("description", ""),
                            "author": agent_json["identity"].get("author", ""),
                            # ... 其他字段
                        }
                    else:
                        # 向后兼容旧格式
                        return {
                            "name": agent_json.get("name", ""),
                            "version": agent_json.get("version", "1.0.0"),
                            # ...
                        }
    
    raise ValueError("No agent.json found in package")
```

---

## 五、实施路线图

### Phase 1: 向后兼容改造（2周）

**目标**：不破坏现有功能，添加 agent.json 支持

- [ ] 定义增强的 agent.json 规范 v2.0
- [ ] 修改 `loadAgentDescriptor()` 优先读取 agent.json
- [ ] 保留 SKILL.md fallback 逻辑
- [ ] 更新文档说明新旧格式
- [ ] 编写测试用例

### Phase 2: 双向适配器（3周）

**目标**：支持从各平台导入 agent

- [ ] 实现 ImportAdapter 接口
- [ ] 实现 Cursor/Claude/CodeBuddy 导入适配器
- [ ] 添加 `import_agent` MCP 工具
- [ ] 添加 CLI 命令 `agent-deploy import`
- [ ] 测试导入-修改-导出工作流

### Phase 3: 市场服务端增强（2周）

**目标**：强化 agent.json 验证和元数据处理

- [ ] 增强 `verify.py` 验证逻辑
- [ ] 优化 `extract_metadata()` 支持新格式
- [ ] 添加 schema version 兼容性检查
- [ ] 数据库迁移支持新字段
- [ ] 更新 API 文档

### Phase 4: 弃用 SKILL.md（4周后）

**目标**：逐步移除对 SKILL.md 的依赖

- [ ] 提供迁移工具 `migrate-skill`
- [ ] 批量迁移现有 market agents
- [ ] 发布迁移指南
- [ ] 设置弃用警告
- [ ] 在文档中标记 SKILL.md 为 legacy

### Phase 5: 完整互操作（持续）

**目标**：成为真正的跨平台 agent hub

- [ ] 支持更多平台（Windsurf, Trae, Qodo 等）
- [ ] 实现 agent capability 标准
- [ ] 支持 agent 间互调用
- [ ] 构建 agent 生态系统

---

## 六、迁移指南

### 6.1 为现有 Agent 添加 instructions

```bash
# 使用迁移工具
cd agent-deploy
npm run migrate -- --agent-path /path/to/my-agent --mode inline

# 或手动迁移
```

**手动迁移示例**：

旧的 agent.json:
```json
{
  "name": "code-reviewer",
  "version": "1.0.0",
  "description": "Reviews code"
}
```

新的 agent.json:
```json
{
  "schema_version": "2.0",
  "identity": {
    "name": "code-reviewer",
    "version": "1.0.0",
    "description": "Reviews code changes and provides feedback"
  },
  "instructions": {
    "format": "markdown",
    "source": "file",
    "file": "SKILL.md"
  }
}
```

或者将 SKILL.md 内联：
```json
{
  "instructions": {
    "format": "markdown",
    "source": "inline",
    "content": "# Code Reviewer\n\n## What I do\n\nI review your code..."
  }
}
```

### 6.2 从 Cursor 导入 Agent

```bash
# 将 Cursor command 转换为 agent
npx @openpeng/agent-deploy import \
  --source-tool cursor \
  --source-path .cursor/commands/my-command.md \
  --output-dir ./my-agent

# 生成的目录结构
my-agent/
├── agent.json       # 自动生成
└── instructions.md  # 原始内容
```

---

## 七、预期效果

### 7.1 对用户的改进

✅ **真正的跨平台**：一个 agent 可以无缝运行在 Cursor、Claude Code、CodeBuddy 等工具上
✅ **更好的可移植性**：不依赖特定的 markdown 格式
✅ **更丰富的元数据**：capabilities、compatibility 等信息
✅ **双向互操作**：可以从任何平台导入/导出 agent

### 7.2 对开发者的改进

✅ **清晰的架构**：agent.json 是唯一真相来源
✅ **易于扩展**：添加新平台只需实现适配器接口
✅ **更好的类型安全**：AgentDescriptor 统一类型
✅ **向后兼容**：不破坏现有 agents

### 7.3 对生态的改进

✅ **标准化**：推动 agent 格式标准化
✅ **互操作性**：不同工具的 agents 可以互相转换
✅ **可扩展性**：为未来的 agent 能力预留空间

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 破坏现有功能 | 高 | 保留 SKILL.md fallback，分阶段迁移 |
| 用户学习成本 | 中 | 提供迁移工具和详细文档 |
| 性能影响 | 低 | agent.json 解析很快，可以缓存 |
| 第三方工具不支持 | 中 | 继续支持多种输出格式 |

---

## 附录：完整示例

### 示例 1: 完整的 agent.json

见 [examples/agent.json](examples/agent.json)

### 示例 2: 迁移前后对比

见 [examples/migration-example.md](examples/migration-example.md)

### 示例 3: 各平台适配示例

见 [examples/platform-adapters.md](examples/platform-adapters.md)

---

**提议人**：AI Assistant
**日期**：2026-06-06
**状态**：待审核
