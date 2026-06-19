# Agent Maker Tutorial v2.0.0

『Agent 制造指南』—— 教会 AI 如何制作和发布 PilotDeck Agent 的教程包。

---

## 快速开始

### 1. 安装依赖

确保已安装 Python 3.10+ 和 PilotDeck 市场服务：

```bash
pip install fastapi uvicorn python-multipart httpx
```

### 2. 启动市场服务

```bash
cd /home/xiaopeng/mounts/new_volume/Sasa
PYTHONPATH=src python3 -m market.server --port 8321
```

### 3. 从模板创建你的 Agent

```bash
# 创建你的 Agent 目录
mkdir -p my-agent/templates
cp -r /tmp/file-summarizer/* ./my-agent/
```

或者从头创建：

```bash
mkdir my-agent && cd my-agent
# 创建 agent.json（参考 templates/minimal-agent.json）
# 创建 worker.yaml（参考 templates/worker.yaml）
```

---

## agent.json 规范

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `identity.name` | str | ✅ | Agent 唯一 ID（英文 slug） |
| `identity.version` | str | ✅ | 语义版本号，如 `1.0.0` |
| `identity.description` | str | ✅ | 简短描述（显示在搜索结果中） |
| `identity.author` | str | ✅ | 作者名 |
| `identity.display_name` | str | | 展示名称（可含中文） |
| `identity.tags` | list | | 搜索标签，如 `["file", "summary"]` |
| `entry.main_subagent` | str | ✅ | 入口子 Agent 名称 |
| `subagents` | list | ✅ | 子 Agent 定义列表 |
| `category` | str | | 分类: general/browser/data_analysis/utility |
| `type` | str | | 类型: agent/skill/workflow |
| `license` | str | | 许可证，默认 MIT |
| `dependencies` | dict | | 依赖声明，如 `{"python3": ">=3.10"}` |

### 最小示例

```json
{
  "identity": {
    "name": "my-agent",
    "version": "1.0.0",
    "description": "Describe your agent",
    "author": "Your Name"
  },
  "entry": { "main_subagent": "worker" },
  "subagents": [
    { "name": "worker", "path": "worker.yaml", "description": "Main workflow" }
  ],
  "category": "utility",
  "type": "agent"
}
```

---

## worker.yaml 编写指南

### 内置工具

| 工具名 | 说明 | 是否需配置 |
|--------|------|------------|
| `read_file` | 读取文件 | 无需 |
| `write_file` | 写入文件 | 无需 |
| `bash` | 执行 Shell 命令 | 无需 |
| `glob` | 文件模式匹配 | 无需 |
| `web_fetch` | 爬取网页 | 无需 |
| `web_search` | 搜索互联网 | 需配置搜索引擎 |
| `llm_chat` | **调用大模型** | **自动继承主 Agent 配置** |

### llm_chat 使用

**无需** 在 worker.yaml 中配置 API Key —— 自动继承主 Agent 的配置：

```yaml
tools:
  - name: llm_chat
    type: builtin

pipeline:
  - step: analyze
    tool: llm_chat
    args:
      prompt: "分析以下内容：{{raw_content}}"
      system_prompt: "你是一个分析助手"
    # model: 可选，覆盖主 Agent 的模型
    # api_key: 可选，覆盖主 Agent 的 Key
    output: result
    on_fail: continue    # LLM 不可用时继续
```

### Pipeline 步骤字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `step` | str | ✅ | 步骤唯一名称 |
| `tool` | str | ✅ | 使用的工具名 |
| `args` | dict | ✅ | 工具参数（支持模板变量 `{{var}}`）|
| `output` | str | | 步骤输出变量名 |
| `on_fail` | str | | 失败策略: `abort`/`skip`/`continue`/`retry(3)` |
| `when` | str | | 条件执行，如 `{{steps.prev.success}} == false` |

### 模板变量

| 格式 | 来源 | 示例 |
|------|------|------|
| `{{var}}` | 运行时参数 | `{{file_path}}` |
| `{{steps.step_name.output}}` | 上一步输出 | `{{steps.read.raw_text}}` |
| `{{shared_context.key}}` | 共享上下文 | `{{shared_context.package_dir}}` |

---

## 发布流程

