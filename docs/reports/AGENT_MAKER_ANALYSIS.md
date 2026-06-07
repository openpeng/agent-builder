# Agent Maker Tutorial 分析与集成

**日期**: 2026-06-06
**来源**: PilotDeck Market (agent-maker-tutorial v2.1.0)

---

## 一、agent-maker-tutorial 核心价值

### 1. 完整的 Agent 开发文档
- 📖 **全面的规范说明**：agent.json 字段详解
- 🔧 **工作流编写指南**：worker.yaml 语法和最佳实践
- 🚀 **MCP 开发教程**：Python 和 Node.js 双版本
- 📦 **发布流程**：三种发布方式（MarketClient / curl / MainAgent）

### 2. 实用的模板文件
- `templates/minimal-agent.json` — 最小可用配置
- `templates/full-agent.json` — 完整功能配置
- `templates/worker.yaml` — 工作流模板

### 3. 与我们改进方案的对比

| 维度 | agent-maker-tutorial | 我们的改进方案 |
|-----|---------------------|--------------|
| **agent.json 结构** | 基于 `identity` + `subagents` | 基于 `identity` + `instructions` + `capabilities` |
| **核心理念** | PilotDeck Agent (worker.yaml + subagents) | 跨平台 Agent (agent.json 为中心) |
| **指令来源** | 无 `instructions` 字段，依赖 worker.yaml | `instructions` 字段 (inline/file) |
| **适用场景** | PilotDeck 生态内的复杂工作流 | 跨 AI 工具的通用 agent 格式 |
| **MCP 支持** | ✅ 详细的 MCP 开发教程 | ⚪ 待补充 MCP 教程 |
| **向后兼容** | N/A (新格式) | ✅ SKILL.md fallback |

---

## 二、关键发现

### 1. agent.json 格式差异

**agent-maker-tutorial 的格式**：
```json
{
  "identity": {
    "name": "my-agent",
    "version": "1.0.0",
    "description": "...",
    "author": "..."
  },
  "entry": { "main_subagent": "worker" },
  "subagents": [
    { "name": "worker", "path": "worker.yaml" }
  ],
  "category": "general",
  "type": "agent"
}
```

**我们改进方案的格式**：
```json
{
  "schema_version": "2.0",
  "identity": {
    "name": "my-agent",
    "version": "1.0.0",
    "description": "...",
    "author": "..."
  },
  "instructions": {
    "format": "markdown",
    "source": "inline",
    "content": "# Agent instructions..."
  },
  "capabilities": [...],
  "compatibility": {...}
}
```

**关键差异**：
- ❌ agent-maker-tutorial **没有 `instructions` 字段**
- ✅ agent-maker-tutorial 有 `entry` 和 `subagents` 字段（工作流导向）
- ✅ 我们的方案有 `instructions` 和 `capabilities` 字段（通用导向）

### 2. 两种 Agent 范式

#### 范式 A: PilotDeck Agent (agent-maker-tutorial)
```
Agent = agent.json + worker.yaml + subagents
核心：工作流编排（Pipeline）
适用：复杂的多步骤任务自动化
```

#### 范式 B: 跨平台 Agent (我们的方案)
```
Agent = agent.json (包含 instructions)
核心：指令式描述（Instructions）
适用：AI 工具间的互操作
```

### 3. 互补性

两种方案并非冲突，而是互补：
- **PilotDeck Agent** 适合 **复杂工作流编排**（如自动化测试、数据处理 Pipeline）
- **跨平台 Agent** 适合 **AI 辅助编程**（如 Cursor Commands、Claude Skills）

---

## 三、集成方案

### 方案 A: 扩展我们的 agent.json 规范（推荐）

**目标**：同时支持两种范式

