# 消息通知 Agent

**Version**: 1.0.0
**Description**: 通过 Bark 服务发送消息通知的智能助手

## Pipeline

## Parameters

Provide the following values when invoking this agent (use `$ARGUMENTS` or pass as key=value):

- `title`
- `body`

**Step 1: prepare_message**
Write the following content to file `.notification.log`:
```
Preparing notification: {{title}} - {{body}}
``` Save result as `log_result`.

**Step 2: send_notification**
Fetch URL via HTTP GET: `https://api.day.app/Q52aXRfJJDJTxzuubT8FNX/{{title}}/{{body}}` Save result as `bark_response`.

**Step 3: log_result**
Write the following content to file `.notification.log`:
```
Notification sent at {{timestamp}}
Title: {{title}}
Body: {{body}}
Response: {{steps.send_notification.output.status}}
```
(append to existing file)

**Shared context**: {"timestamp":"2026-06-06T14:30:00Z"}

# 消息通知 Agent

通过 Bark 服务发送消息通知的智能助手

## Workflows

This agent contains 1 sub-workflow(s):

- **worker** (`worker.yaml`): 消息通知主工作流

Entry workflow: **worker**

## Usage

This agent is based on PilotDeck workflow orchestration. See individual `.yaml` files for detailed configuration.


---
*Adapted from Agent Market by agent-deploy v1.0.0*
