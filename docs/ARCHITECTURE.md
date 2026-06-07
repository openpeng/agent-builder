# 架构概览

## 系统全景

```
┌────────────────────────────────────────────────────────────┐
│                       Agent Market                          │
├────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Cursor  │  │  Claude  │  │CodeBuddy │  │  GitHub  │  │
│  │ Commands │  │ Commands │  │  Skills  │  │  Agents  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │         │
│       ▼             ▼             ▼             ▼         │
│  ┌───────────────────────────────────────────────────┐    │
│  │              Import Adapters (Phase 2)              │    │
│  │     cursor │ claude │ codebuddy │ github            │    │
│  └──────────────────────┬────────────────────────────┘    │
│                         ▼                                  │
│                   ┌──────────┐                             │
│                   │agent.json│  ← 唯一真相来源               │
│                   └────┬─────┘                             │
│                         │                                  │
│       ┌────────────┬────┴────┬────────────┐               │
│       ▼            ▼         ▼            ▼               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Export  │ │ Import  │ │ Market  │ │Runtime  │        │
│  │adapt.ts │ │import.ts│ │upload ↓│ │Pipeline │        │
│  │         │ │         │ │download │ │ Engine  │        │
│  └────┬────┘ └─────────┘ └────┬────┘ └────┬────┘        │
│       │                       │           │              │
│       ▼                       ▼           ▼              │
│  ┌─────────┐            ┌─────────┐ ┌──────────┐        │
│  │AI Tools │            │ Market  │ │Builtin   │        │
│  │Formats  │            │ Service │ │Tools (8) │        │
│  │(9 total)│            │(FastAPI)│ └──────────┘        │
│  └─────────┘            └─────────┘                      │
└────────────────────────────────────────────────────────────┘
```

---

## 核心组件

### 1. agent-deploy (TypeScript/Node.js)

入口文件 `agent-deploy/node/src/`:

| 模块 | 文件 | 职责 |
|------|------|------|
| MCP Server | `index.ts` | 7 个 MCP 工具注册 + stdio transport |
| CLI | `cli.ts` | 10 个命令行命令 |
| Export | `adapt.ts` | agent.json → AI 工具格式 |
| Import | `import.ts` | AI 工具格式 → agent.json |
| Types | `types.ts` | AgentJsonV2, AgentDescriptor 等 |
| Market Client | `market.ts` | 上传/下载/搜索 HTTP 客户端 |
| Detection | `detect.ts` | 自动检测已安装的 AI 工具 |
| Installation | `install.ts` | 安装适配后的文件到目标工具 |
| Templates | `templates.ts` | 5 个 Agent 模板 |
| Errors | `errors.ts` | 12 个用户友好错误处理器 |
| Runtime | `runtime/` | Pipeline 引擎 + 内置工具 |

### 2. Runtime Engine

```
worker.yaml
    │
    ├─→ PipelineParser → PipelineStep[]
    │       ↓
    ├─→ PipelineEngine.execute()
    │       ├─→ TemplateResolver ({{variable}})
    │       ├─→ ConditionEvaluator (when clauses)
    │       ├─→ ErrorHandler (on_fail strategies)
    │       └─→ ToolRegistry.get(tool) → tool.execute(args, ctx)
    │
    ├─→ DependencyResolver
    │       ├─→ AgentCache (manifest.json + semver)
    │       ├─→ MarketAgentLoader (market://)
    │       └─→ FileSystemAgentLoader (file://)
    │
    └─→ SubagentExecutor
            └─→ Child ToolRegistry (parent pointer inheritance)
```

### 3. agent-market (Python/FastAPI)

```
FastAPI Application (port 8321)
    ├─→ Auth Middleware (API Key → role)
    ├─→ Rate Limiting Middleware
    ├─→ Route Handlers
    │       ├─→ POST /api/v1/agents (upload + verify)
    │       ├─→ GET  /api/v1/agents (list/search)
    │       ├─→ GET  /api/v1/agents/{id} (detail)
    │       ├─→ GET  /api/v1/agents/{id}/download
    │       ├─→ DELETE /api/v1/agents/{id}
    │       ├─→ POST /api/v1/agents/{id}/deprecate
    │       ├─→ POST /api/v1/agents/{id}/ratings
    │       └─→ GET  /api/v1/health
    └─→ MarketDatabase (aiosqlite)
            ├─→ agents table
            ├─→ api_keys table
            └─→ ratings table
```

---

## 关键设计决策 (ADR)

### ADR-1: agent.json 为唯一真相来源

**决策**: 所有 Agent 操作以 `agent.json` 为准，`SKILL.md` 仅为 fallback。

**原因**: 消除对特定工具格式的硬依赖，实现真正的跨平台互操作。

### ADR-2: 多级 Fallback 策略

**决策**: `agent.json instructions` → `subagents entry` → `SKILL.md` → `README.md`

**原因**: 向后兼容已有 Agent，零破坏性迁移。

### ADR-3: Context-based ToolRegistry (无全局状态)

**决策**: Phase 6.0 将全局 ToolRegistry 改为 ExecutionContext 传递。

**原因**: 支持嵌套 Agent 执行时各自拥有独立的 tool 集合，父 Agent 的 tool 通过 parent pointer 继承。

### ADR-4: Market Agent 解析使用 `market://` URL scheme

**决策**: 子 Agent 引用使用 `market://agent-name@version` 格式。

**原因**: 明确的协议标识，支持 semver 匹配，cache-first 策略减少网络开销。

### ADR-5: Pipeline 使用 YAML 而非 JSON

**决策**: worker.yaml 作为 pipeline 定义格式。

**原因**: YAML 更适合人类编写多行字符串和注释，模板变量 `{{}}` 在 YAML 中不会转义。

### ADR-6: 默认受限的 ExecutionPolicy (Phase 7)

**决策**: Agent 默认不能执行 Shell/网络操作，需用户显式 `--trusted`。

**原因**: 从 Market 安装的 Agent 不可信，Zero Trust 安全模型。

---

## 数据流

### Import → Market → Deploy (完整闭环)

```
1. Import:  AI Tool Format → ImportAdapter → AgentDescriptor → agent.json
2. Upload:  agent.json → tar.gz → POST /api/v1/agents → Market DB
3. Download: GET /api/v1/agents/{id}/download → tar.gz → AgentCache
4. Deploy:  agent.json → Adapt → AI Tool Format → Install
```

### Runtime 执行流

```
1. Dependency Resolution: agent.json → DependencyResolver → download deps
2. V2 Compat: Check schema_version → V2CompatibilityLayer (if v2)
3. Pipeline Parse: worker.yaml → PipelineEngine
4. Tool Registration: Builtin + MCP + Skills + Memory
5. Execute: Sequential steps with when conditions and on_fail handling
6. Result: Final output + execution summary
```
