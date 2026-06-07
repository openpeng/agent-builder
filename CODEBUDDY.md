# CODEBUDDY.md

## 项目概述

Agent Market 是一个跨平台 AI Agent 互操作系统。核心理念: **agent.json 为唯一真相来源**，消除 AI 工具锁定。

## 关键路径

| 组件 | 路径 | 技术栈 |
|------|------|--------|
| 部署工具 (主) | `agent-deploy/node/` | TypeScript 5.7, Node.js 18+ |
| Runtime 引擎 | `agent-deploy/node/src/runtime/` | TypeScript, YAML Pipeline |
| Market 服务 | `agent-market/` | Python 3.10, FastAPI, aiosqlite |
| Agent 协议 | `agent-protocol/specs/` | Markdown 规范文档 |

## 常用命令

```bash
cd agent-deploy/node
npm run build      # tsc && cp src/templates/*.json dist/templates/
npm test           # Vitest, 345+ tests
npm run lint       # ESLint
npm run format     # Prettier

cd agent-market
pip install -r requirements.txt && pytest
```

## 核心文件

| 文件 | 职责 |
|------|------|
| `agent-deploy/node/src/cli.ts` | CLI 入口，10 命令 |
| `agent-deploy/node/src/adapt.ts` | Export (agent.json → AI 工具) |
| `agent-deploy/node/src/import.ts` | Import (AI 工具 → agent.json) |
| `agent-deploy/node/src/runtime/pipeline.ts` | Pipeline 执行引擎 |
| `agent-deploy/node/src/runtime/tools/` | 8 内置工具 |
| `agent-deploy/node/src/runtime/policy.ts` | 安全策略与沙箱 |
| `agent-market/src/market/server.py` | REST API |
| `agent-market/src/market/database.py` | SQLite 数据库 |

## 架构约定

1. **agent.json 是唯一真相来源** — 所有操作以此为基准
2. **零破坏性变更** — 保持 100% 向后兼容
3. **Context-based ToolRegistry** — 无全局状态，通过 ExecutionContext 传递
4. **默认不信任** — 所有 Agent 默认受限，需 `--trusted` 显式授权
5. **工具错误不抛异常** — 返回 `{ success: false, error }`，让 Pipeline `on_fail` 决策
6. **agent context 双路径** — 同时设置 `{ name }` 和 `{ identity: { name } }`

## 开发注意事项

### Context/Env 传递链路

```
process.env → cli.ts envVars → ExecutionContext.env → invoke_agent getAllEnv → 子Agent.env
```

- **必须**在创建 ExecutionContext 时传入 `env: { ...process.env }`
- invoke_agent 创建子 context **必须**调用 `getAllEnv(parentCtx)` 继承环境变量
- 子Agent 创建时必须同步调用 `getPolicyRegistry().propagateTrust(parent, child)`

### 模板变量系统

- 支持 `{{var}}`、`{{steps.X.output}}`、`{{shared.key}}`、`{{env.KEY}}`
- 支持深层属性 `{{steps.X.output.content.field}}`（TemplateResolver 级联访问）
- 单变量 `{{var}}` 保持类型；多变量字符串中执行 `String(value)` 转换
- worker.yaml 变量名与 Pipeline 参数命名空间共享，避免冲突

### LLM 工具配置

- API Key 回退链: `args.api_key → env.ANTHROPIC_API_KEY → env.ANTHROPIC_AUTH_TOKEN`
- API Base 回退链: `args.api_base → env.ANTHROPIC_BASE_URL → env.OPENAI_BASE_URL`
- 模型回退链: `args.model → env.ANTHROPIC_MODEL → env.OPENAI_MODEL → 硬编码默认`
- 默认模型: `claude-3-5-sonnet-latest`（兼容性优于 `-20241022`）

### 构建流程

```bash
# 编译 + 复制模板资源（tsc 不会自动复制 .json）
tsc && cp src/templates/*.json dist/templates/
```

### 路径处理

- Windows 环境使用正斜杠 `/`
- 使用 `path.resolve()` 统一规范化
- 子Agent路径解析: 兄弟目录 → cwd → Market 回退

## 当前状态

- Phase 1-7 核心完成 (345+ tests, 100% pass)
- 详见 `STATUS.md`
