# /notification-agent — 消息通知 Agent

## Description

通过 Bark 服务发送消息通知的智能助手

## Steps

Execute the following steps in order:

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