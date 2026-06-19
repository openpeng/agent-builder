# 快速开始

5 分钟上手 Agent Market。

---

## 安装

```bash
# Node.js 18+
cd agent-deploy/node
npm install
npm run build
```

## 核心命令

### 1. 从市场获取 Agent（推荐起点）

```bash
# 下载到本地 ./agents/ 目录
agent-deploy use code-reviewer

# 列出所有可用 Agent
agent-deploy search "code"

# 查看 Agent 详情
agent-deploy info code-reviewer
```

### 2. 运行 Agent

```bash
# 受限模式（默认，安全）
agent-deploy run ./agents/code-reviewer --args "file=src/app.ts"

# 信任模式（允许网络/Shell）
agent-deploy run ./agents/code-reviewer --trusted --args "file=src/app.ts"
```

### 3. 创建自己的 Agent

```bash
# 从模板创建
agent-deploy templates          # 列出可用模板
agent-deploy init code-reviewer -n my-reviewer  # 创建Agent

# 编辑 worker.yaml 定义流程
cd my-reviewer
vim worker.yaml

# 运行调试
agent-deploy run . --trusted
```

### 4. 发布到 Market

```bash
agent-deploy upload ./my-reviewer -m http://market.example.com
```

## 常用工作流

### 文本总结 + 通知（并行）

`worker.yaml`:
```yaml
pipeline:
  - step: parallel_work
    invoke_parallel:
      - agent: text-summarizer
        with:
          input_file: "{{file}}"
      - agent: notification-agent
        with:
          title: "完成"
          body: "{{file}} 总结完毕"
    on_fail: continue
```

### LLM 调用（带重试）

`worker.yaml`:
```yaml
pipeline:
  - step: analyze
    tool: llm_chat
    args:
      system_prompt: "你是代码分析专家"
      prompt: "分析: {{code}}"
    on_fail:
      retry:
        max_attempts: 3
        backoff: "exponential"
```

## 目录约定

```
project/
├── agents/              # 本地Agent（不侵入系统配置）
│   ├── code-reviewer/
│   └── debugger/
├── .codebuddy/          # 仅项目可见的AI工具配置（agent-deploy use 不再写入这里）
└── .claude/
```

## 下一步

- [Agent 开发指南](AGENT_DEV_GUIDE.md) — 从零创建 Agent
- [排错手册](TROUBLESHOOTING.md) — 常见问题
- [Market API 参考](API.md) — REST 接口
- [架构概览](ARCHITECTURE.md) — 系统设计
