# Phase 2: 双向适配器实现

**开始日期**: 2026-06-06  
**预计用时**: 3 周  
**状态**: 🚀 启动

---

## 🎯 Phase 2 目标

实现双向适配器，支持从各 AI 工具导入 Agent 到 Market。

### 核心功能
1. **ImportAdapter 接口** - 统一的导入适配器接口
2. **多平台导入** - 支持从 Cursor、Claude Code、CodeBuddy 等导入
3. **MCP 工具** - 添加 `import_agent` MCP 工具
4. **CLI 命令** - 添加 `agent-deploy import` 命令

---

## 📋 详细任务

### 1. 接口设计 (2 天)

#### 1.1 ImportAdapter 接口
```typescript
interface ImportAdapter {
  // 从特定工具格式导入为 agent.json
  importFrom(sourcePath: string): AgentDescriptor;
  
  // 检测是否为该工具的 agent
  canImport(sourcePath: string): boolean;
  
  // 工具元信息
  getToolInfo(): {
    name: string;
    pattern: string;  // 文件匹配模式
    description: string;
  };
}
```

#### 1.2 AgentDescriptor 扩展
确保 AgentDescriptor 支持所有必要字段：
- identity (name, version, author, etc.)
- instructions (inline/file)
- capabilities (可选)
- compatibility (可选)

#### 交付物
- [ ] `src/import.ts` - ImportAdapter 接口定义
- [ ] `src/types.ts` - 类型定义更新
- [ ] 接口文档

---

### 2. 平台适配器实现 (1 周)

#### 2.1 Cursor 导入适配器
**输入**: `.cursor/commands/*.md`  
**输出**: agent.json v2.0

**逻辑**:
1. 读取 `.cursor/commands/` 目录
2. 解析 markdown 文件
3. 提取元数据（从文件名和内容）
4. 生成 agent.json

```typescript
class CursorImportAdapter implements ImportAdapter {
  canImport(path: string): boolean {
    return path.includes('.cursor/commands') && path.endsWith('.md');
  }
  
  importFrom(sourcePath: string): AgentDescriptor {
    const content = readFileSync(sourcePath, 'utf-8');
    const name = basename(sourcePath, '.md');
    
    return {
      schema_version: "2.0",
      identity: {
        name: slugify(name),
        version: "1.0.0",
        display_name: name,
        description: extractDescription(content),
        author: "Imported from Cursor"
      },
      instructions: {
        format: "markdown",
        source: "inline",
        content: content
      }
    };
  }
}
```

#### 2.2 Claude Code 导入适配器
**输入**: `.claude/commands/*.md`  
**输出**: agent.json v2.0

**逻辑**: 与 Cursor 类似，但需要：
- 识别 Claude Code 特定格式
- 处理可能的 YAML frontmatter
- 提取 slash command 名称

#### 2.3 CodeBuddy 导入适配器
**输入**: `.codebuddy/skills/*/SKILL.md`  
**输出**: agent.json v2.0

**逻辑**:
1. 遍历 `.codebuddy/skills/` 目录
2. 读取 SKILL.md 文件
3. 解析 YAML frontmatter
4. 生成 agent.json

#### 2.4 GitHub Copilot 导入适配器
**输入**: `.github/agents/*.md`  
**输出**: agent.json v2.0

#### 交付物
- [ ] `src/adapters/cursor-import.ts`
- [ ] `src/adapters/claude-import.ts`
- [ ] `src/adapters/codebuddy-import.ts`
- [ ] `src/adapters/github-import.ts`
- [ ] 每个适配器的单元测试

---

### 3. 导入功能集成 (3 天)

#### 3.1 导入管理器
```typescript
class ImportManager {
  private adapters: ImportAdapter[] = [];
  
  registerAdapter(adapter: ImportAdapter): void {
    this.adapters.push(adapter);
  }
  
  detectTool(path: string): ImportAdapter | null {
    return this.adapters.find(a => a.canImport(path));
  }
  
  importAgent(sourcePath: string, outputDir: string): string {
    const adapter = this.detectTool(sourcePath);
    if (!adapter) {
      throw new Error(`No adapter found for: ${sourcePath}`);
    }
    
    const descriptor = adapter.importFrom(sourcePath);
    const agentDir = join(outputDir, descriptor.identity.name);
    
    // 创建目录
    mkdirSync(agentDir, { recursive: true });
    
    // 写入 agent.json
    writeFileSync(
      join(agentDir, 'agent.json'),
      JSON.stringify(descriptor, null, 2)
    );
    
    return agentDir;
  }
}
```

#### 交付物
- [ ] `src/import-manager.ts`
- [ ] 集成测试

---

### 4. MCP 工具添加 (2 天)

#### 4.1 import_agent 工具
```typescript
server.tool(
  "import_agent",
  "Import an agent from an AI tool to agent.json format",
  {
    source_path: z.string().describe("Path to the agent file or directory"),
    output_dir: z.string().optional().describe("Output directory (default: ./imported-agents)"),
    tool: z.string().optional().describe("Force specific tool adapter (cursor, claude_code, etc.)")
  },
  async ({ source_path, output_dir, tool }) => {
    const manager = new ImportManager();
    
    // 注册所有适配器
    manager.registerAdapter(new CursorImportAdapter());
    manager.registerAdapter(new ClaudeImportAdapter());
    manager.registerAdapter(new CodeBuddyImportAdapter());
    manager.registerAdapter(new GitHubImportAdapter());
    
    try {
      const agentDir = manager.importAgent(
        source_path,
        output_dir || './imported-agents'
      );
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Successfully imported agent to: ${agentDir}\n\nYou can now upload this to the market or deploy it to other tools.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Import failed: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);
```

