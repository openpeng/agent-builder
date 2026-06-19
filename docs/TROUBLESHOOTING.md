# 排错手册

常见问题及解决方案。

---

## 运行时错误

### LLM 调用失败: 503 / 5xx

```
llm_chat: API call failed
  Provider:  anthropic
  Status:    503
  Hint: Upstream temporarily unavailable — provider fallback will be attempted
```

**原因**: 上游 LLM 服务暂时不可用。

**解决**:
1. 系统会自动尝试 fallback provider（anthropic → openai_compatible）
2. worker.yaml 中加 `on_fail: retry` 自动重试:
   ```yaml
   on_fail:
     retry:
       max_attempts: 3
       backoff: "exponential"
   ```
3. 检查 API Key 是否有效

### 网络访问被阻止

```
web_fetch: Network access is blocked by security policy.
Use --trusted flag to allow network requests
```

**解决**: 添加 `--trusted` 标志:
```bash
agent-deploy run ./agent --trusted
```

### Shell 命令被阻止

```
bash: Shell execution is blocked by security policy.
```

**解决**: 
1. 不推荐给Agent Shell权限。考虑使用 `write_file`/`read_file` 替代
2. 确实需要时: `agent-deploy run ./agent --trusted`

### 子Agent 找不到

```
invoke_agent: Sub-agent directory not found: /path/to/agent
```

**解决**:
1. 确保 agent.json 中 `subagents` 声明了该Agent:
   ```json
   { "subagents": [{ "name": "agent-name", "path": "../agent-dir" }] }
   ```
2. 路径相对于主 Agent 目录
3. 用 `list_agents` 工具检查运行时已注册Agent

### worker.yaml 语法错误

```
Error: Invalid YAML in worker.yaml: ...
```

**检查**:
- YAML 缩进使用空格（不是 Tab）
- `{{variable}}` 模板语法正确
- `on_fail` 策略值有效: `abort | skip | continue | { retry: ... }`

---

## Market 相关

### 上传失败: "There was an error parsing the body"

**原因**: CLI 上传的 multipart 编码问题（v1.0 已修复）。

**解决**:
1. 升级到最新 agent-deploy
2. 或使用 curl 直接上传:
   ```bash
   cd agent-dir && tar -czf /tmp/agent.tar.gz .
   curl -X POST http://market/api/v1/agents \
     -H "Authorization: Bearer <key>" \
     -F "file=@/tmp/agent.tar.gz"
   ```

### 下载的Agent没有 worker.yaml

**原因**: 旧格式 Agent（仅 agent.json + instructions）。

**解决**: 自动兼容，Runtime 会将 instructions 转为默认 worker.yaml。

---

## 配置问题

### API Key 未设置

```
llm_chat: API key not found for provider 'anthropic'.
```

**解决**: 设置环境变量:
```bash
export ANTHROPIC_API_KEY=sk-xxx
# 或
export ANTHROPIC_AUTH_TOKEN=sk-xxx
# 自定义 endpoint
export ANTHROPIC_BASE_URL=https://custom-api.example.com
export LLM_MODEL=gpt-4o
```

### Market 连接失败

**解决**:
```bash
# 检查 Market 状态
curl http://localhost:8321/api/v1/health

# 启动 Market 服务
cd agent-market && python -m uvicorn src.market.server:app --port 8321
```

---

## 开发调试

### 查看 Pipeline 每步详情

```bash
agent-deploy run ./agent --verbose --trusted
```

输出包含每步的工具调用、参数、耗时、结果。

### 仅验证 worker.yaml

```bash
agent-deploy run ./agent --dry-run
```

不执行，只解析语法。

### JSON 日志追踪

```bash
agent-deploy run ./agent --trusted 2>&1 | grep '"trace_id"'
```

所有日志统一携带 trace_id，跨 Agent 调用链追踪。

---

## 环境隔离

### Agent 安装到全局了？

默认不会。`agent-deploy use` 只下载到 `./agents/` 本地目录。

```bash
# 本地模式（默认）
agent-deploy use code-reviewer
# → ./agents/code-reviewer/

# 全局模式（需显式指定）
agent-deploy use code-reviewer --global

# 清理全局安装
agent-deploy clean
```

### 安全沙箱太严格？

```bash
# 受限模式 - 禁止网络/Shell/跨目录文件（默认）
agent-deploy run ./agent

# 信任模式 - 完全访问
agent-deploy run ./agent --trusted
```
