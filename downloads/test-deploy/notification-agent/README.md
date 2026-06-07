# 消息通知 Agent

一个通过 Bark 服务发送消息通知的智能助手。

## 功能

- 发送消息通知到 iOS 设备
- 支持自定义标题和内容
- 记录通知发送日志

## 使用方法

### 安装

```bash
agent-deploy deploy notification-agent
```

### 运行

```bash
agent-deploy run ./agents/notification-agent \
  --args '{"title": "测试通知", "body": "这是一条测试消息"}'
```

### 参数说明

- `title` (必需): 通知标题
- `body` (必需): 通知内容

## 示例

### 发送简单通知

```bash
agent-deploy run ./agents/notification-agent \
  --args '{"title": "任务完成", "body": "数据处理已完成"}'
```

### 发送警报

```bash
agent-deploy run ./agents/notification-agent \
  --args '{"title": "⚠️ 警报", "body": "服务器 CPU 使用率超过 90%"}'
```

## 配置

Agent 使用 Bark MCP 服务器进行消息推送。配置文件位于 `mcp/config.json`。

如需修改推送地址，请编辑该文件中的 `url` 字段。

## 依赖

- Bark 服务（iOS 推送通知服务）
- 互联网连接

## 版本历史

### 1.0.0 (2026-06-06)
- 初始版本
- 支持基本消息推送功能
- 日志记录功能
