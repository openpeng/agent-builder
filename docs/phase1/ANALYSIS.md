# Agent Market 核心理念与实现差异分析

## 分析日期
2026-06-06

## 核心理念（目标愿景）

根据你的描述，agent-market 的核心理念应该是：

1. **Agent 作为标准单位**：上传到市场的是 agent，下载下来的也是 agent
2. **跨平台互操作性**：下载的 agent 可以适配各个支持子 agent 或 agent 交互的 AI 工具
3. **通用性和可移植性**：不应该只是"从 skill 到 agent 再到 skill"的封闭循环

## 当前实现分析

### 1. agent-market（市场服务）

**实现方式：**
- 以 `agent.json` 为核心元数据格式
- 支持打包 `.tar.gz` / `.zip` 格式上传
- 数据库存储 agent 信息（id, name, version, category, type 等）
- `AgentType` 枚举包括：`AGENT`, `SUBAGENT`, `SKILL`, `WORKFLOW`

**符合理念的部分：**
✅ Agent 作为标准格式存储和分发
✅ 使用 `agent.json` 作为统一元数据格式
✅ 支持多种类型（agent/subagent/skill/workflow）

**存在的问题：**
❌ `type` 字段中包含 "skill"，暗示可能支持 skill 直接上传
❌ 从代码看不出对"纯 agent 格式"的强制要求

### 2. agent-deploy（部署工具）

**实现方式：**
- **核心输入**：读取 `SKILL.md` 文件（第 52-54 行 adapt.ts）
- **适配逻辑**：将 SKILL.md 转换为不同 AI 工具的格式
  - Cursor: `.cursor/commands/*.md`
  - Claude Code: `.claude/commands/*.md`
  - CodeBuddy: `.codebuddy/skills/*/SKILL.md`
  - GitHub Copilot: `.github/agents/*.md`
  - 等等
- **工作流程**：检测工具 → 下载 agent → **提取 SKILL.md** → 适配 → 安装

**核心问题所在：**
❌ **硬编码依赖 SKILL.md**：`adaptAgent()` 函数直接查找 `SKILL.md` 文件
❌ **单向转换**：只支持 SKILL.md → 目标工具格式，不支持 agent.json → 目标工具格式
❌ **格式假设**：假设所有 market agent 都包含 SKILL.md

```typescript
// agent-deploy/node/src/adapt.ts:52-54
export function adaptAgent(agentPath: string, target: string): AdaptationResult {
  const skillPath = join(agentPath, "SKILL.md");
  if (!existsSync(skillPath)) {
    throw new Error(`SKILL.md not found in agent directory: ${agentPath}`);
  }
```

### 3. 当前架构的本质

**实际工作流程：**
```
Skill (SKILL.md) → 包装成 agent.json + SKILL.md → 上传 Market 
→ 下载解压 → 提取 SKILL.md → 转换为各工具格式
```

**核心问题：**
这是一个 **"Skill-centric"** 架构，而非 **"Agent-centric"** 架构：
- Agent 只是 Skill 的传输容器
- 实际转换和部署都基于 SKILL.md
- Agent.json 在部署阶段被忽略

## 理想的 Agent-centric 架构

### 应该是什么样的

```
Agent (agent.json + 子文件) → 上传 Market 
→ 下载 → 读取 agent.json 元数据 → 根据目标工具生成对应格式
```

### 关键改进点

1. **agent.json 作为唯一真相来源**
   - 所有元数据从 agent.json 读取
   - 适配器基于 agent.json 生成目标格式
   - SKILL.md 应该是可选的向后兼容格式

2. **通用 Agent 描述符**
   - Agent.json 应包含足够信息描述 agent 的能力
   - 支持多种子 agent/工具调用描述
   - 不依赖特定 AI 工具的 markdown 格式

3. **双向适配器**
   - 支持从各 AI 工具格式 → Agent.json（上传时）
   - 支持从 Agent.json → 各 AI 工具格式（下载时）
   - SKILL.md 只是其中一种源格式

4. **Agent 互操作标准**
   ```json
   {
     "identity": { "name": "...", "version": "..." },
     "capabilities": [
       { "type": "tool_call", "name": "search", "description": "..." },
       { "type": "subagent", "name": "worker", "entry": "worker.yaml" }
     ],
     "instructions": {
       "format": "markdown|yaml|json",
       "content": "..." // 或 "file": "instructions.md"
     },
     "compatibility": {
       "mcp": true,
       "cursor_commands": true,
       "claude_skills": true
     }
   }
   ```

## 具体偏差总结

| 维度 | 理念目标 | 当前实现 | 偏差程度 |
|-----|---------|---------|---------|
| **上传格式** | Agent (agent.json) | Agent.json + SKILL.md | ⚠️ 中等 |
| **下载格式** | Agent (agent.json) | 实际依赖 SKILL.md | 🔴 严重 |
| **适配输入** | Agent.json 元数据 | SKILL.md 文件 | 🔴 严重 |
| **跨工具支持** | 通用 agent 格式 | Skill markdown 转换 | 🔴 严重 |
| **向后兼容** | 支持多种源格式 | 仅支持 SKILL.md | 🔴 严重 |

## 为什么会这样

**推测原因：**
1. agent-deploy 可能是从早期 skill 系统演化而来
2. 为了快速支持多个 AI 工具，选择了 markdown 作为最小公分母
3. Agent.json 被设计为元数据容器，但没有成为适配的核心输入

## 建议的改进方向

### 短期改进（向后兼容）
1. 在 `adaptAgent()` 中优先读取 `agent.json`
2. 从 `agent.json` 的 `instructions` 字段提取指令内容
3. 保留 SKILL.md 作为 fallback 格式
4. 添加 agent.json → 各工具格式的适配器

### 长期改进（重构）
1. 定义标准 Agent Descriptor 格式
2. 实现双向适配器（导入/导出）
3. 支持从 Cursor/Claude/CodeBuddy 原生格式导入为 agent
4. Agent.json 成为唯一的元数据和指令来源
5. 移除对 SKILL.md 的硬依赖

## 验证建议

尝试以下测试来确认问题：
1. 创建一个只有 agent.json 没有 SKILL.md 的 agent，尝试部署 → 应该失败
2. 修改 agent.json 的 description，但不改 SKILL.md → 部署后应该使用旧描述
3. 从 Cursor 导出一个 command，尝试转换为 agent 上传 → 目前无此功能

---

**结论：当前实现本质上是 "SKILL.md 分发系统 + agent.json 元数据包装"，而非真正的 "Agent 互操作平台"。**