### 方式 A: 通过 MarketClient（推荐）

```python
from market.client import MarketClient

client = MarketClient(
    server_url="http://localhost:8321",
    api_key="pd_mkt_xxxxxxxxxxxxxxxx"
)

# 发布
client.publish("./my-agent", force=True)

# 安装
path = client.install("my-agent")
```

### 方式 B: 通过 curl

```bash
# 1. 打包
cd my-agent && tar -czf ../my-agent-v1.0.0.tar.gz *

# 2. 上传
curl -X POST http://localhost:8321/api/v1/agents \
  -H "Authorization: Bearer $KEY" \
  -F "file=@../my-agent-v1.0.0.tar.gz" \
  -F "force=false"
```

### 方式 C: 通过 MainAgent 自动发现

```python
from agents import MainAgent

main = MainAgent()
# 自动发现 ~/.pilotdeck/market/installed/ 下所有 Agent
# 每个 Agent 注册为 use_agent:<name> 工具

# 也可以手动加载
main.load_package("/home/user/.pilotdeck/market/installed/my-agent")
result = main.run_sync(initial_args={"file_path": "/path/to/file"})
```

---

## 进阶技巧

### 1. LLM Fallback 模式

当无 API Key 时自动回退到规则处理：

```yaml
- step: try_llm
  tool: llm_chat
  args:
    prompt: "处理数据：{{data}}"
  on_fail: continue    # ← 继续而非中止

- step: fallback
  tool: bash
  args:
    command: "python3 fallback.py"
  when: "{{steps.try_llm.success}} == false"  # 仅在 LLM 失败时执行
```

### 2. 配置覆盖

某个步骤单独使用不同的模型：

```yaml
- step: special
  tool: llm_chat
  args:
    prompt: "..."
    model: "claude-3-opus-20240229"    # 覆盖主 Agent 的模型
    api_key: "sk-ant-xxx"              # 覆盖主 Agent 的 Key
    provider: "anthropic"              # 覆盖主 Agent 的提供商
```

### 3. 与市场集成

```python
from agents import MainAgent
from market.client import MarketClient

# 先安装
client = MarketClient()
client.install("file-summarizer")

# 然后直接用 — MainAgent 自动发现
main = MainAgent()
main.load_package(client.ensure_installed("file-summarizer"))
result = main.run_sync(initial_args={"file_path": "data.txt"})
```

---

## MCP 开发指南 🚀

MCP (Model Context Protocol) 是 AI 工具之间通信的标准协议。把你的 Agent 包装成 MCP Server，它就能被 Claude Desktop、Cursor、Zed 等任何支持 MCP 的 AI 客户端直接调用。

### 什么是 MCP Tool？

MCP Server 是一个「工具箱」，里面放了多个「MCP Tool」（就是可以被 AI 调用的函数）。例如：

- `list_installed_tools` — AI 说「看看我电脑上有哪些工具」，MCP Server 返回列表
- `deploy_agent` — AI 说「把审计 Agent 装到 OpenCode」，MCP Server 自动完成

### MCP Agent 的文件结构

```
my-mcp-agent/
├── agent.json                # Agent 元信息
├── README.md                 # 用户文档
├── pyproject.toml            # Python 包声明
├── src/
│   └── my_mcp_agent/
│       ├── __init__.py
│       ├── server.py         # MCP Server 入口
│       ├── detect.py         # 环境检测模块
│       ├── adapt.py          # Agent 适配模块
│       └── install.py        # 安装模块
└── tests/
    └── test_server.py
```

### Python 版本

#### 1. 安装 MCP SDK

```bash
pip install mcp>=1.0.0
```

#### 2. 创建 MCP Server

```python
# src/my_mcp_agent/server.py
import json
from mcp.server import Server
from mcp.types import Tool, TextContent
import mcp.server.stdio

server = Server("my-mcp-agent")

# 定义 4 个 MCP Tool
@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="my_tool_1",
            description="工具 1 的描述",
            inputSchema={
                "type": "object",
                "properties": {
                    "param1": {"type": "string", "description": "参数说明"}
                },
                "required": ["param1"]
            }
        ),
        # ... 更多工具
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "my_tool_1":
        result = do_something(arguments["param1"])
    else:
        raise ValueError(f"Unknown tool: {name}")
    return [TextContent(type="text", text=json.dumps(result, indent=2))]

# 启动 MCP Server（stdio 模式）
async def main():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

#### 3. 定义严格的 Tool 输入 Schema

每个 Tool 的 `inputSchema` 遵循 JSON Schema 规范：

| 类型 | Schema 示例 |
|------|------------|
| 字符串参数 | `{"type": "string", "description": "描述"}` |
| 可选参数 | `{"type": "string", "default": "auto"}` |
| 枚举参数 | `{"type": "string", "enum": ["project", "user", "both"]}` |
| 对象参数 | `{"type": "object", "properties": {...}, "required": [...]}` |

#### 4. 本地测试 MCP Server

```bash
# 启动 MCP Server
python -m my_mcp_agent.server

# 用 MCP Inspector 测试
npx @anthropic/mcp-inspector python -m my_mcp_agent.server
```

#### 5. 编写集成测试

```python
# tests/test_server.py
import pytest
from my_mcp_agent.server import server

def test_list_tools():
    """验证 Tool 定义正确"""
    tools = server.list_tools_sync()
    assert len(tools) == 4
    for tool in tools:
        assert "name" in tool
        assert "inputSchema" in tool

def test_call_tool_success():
    """验证 Tool 调用成功"""
    result = server.call_tool_sync("my_tool_1", {"param1": "test"})
    assert result is not None
```

### Node.js 版本

#### 1. 安装 MCP SDK

```bash
npm install @modelcontextprotocol/sdk
```

#### 2. 创建 MCP Server

```typescript
// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-mcp-agent", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const TOOLS: Tool[] = [
  {
    name: "my_tool_1",
    description: "工具 1 的描述",
    inputSchema: {
      type: "object",
      properties: {
        param1: { type: "string", description: "参数说明" }
      },
      required: ["param1"]
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "my_tool_1") {
    const result = doSomething(args?.param1 as string);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

#### 3. 运行

```bash
# 开发模式
npx tsx src/index.ts

# 生产模式
npm run build && node dist/index.js
```

### MCP 客户端配置

用户在他的 MCP 客户端（Claude Desktop / Cursor）配置文件中添加：

```json
{
  "mcpServers": {
    "my-mcp-agent": {
      "command": "python",
      "args": ["-m", "my_mcp_agent.server"]
    }
  }
}
```

Node.js 版本：
```json
{
  "mcpServers": {
    "my-mcp-agent": {
      "command": "npx",
      "args": ["@openpeng/agent-deploy"]
    }
  }
}
```

### MCP Agent 发布到市场

与普通 Agent 一样，打包成 `.tar.gz` 上传：

```bash
cd my-mcp-agent
tar -czf ../my-mcp-agent-v1.0.0.tar.gz \
  agent.json README.md pyproject.toml src/ tests/

# 用 MarketClient 发布
python -c "
from market.client import MarketClient
c = MarketClient(api_key='pd_mkt_xxx')
c.publish('../my-mcp-agent-v1.0.0.tar.gz', force=True)
"
```

### 参考实现

完整可运行的 MCP Agent 示例：
- **agent-deploy** (Python + Node.js): https://github.com/openpeng/agent-deploy
  - 4 个 MCP Tool，21 个 Python 测试 + 9 个 Node.js 测试
  - 支持 9+ 目标 AI 工具自动适配

---

## 项目文件结构

```
my-agent/
├── agent.json                # ✅ 必需：Agent 定义
├── worker.yaml               # ✅ 必需：工作流
├── libs/                     # 可选：Python 脚本
│   └── helper.py
├── templates/                # 可选：模板文件
│   └── prompt.txt
└── output/                   # 自动创建：运行输出
    └── result.json
```

---

## 目录

| 文件 | 说明 |
|------|------|
| `templates/minimal-agent.json` | 最小 agent.json 参考 |
| `templates/full-agent.json` | 完整 agent.json 参考（含多子 Agent）|
| `templates/worker.yaml` | 入口工作流模板（含 llm_chat 示例）|
| `agent.json` | 本教程包的 agent.json |
| `worker.yaml` | 本教程包的工作流 |
