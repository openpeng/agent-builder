# Security Model

## 概述

Agent Market 采用 **默认不信任原则 (Zero Trust)**。所有从 Market 下载的 Agent 默认在受限模式下运行，用户必须显式授权敏感操作。

---

## Runtime 沙箱

### ExecutionPolicy

每个 Agent 运行时受 `ExecutionPolicy` 约束：

```typescript
interface ExecutionPolicy {
  allowBash: boolean;          // 是否允许执行 Shell 命令 (默认 false)
  allowedPaths: string[];      // 文件读写白名单路径 (默认仅限 Agent 工作目录)
  allowNetwork: boolean;       // 是否允许网络访问 (默认 false)
  allowWebSearch: boolean;     // 是否允许网络搜索 (默认 false)
  maxConcurrentAgents: number; // 最大并发子 Agent 数 (默认 1)
  timeoutMs: number;           // 全局超时 (默认 300000ms)
}
```

### 信任模式

- **默认模式** (`agent-deploy run <dir>`): 所有敏感操作被阻止
- **信任模式** (`agent-deploy run <dir> --trusted`): 解除限制，Agent 获得完整能力

### 内置工具安全限制

| 工具 | 默认限制 | 信任模式 |
|------|---------|---------|
| `bash` | 禁止执行 + 危险命令 denyList | 允许 |
| `write_file` | 仅限 Agent 工作目录 | 无限制 |
| `read_file` | 仅限 Agent 工作目录 | 无限制 |
| `web_fetch` | 禁止 + 内网 IP 黑名单 | 允许 |
| `web_search` | 禁止 | 允许 |

### 危险命令 denyList (bash)

以下命令模式在任何模式下都会被拒绝：
- `rm -rf /` / `rm -rf /*`
- `chmod 777` (递归)
- `wget` / `curl` 下载（需显式白名单）
- `sudo` / `su`
- `eval` / `exec`

---

## Market 安全

### API Key 管理

- API Key 使用 **SHA-256 哈希** 存储，永不保存明文
- 验证时使用 constant-time 比对，防时序攻击
- API Key 支持过期时间，过期后自动失效
- 创建频率限制：每 IP 每小时 5 次

### 上传包安全扫描

Market 在上传时自动执行安全检查：

1. **路径遍历检测**: 拒绝包含 `../` 或绝对路径的 tar.gz 条目
2. **符号链接检测**: 拒绝包含符号链接的包
3. **包大小限制**: 硬限制 50MB
4. **Schema 校验**: agent.json v3 规范完整校验
5. **引用完整性**: entry.main_subagent 必须在 subagents 中存在

### 下载完整性

- 上传时计算 SHA-256 摘要
- 下载响应携带 `Digest: sha-256=...` HTTP 头
- CLI 下载后自动校验哈希

### Rate Limiting

| 端点 | 限制 |
|------|------|
| 上传 Agent | 20 次/小时/用户 |
| 下载 Agent | 100 次/分钟/IP |
| 创建 API Key | 5 次/小时/IP |

---

## 安全风险分级

| 风险等级 | 场景 | 缓解措施 |
|---------|------|---------|
| 🔴 严重 | 从 Market 安装未知 Agent 并信任执行 | Runtime 沙箱 (默认受限) |
| 🟡 高 | 上传包含恶意路径遍历 | 上传扫描拒绝 |
| 🟡 高 | API Key 泄露导致冒充发布 | Key 哈希存储 + 过期时间 |
| 🟢 中 | 下载包被中间人篡改 | SHA-256 校验 |
| 🟢 低 | DoS 攻击 API | Rate limiting |

---

## 报告安全漏洞

如果你发现安全漏洞，请通过以下方式报告：

1. **不要公开披露** — 使用私密渠道
2. 发送邮件到项目维护者，包含漏洞详情和复现步骤
3. 我们会在 48 小时内确认，7 天内修复

---

## 最佳实践

### 用户

- 仅从信任的发布者下载 Agent
- 使用 `--trusted` 前审查 Agent 源代码
- 定期轮换 API Key
- 查看 Agent 评分的 comment 信息

### 发布者

- 不在 Agent 中包含硬编码的 API Key
- 使用环境变量传递敏感信息
- 在 agent.json 中声明 `required_permissions`
- 遵循最小权限原则设计 worker.yaml