```json
{
  "schema_version": "2.0",
  "identity": { ... },
  
  // 跨平台 Agent 字段
  "instructions": {
    "format": "markdown",
    "source": "inline",
    "content": "..."
  },
  
  // PilotDeck Agent 字段（可选）
  "entry": {
    "main_subagent": "worker"
  },
  "subagents": [
    { "name": "worker", "path": "worker.yaml" }
  ],
  
  // 通用字段
  "capabilities": [...],
  "compatibility": {...}
}
```

**优点**：
- ✅ 向后兼容 PilotDeck Agent
- ✅ 支持跨平台部署
- ✅ 灵活：可以只有 instructions，或只有 subagents，或两者都有

**适配逻辑**：
```typescript
function loadAgentDescriptor(agentPath: string): AgentDescriptor {
  const agentJson = JSON.parse(readFileSync(join(agentPath, "agent.json")));
  
  let instructions = "";
  
  // 1. 优先使用 instructions 字段
  if (agentJson.instructions) {
    instructions = extractInstructions(agentJson.instructions, agentPath);
  }
  
  // 2. 如果没有 instructions 但有 subagents，生成描述性指令
  else if (agentJson.subagents) {
    instructions = generateDescriptionFromSubagents(agentJson);
  }
  
  // 3. Fallback to SKILL.md
  else if (existsSync(join(agentPath, "SKILL.md"))) {
    instructions = readFileSync(join(agentPath, "SKILL.md"), "utf8");
  }
  
  return { name, instructions, ... };
}
```

### 方案 B: 保持两个独立规范

**不推荐**：会造成生态分裂

---

## 四、需要改进的地方

### 1. agent-maker-tutorial 需要补充 instructions

**当前问题**：
- agent-maker-tutorial 自己的 agent.json 没有 instructions 字段
- 如果用我们改进后的 adapt.ts 适配它，会失败（找不到 instructions）

**解决方案**：
为 agent-maker-tutorial 添加 instructions 字段：

```json
{
  "identity": { ... },
  "instructions": {
    "format": "markdown",
    "source": "file",
    "file": "README.md"
  },
  "entry": { "main_subagent": "worker" },
  "subagents": [ ... ]
}
```

或者自动生成：
```json
{
  "instructions": {
    "format": "markdown",
    "source": "inline",
    "content": "# Agent Maker Tutorial\n\n教会 AI 如何制作和发布 PilotDeck Agent。\n\n## 使用方法\n\n此 Agent 包含一个主工作流 `worker`，用于引导用户创建 Agent 包。"
  }
}
```

### 2. 我们的规范需要补充工作流支持

**改进**：在 `AGENT_JSON_SPEC_V2.md` 中添加：

```markdown
## 可选字段：工作流编排

如果 Agent 包含复杂的多步骤工作流，可以使用以下字段：

### entry
入口配置

```json
{
  "entry": {
    "main_subagent": "worker"
  }
}
```

### subagents
子 Agent 列表

```json
{
  "subagents": [
    {
      "name": "worker",
      "path": "worker.yaml",
      "description": "主工作流"
    }
  ]
}
```
```

---

## 五、MCP 教程的价值

agent-maker-tutorial 的 MCP 部分非常详细，我们应该：

1. **提取并整合到我们的文档**
   - 复制 MCP 开发指南到 `docs/MCP_GUIDE.md`
   - 链接到我们的 agent-deploy 项目

2. **更新 agent-deploy 的 README**
   - 添加 "如何开发 MCP Agent" 章节
   - 引用 agent-maker-tutorial 的示例

3. **创建 MCP Agent 模板**
   - 在 `agent-deploy/templates/` 下添加 MCP Agent 模板
   - Python 和 Node.js 双版本

---

## 六、行动计划

### 立即执行（今天）

1. ✅ 分析 agent-maker-tutorial
2. ⏳ 更新 `AGENT_JSON_SPEC_V2.md`，添加 `entry` 和 `subagents` 字段支持
3. ⏳ 改进 `loadAgentDescriptor()` 支持 subagents 格式
4. ⏳ 创建 MCP 开发指南文档

