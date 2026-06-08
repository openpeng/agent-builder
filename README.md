# Agent Market

**一个跨平台的 AI Agent 市场与部署系统**

[![Status](https://img.shields.io/badge/Phase_6-完成-brightgreen.svg)](./STATUS.md)
[![Tests](https://img.shields.io/badge/Tests-345+-brightgreen.svg)](./agent-deploy/node/tests/)
[![Docs](https://img.shields.io/badge/Docs-30+_files-blue.svg)](./docs/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Read_First-red.svg)](./docs/SECURITY.md)

---

## 项目简介

Agent Market 是一个 **Agent-centric** 的跨平台 AI Agent 互操作平台：

- **以 agent.json 为核心** — 统一的 Agent 描述格式，消除工具锁定
- **双向互操作** — Export (部署到 AI 工具) + Import (从 AI 工具导入)
- **跨平台分发** — 支持 8+ AI 编码工具的格式转换
- **Market 市场** — 上传、搜索、下载、评分 Agent
- **Runtime 引擎** — YAML Pipeline 引擎，8 个内置工具 + 子 Agent 编排

> **安全提示**: 从 Market 下载的 Agent 默认在受限模式下运行。使用 `--trusted` 标志前请确保信任来源。详见 [SECURITY.md](./docs/SECURITY.md)。

---

## 当前进度

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | Export — 部署到 AI 工具 | ✅ 完成 |
| Phase 2 | Import — 从 AI 工具导入 | ✅ 完成 |
| Phase 3 | Market Integration — 上传/下载 | ✅ 完成 |
| Phase 4 | Enhanced UX — 列表/搜索/错误处理 | ✅ 完成 |
| Phase 5 | Runtime Engine — Pipeline + 内置工具 | ✅ 完成 |
| Phase 6 | Agent Composition — 依赖/缓存/编排 | ✅ 完成 |
| Phase 7 | Security & Quality — 安全/质量治理 | 📋 规划中 |

---

## 文档导航

| 文档 | 用途 |
|------|------|
| [快速开始](docs/QUICK_START.md) | 5 分钟上手 |
| [Agent 开发指南](docs/AGENT_DEV_GUIDE.md) | 从零创建 Agent |
| [排错手册](docs/TROUBLESHOOTING.md) | 常见问题 |
| [Market API](docs/API.md) | REST 接口 |
| [架构概览](docs/ARCHITECTURE.md) | 系统设计 |
| [安全模型](docs/SECURITY.md) | 安全策略 |

---

## 快速开始

### 初始化 Agent

```bash
# 从模板创建
agent-deploy init agent-builder -n code-reviewer

# 列出可用模板
agent-deploy templates
```

### 部署 Agent 到 AI 工具

```bash
# 自动检测工具并部署
agent-deploy deploy ./my-agent

# 指定工具
agent-deploy deploy ./my-agent --tool cursor
```

### 从 Market 下载并使用

```bash
# 一键下载 + 适配 + 安装
agent-deploy use agent-maker-tutorial

# 从 Market 搜索
agent-deploy search "code review"
```

### 运行 Agent (Runtime Engine)

```bash
# 执行 Agent Pipeline
agent-deploy run ./my-agent --args "file=src/app.ts"

# 调试模式
agent-deploy run ./my-agent --verbose --dry-run
```

### 从 AI 工具导入 Agent

```bash
# 从 Cursor 导入
agent-deploy import .cursor/commands/my-agent.md

# 预览模式
agent-deploy import .claude/commands/skill.md --dry-run
```

### 发布到 Market

```bash
# 上传 Agent
agent-deploy upload ./my-agent --market http://tx.aitboy.cn:15795 --api-key pd_mkt_xxx
```

---

## 架构概览

```
agent.json (唯一真相来源)
    │
    ├──→ [Export] adapt.ts → 8+ AI 工具格式
    │
    ├──→ [Import] import-manager.ts → agent.json
    │
    ├──→ [Market] upload/download/search
    │
    └──→ [Runtime] Pipeline Engine
              ├── 8 内置工具 (read/write/bash/glob/llm/web_fetch/web_search/invoke_agent)
              ├── MCP 工具集成
              ├── 子 Agent 编排
              └── 依赖解析 + 缓存
```

---

## 支持的工具

| 方向 | 工具 | 数量 |
|------|------|------|
| Export | Cursor, Claude Code, CodeBuddy, GitHub Copilot, OpenCode, Windsurf, Trae, Aider, AGENTS.md | 9 |
| Import | Cursor, Claude Code, CodeBuddy, GitHub Copilot | 4 |

---

## 测试

| 测试套件 | 测试数 | 状态 |
|----------|--------|------|
| Export (adapt) | 22 | ✅ |
| Import | 31 | ✅ |
| Pipeline Engine | 87 | ✅ |
| Built-in Tools | 127 | ✅ |
| Subagent | 36 | ✅ |
| V2 Compat | 18 | ✅ |
| CLI / E2E | 13 | ✅ |
| Other (server/context/parser/template/registry) | 11+ | ✅ |
| **总计** | **345+** | **✅** |

```bash
cd agent-deploy/node && npm test
```

---

## 项目结构

```
agent-market/
├── agent-deploy/           # 部署工具 (TypeScript, Node.js)
│   └── node/src/
│       ├── adapt.ts        # Export: agent.json → AI 工具
│       ├── import.ts       # Import: AI 工具 → agent.json
│       ├── cli.ts          # CLI 入口 (10 命令)
│       ├── index.ts        # MCP Server (7 工具)
│       ├── market.ts       # Market 客户端
│       └── runtime/        # Runtime Engine
│           ├── pipeline.ts # Pipeline 引擎
│           ├── tools/      # 8 内置工具
│           └── ...
├── agent-market/           # Market 服务 (Python, FastAPI)
│   └── src/market/
│       ├── server.py       # REST API
│       ├── database.py     # SQLite
│       └── auth.py         # API Key 认证
├── agent-protocol/         # Agent 协议规范
│   └── specs/              # agent-json-v3, worker-yaml, etc.
├── docs/                   # 阶段文档 (30+ 份)
└── test-agents/            # 测试用例
```

---

## 路线图

### ✅ Phase 1-6: 已全部完成
- Export (agent.json → 9 AI 工具格式)
- Import (4 AI 工具格式 → agent.json)
- Market (上传/下载/搜索)
- UX 增强 (列表/信息/错误处理/模板)
- Runtime (Pipeline + 8 内置工具 + 子 Agent 编排)
- Composition (Market 依赖解析 + Agent 缓存 + `use` 命令)

### 📋 Phase 7: 安全 & 质量治理 (进行中)
- Runtime 沙箱与权限模型
- 上传包安全扫描
- API Key 哈希存储
- Agent 生命周期管理 (active/deprecated/suspended)
- 发布前质量门禁
- Rate Limiting

---

## 贡献

欢迎贡献。开发环境要求：

- Node.js 18+
- Python 3.10+
- TypeScript 5.7+

```bash
# 安装依赖
cd agent-deploy/node && npm install
cd agent-market && pip install -r requirements.txt

# 运行测试
cd agent-deploy/node && npm test
cd agent-market && pytest
```

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## License

MIT License

---

**最后更新**: 2026-06-07  
**维护者**: Peng Xiao