#### 交付物
- [ ] MCP 工具实现
- [ ] 工具文档
- [ ] 使用示例

---

### 5. CLI 命令添加 (2 天)

#### 5.1 import 子命令
```bash
agent-deploy import <source> [options]

Options:
  -o, --output <dir>    Output directory (default: ./imported-agents)
  -t, --tool <name>     Force specific tool adapter
  -d, --dry-run         Show what would be imported without writing
  --help                Show help

Examples:
  # Auto-detect and import
  agent-deploy import .cursor/commands/my-agent.md
  
  # Import from Claude Code
  agent-deploy import .claude/commands/my-skill.md -t claude_code
  
  # Import to specific directory
  agent-deploy import .codebuddy/skills/my-skill -o ./my-agents
  
  # Dry run
  agent-deploy import .github/agents/copilot-agent.md --dry-run
```

#### 交付物
- [ ] CLI 命令实现
- [ ] 命令行帮助文档
- [ ] 使用示例

---

### 6. 测试 (持续)

#### 6.1 单元测试
- [ ] 每个 ImportAdapter 的测试
- [ ] ImportManager 测试
- [ ] 边界情况测试
- [ ] 错误处理测试

#### 6.2 集成测试
- [ ] 端到端导入测试
- [ ] MCP 工具测试
- [ ] CLI 命令测试

#### 6.3 测试用例准备
- [ ] 创建测试用的各平台 agent 样本
- [ ] `.cursor/commands/test-*.md`
- [ ] `.claude/commands/test-*.md`
- [ ] `.codebuddy/skills/test-*`
- [ ] `.github/agents/test-*.md`

#### 目标
- **测试数量**: 新增 20+ 个测试
- **通过率**: 100%
- **覆盖率**: ≥90%

---

### 7. 文档更新 (2 天)

#### 7.1 技术文档
- [ ] ImportAdapter 接口文档
- [ ] 各平台导入指南
- [ ] 导入最佳实践

#### 7.2 用户文档
- [ ] import_agent MCP 工具使用手册
- [ ] CLI import 命令手册
- [ ] 导入示例和教程

#### 7.3 更新现有文档
- [ ] 更新 agent-deploy/README.md
- [ ] 更新 AGENT_FORMATS.md
- [ ] 更新项目 README.md

---

## 📊 验收标准

### 功能性
- [ ] 支持 4 个平台导入 (Cursor, Claude Code, CodeBuddy, GitHub)
- [ ] 自动检测平台类型
- [ ] 生成符合 v2.0 规范的 agent.json
- [ ] MCP 工具正常工作
- [ ] CLI 命令正常工作

### 质量
- [ ] 所有单元测试通过 (≥20 新测试)
- [ ] 集成测试通过
- [ ] 代码编译无错误
- [ ] 文档完整

### 兼容性
- [ ] 不破坏 Phase 1 功能
- [ ] 与现有导出功能兼容
- [ ] 向后兼容

---

## 🗓️ 时间安排

| 任务 | 天数 | 开始 | 结束 |
|-----|------|------|------|
| 1. 接口设计 | 2 | Day 1 | Day 2 |
| 2. 适配器实现 | 5 | Day 3 | Day 7 |
| 3. 功能集成 | 3 | Day 8 | Day 10 |
| 4. MCP 工具 | 2 | Day 11 | Day 12 |
| 5. CLI 命令 | 2 | Day 13 | Day 14 |
| 6. 测试完善 | 3 | Day 15 | Day 17 |
| 7. 文档更新 | 2 | Day 18 | Day 19 |
| 8. 验收测试 | 2 | Day 20 | Day 21 |

**总计**: 21 天 (~3 周)

---

## 📁 新增文件

```
agent-deploy/node/src/
├── import.ts                    # ImportAdapter 接口
├── import-manager.ts            # 导入管理器
└── adapters/
    ├── cursor-import.ts
    ├── claude-import.ts
    ├── codebuddy-import.ts
    └── github-import.ts

agent-deploy/node/tests/
├── import.test.ts               # 导入功能测试
└── adapters/
    ├── cursor-import.test.ts
    ├── claude-import.test.ts
    ├── codebuddy-import.test.ts
    └── github-import.test.ts

docs/phase2/
├── PHASE2_PLAN.md              # 本文件
├── IMPORT_ADAPTER_SPEC.md      # 接口规范
└── IMPORT_GUIDE.md             # 导入指南
```

---

## 🎯 成功标准

Phase 2 成功完成的标志：
1. ✅ 4 个平台导入适配器工作正常
2. ✅ MCP 工具可以导入 agents
3. ✅ CLI 命令可以导入 agents
4. ✅ 所有测试通过 (≥51 tests total)
5. ✅ 文档完整更新
6. ✅ 可以完成完整的循环：导入 → 上传 Market → 下载 → 部署

---

## 🚧 风险与挑战

### 技术风险
1. **格式差异** - 各平台格式可能差异很大
   - 缓解: 先支持简单格式,逐步扩展
   
2. **元数据缺失** - 某些平台可能缺少关键元数据
   - 缓解: 提供合理默认值,允许手动补充

3. **复杂度** - 导入逻辑可能比导出复杂
   - 缓解: 充分测试,先做 MVP

### 项目风险
1. **时间** - 3 周可能不够
   - 缓解: 分优先级,核心功能优先

2. **测试覆盖** - 需要准备大量测试用例
   - 缓解: 复用现有样本,社区贡献

---

## 📝 备注

- Phase 2 是 Phase 1 的逆向过程
- 重点是实现双向互操作
- 为 Phase 3 市场端增强做准备

---

**文档版本**: 1.0  
**最后更新**: 2026-06-06  
**下次审查**: Day 7 (中期检查)