### 短期（本周）

1. 创建测试 agent 验证两种格式都能正常工作
2. 提取 agent-maker-tutorial 的模板到我们的项目
3. 编写文档：如何从 PilotDeck Agent 迁移到跨平台格式

### 中期（下周）

1. 为 agent-maker-tutorial 贡献 instructions 字段
2. 发布更新版本到市场
3. 编写博客文章介绍两种 Agent 范式

---

## 七、代码示例：支持两种格式

```typescript
// agent-deploy/node/src/adapt.ts

function loadAgentDescriptor(agentPath: string): AgentDescriptor {
  const agentJsonPath = join(agentPath, "agent.json");
  const agentJson = JSON.parse(readFileSync(agentJsonPath, "utf8"));
  
  let instructions = "";
  
  // 策略 1: 从 instructions 字段读取（跨平台 Agent）
  if (agentJson.instructions) {
    if (agentJson.instructions.source === "inline") {
      instructions = agentJson.instructions.content;
    } else if (agentJson.instructions.source === "file") {
      const file = join(agentPath, agentJson.instructions.file);
      instructions = readFileSync(file, "utf8");
    }
  }
  
  // 策略 2: 从 subagents 生成描述（PilotDeck Agent）
  else if (agentJson.subagents && agentJson.subagents.length > 0) {
    const identity = agentJson.identity || {};
    const entry = agentJson.entry?.main_subagent || agentJson.subagents[0].name;
    
    instructions = `# ${identity.display_name || identity.name}

${identity.description || ""}

## 工作流

此 Agent 包含 ${agentJson.subagents.length} 个子工作流：

${agentJson.subagents.map((sub: any) => `- **${sub.name}** (\`${sub.path}\`): ${sub.description || ""}`).join("\n")}

入口工作流：**${entry}**

## 使用方法

此 Agent 基于 PilotDeck 工作流编排。详细配置请查看各 \`.yaml\` 文件。
`;
  }
  
  // 策略 3: Fallback to SKILL.md
  else if (existsSync(join(agentPath, "SKILL.md"))) {
    instructions = readFileSync(join(agentPath, "SKILL.md"), "utf8");
    console.warn(`[DEPRECATED] Using SKILL.md as fallback`);
  }
  
  // 策略 4: 使用 README.md
  else if (existsSync(join(agentPath, "README.md"))) {
    instructions = readFileSync(join(agentPath, "README.md"), "utf8");
    console.warn(`[FALLBACK] Using README.md as instructions`);
  }
  
  if (!instructions) {
    throw new Error(`No instructions found in agent.json, SKILL.md, or README.md`);
  }
  
  return {
    name: agentJson.identity?.name || agentJson.name,
    displayName: agentJson.identity?.display_name || agentJson.name,
    version: agentJson.identity?.version || "1.0.0",
    description: agentJson.identity?.description || "",
    instructions,
    capabilities: agentJson.capabilities || [],
    compatibility: agentJson.compatibility || {},
  };
}
```

---

## 八、总结

### agent-maker-tutorial 的优点
✅ 完整的文档和教程
✅ 实用的模板文件
✅ 详细的 MCP 开发指南
✅ PilotDeck 工作流范式

### 需要改进的地方
❌ 缺少 `instructions` 字段，不符合跨平台标准
❌ 依赖 PilotDeck 特定的 worker.yaml 格式

### 集成方案
✅ **扩展我们的规范**，同时支持两种范式
✅ **改进适配器**，自动从 subagents 生成 instructions
✅ **补充文档**，提取 MCP 教程
✅ **向后兼容**，支持 PilotDeck Agent、跨平台 Agent、SKILL.md

---

**结论**：agent-maker-tutorial 是一个宝贵的资源，我们应该吸收其优点（MCP 教程、工作流范式），同时保持我们改进方案的核心理念（agent.json 为中心、跨平台互操作）。
