# Market REST API 参考

**Base URL**: `http://tx.aitboy.cn:15795/api/v1`

---

## 认证

所有写操作需要 API Key 认证。在请求头中携带：

```
Authorization: Bearer pd_mkt_xxxxxxxxxxxxxxxx
```

### 角色权限

| 角色 | 上传 | 评分 | 删除 | 管理 Key |
|------|------|------|------|----------|
| `publisher` | ✅ | ✅ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ |

---

## Agent API

### 注册/上传 Agent

```
POST /api/v1/agents
Content-Type: multipart/form-data
Authorization: Bearer <api-key>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | file | ✅ | .tar.gz 或 .zip 包 |
| `force` | bool | ❌ | 覆盖同版本 (默认 false) |

**响应 201**:
```json
{
  "id": "agent-abc123",
  "name": "code-reviewer",
  "version": "1.0.0",
  "display_name": "Code Reviewer",
  "author": "Peng Xiao",
  "category": "development",
  "tags": ["code", "review"],
  "download_count": 0,
  "rating": 0,
  "review_count": 0
}
```

**错误**: 400 (校验失败), 401 (未认证), 409 (版本冲突)

### 查询 Agent 列表

```
GET /api/v1/agents
```

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `q` | string | - | 搜索关键词 |
| `category` | string | - | 按分类筛选 |
| `tags` | string | - | 按标签筛选 (逗号分隔) |
| `page` | int | 1 | 页码 |
| `page_size` | int | 20 | 每页数量 (最大 100) |

**响应 200**:
```json
{
  "total": 42,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "agent-abc123",
      "name": "code-reviewer",
      "version": "1.0.0",
      "display_name": "Code Reviewer",
      "author": "Peng Xiao",
      "category": "development",
      "tags": ["code", "review"],
      "download_count": 156,
      "rating": 4.5,
      "review_count": 23
    }
  ]
}
```

### 获取 Agent 详情

```
GET /api/v1/agents/{id}
```

**响应 200**:
```json
{
  "id": "agent-abc123",
  "name": "code-reviewer",
  "version": "1.0.0",
  "display_name": "Code Reviewer",
  "description": "Comprehensive code review agent",
  "author": "Peng Xiao",
  "category": "development",
  "type": "agent",
  "tags": ["code", "review"],
  "license": "MIT",
  "homepage_url": "https://github.com/...",
  "source_url": "https://github.com/...",
  "dependencies": {},
  "download_count": 156,
  "rating": 4.5,
  "review_count": 23,
  "created_at": "2026-06-07T10:00:00",
  "updated_at": "2026-06-07T10:00:00"
}
```

### 下载 Agent

```
GET /api/v1/agents/{id}/download
```

**响应 200**: `application/gzip` 流，携带 `Digest: sha-256=...` 响应头

### 删除 Agent

```
DELETE /api/v1/agents/{id}
Authorization: Bearer <admin-api-key>
```

**响应 200**: `{"ok": true}`  
**错误**: 401 (非管理员)

### 弃用 Agent

```
POST /api/v1/agents/{id}/deprecate
Authorization: Bearer <api-key>
Content-Type: application/json
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `message` | string | ✅ | 弃用原因 |
| `replaced_by` | string | ❌ | 替代 Agent ID |

---

## 评分 API

### 评分

```
POST /api/v1/agents/{agent_id}/ratings
Authorization: Bearer <api-key>
Content-Type: application/json
```

```json
{
  "score": 5,
  "comment": "Excellent code review quality"
}
```

**限制**: 同用户对一个 Agent 只能评分一次

### 查看评分

```
GET /api/v1/agents/{agent_id}/ratings
```

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page` | int | 1 | 页码 |
| `page_size` | int | 20 | 每页数量 |

**响应 200**:
```json
{
  "total": 23,
  "average": 4.5,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": 1,
      "agent_id": "agent-abc123",
      "score": 5,
      "comment": "Excellent code review quality",
      "created_at": "2026-06-07T12:00:00"
    }
  ]
}
```

---

## API Key 管理

### 创建 API Key

```
POST /api/v1/api-keys
Content-Type: application/json
```

```json
{
  "owner": "your-name",
  "role": "publisher"
}
```

**认证方式**:
- 携带 `MARKET_MASTER_KEY` 环境变量
- 或使用已有 admin API Key

### 列出 API Keys

```
GET /api/v1/api-keys
Authorization: Bearer <admin-api-key>
```

### 删除 API Key

```
DELETE /api/v1/api-keys/{key}
Authorization: Bearer <admin-api-key>
```

---

## Agent Discovery

### 发现可用 Agent

```
GET /api/v1/discover
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `capability` | string | 按能力筛选 |
| `format` | string | 按输出格式筛选 |

**响应 200**: 符合能力的 Agent 列表 + 参数 schema

---

## Health Check

```
GET /api/v1/health
```

**响应 200**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "agent_count": 42
}
```

---

## 错误码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 / 校验失败 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 版本冲突 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |
