# Phase 5: Agent Runtime 实现计划

**版本**: 1.0.0  
**状态**: Planning  
**开始日期**: 2026-06-07  
**预计完成**: 2026-07-29 (8周)

---

## 概述

Phase 5 的目标是实现 Agent Protocol v3 的**运行时引擎**，让 Agent 从"静态 markdown 文件"进化为"可执行的 Pipeline 工作流"。

### 当前能力 vs 目标能力

| 能力 | 当前 (Phase 4) | 目标 (Phase 5) |
|------|---------------|---------------|
| **Agent 定义** | ✅ agent.json v2 | ✅ agent.json v3 |
| **指令格式** | ✅ 静态 markdown | ✅ Pipeline (worker.yaml) |
| **工具调用** | ❌ 无 | ✅ Builtin Tools (llm_chat, read_file, etc.) |
| **步骤编排** | ❌ 无 | ✅ 顺序/条件执行 |
| **错误处理** | ❌ 无 | ✅ on_fail 策略 |
| **模板变量** | ❌ 无 | ✅ {{var}}/{{steps.x}} |
| **Subagent** | ❌ 无 | ✅ 多子 Agent 组合 |
| **运行模式** | ✅ Deploy only | ✅ Run + Deploy |

---

## 任务分解

### Task 5.1: Pipeline 引擎核心 🔴

**优先级**: 最高  
**工作量**: 2 周  
**负责人**: TBD

#### 目标

实现 worker.yaml 的解析和执行引擎。

#### 子任务

##### 5.1.1: YAML 解析器
```typescript
// src/runtime/parser.ts
export interface WorkerYaml {
  tools: ToolDefinition[];
  shared_context?: Record<string, any>;
  pipeline: PipelineStep[];
}

export function parseWorkerYaml(yamlPath: string): WorkerYaml;
export function validateWorkerYaml(yaml: WorkerYaml): ValidationResult;
```

**实现要点**:
- 使用 `js-yaml` 解析 YAML
- 验证必填字段 (tools, pipeline)
- 验证步骤引用完整性
- 验证工具声明完整性

**测试**:
- [ ] 解析有效 YAML
- [ ] 拒绝无效 YAML
- [ ] 验证步骤引用
- [ ] 验证工具引用

##### 5.1.2: 执行上下文
```typescript
// src/runtime/context.ts
export interface ExecutionContext {
  agent: Agent;
  initialArgs: Record<string, any>;
  sharedContext: Record<string, any>;
  steps: Map<string, StepResult>;
  env: Record<string, string>;
  cwd: string;
}

export interface StepResult {
  output: any;
  success: boolean;
  error?: Error;
  duration_ms: number;
}
```

**实现要点**:
- 管理步骤执行结果
- 共享上下文传递
- 环境变量访问
- 工作目录管理

##### 5.1.3: Pipeline 执行器
```typescript
// src/runtime/pipeline.ts
export class PipelineEngine {
  constructor(
    private toolRegistry: ToolRegistry,
    private logger: Logger
  ) {}

  async execute(
    yaml: WorkerYaml,
    context: ExecutionContext
  ): Promise<any> {
    for (const step of yaml.pipeline) {
      // 1. 检查条件 (when)
      if (!this.shouldExecute(step, context)) {
        continue;
      }

      // 2. 解析模板变量
      const resolvedArgs = this.resolveTemplateVars(step.args, context);

      // 3. 执行工具
      try {
        const result = await this.executeStep(step, resolvedArgs, context);
        context.steps.set(step.step, result);
      } catch (error) {
        // 4. 错误处理
        const handled = await this.handleError(step, error, context);
        if (!handled) {
          throw error;
        }
      }
    }

    return this.getFinalResult(context);
  }

  private async executeStep(
    step: PipelineStep,
    args: any,
    context: ExecutionContext
  ): Promise<StepResult> {
    const tool = this.toolRegistry.get(step.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${step.tool}`);
    }

    const startTime = Date.now();
    try {
      const output = await tool.execute(args, context);
      return {
        output,
        success: true,
        duration_ms: Date.now() - startTime
      };
    } catch (error) {
      return {
        output: null,
        success: false,
        error: error as Error,
        duration_ms: Date.now() - startTime
      };
    }
  }

  private shouldExecute(
    step: PipelineStep,
    context: ExecutionContext
  ): boolean {
    if (!step.when) return true;
    return this.evaluateCondition(step.when, context);
  }

  private evaluateCondition(
    condition: string,
    context: ExecutionContext
  ): boolean {
    // 支持: {{var}} == "value"
    // 支持: {{steps.x.success}} == true
    // 支持: {{steps.x.output}} > 0
  }

  private resolveTemplateVars(
    template: any,
    context: ExecutionContext
  ): any {
    // 递归替换 {{var}}, {{steps.x.output}}, {{shared_context.key}}
  }

  private async handleError(
    step: PipelineStep,
    error: Error,
    context: ExecutionContext
  ): Promise<boolean> {
    const strategy = step.on_fail || "abort";
    
    switch (strategy) {
      case "abort":
        return false;  // 不处理，向上抛出
      case "skip":
        // 记录跳过，继续
        context.steps.set(step.step, {
          output: null,
          success: false,
          error,
          duration_ms: 0
        });
        return true;
      case "continue":
        // 记录失败，继续
        context.steps.set(step.step, {
          output: null,
          success: false,
          error,
          duration_ms: 0
        });
        return true;
      default:
        // retry(n)
        const match = strategy.match(/^retry\((\d+)\)$/);
        if (match) {
          const retries = parseInt(match[1]);
          // 实现重试逻辑
        }
        return false;
    }
  }
}
```

**测试**:
- [ ] 顺序执行多步骤
- [ ] 条件执行 (when)
- [ ] 模板变量替换
- [ ] 错误处理 (abort/skip/continue/retry)
- [ ] 步骤间数据传递

##### 5.1.4: 模板变量系统
```typescript
// src/runtime/template.ts
export class TemplateResolver {
  resolve(template: any, context: ExecutionContext): any {
    if (typeof template === 'string') {
      return this.resolveString(template, context);
    } else if (Array.isArray(template)) {
      return template.map(item => this.resolve(item, context));
    } else if (typeof template === 'object' && template !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.resolve(value, context);
      }
      return result;
    }
    return template;
  }

  private resolveString(str: string, context: ExecutionContext): string {
    // {{var}} → context.initialArgs.var
    // {{steps.step_name.output}} → context.steps.get('step_name').output
    // {{shared_context.key}} → context.sharedContext.key
    // {{env.VAR}} → context.env.VAR
  }
}
```

**测试**:
- [ ] 替换简单变量
- [ ] 替换嵌套变量
- [ ] 替换数组中的变量
- [ ] 替换对象中的变量

---

### Task 5.2: Builtin Tools 实现 🔴

**优先级**: 最高  
**工作量**: 2 周  
**负责人**: TBD

#### 目标

实现 7 个核心 Builtin Tools。

#### 工具清单

##### 5.2.1: read_file
```typescript
// src/runtime/tools/read-file.ts
export class ReadFileTool implements BuiltinTool {
  name = "read_file";
  
  async execute(args: {
    path: string;
    encoding?: string;
    max_size?: number;
  }, context: ExecutionContext): Promise<string> {
    // 实现文件读取
  }
}
```

**测试**:
- [ ] 读取存在的文件
- [ ] 文件不存在 → 错误
- [ ] 超过 max_size → 错误
- [ ] 支持相对路径
- [ ] 支持绝对路径

##### 5.2.2: write_file
```typescript
// src/runtime/tools/write-file.ts
export class WriteFileTool implements BuiltinTool {
  name = "write_file";
  
  async execute(args: {
    path: string;
    content: string;
    mode?: "overwrite" | "append";
    create_dirs?: boolean;
  }, context: ExecutionContext): Promise<{
    path: string;
    bytes_written: number;
  }> {
    // 实现文件写入
  }
}
```

**测试**:
- [ ] 写入新文件
- [ ] 覆盖已存在文件
- [ ] 追加模式
- [ ] 自动创建父目录
- [ ] 权限错误处理

##### 5.2.3: bash
```typescript
// src/runtime/tools/bash.ts
export class BashTool implements BuiltinTool {
  name = "bash";
  
  async execute(args: {
    command: string;
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  }, context: ExecutionContext): Promise<{
    stdout: string;
    stderr: string;
    exit_code: number;
    duration_ms: number;
  }> {
    // 实现命令执行
  }
}
```

**测试**:
- [ ] 执行简单命令
- [ ] 捕获 stdout/stderr
- [ ] 超时处理
- [ ] 自定义环境变量
- [ ] 非零退出码处理

##### 5.2.4: glob
```typescript
// src/runtime/tools/glob.ts
export class GlobTool implements BuiltinTool {
  name = "glob";
  
  async execute(args: {
    pattern: string;
    cwd?: string;
    max_results?: number;
    ignore?: string[];
  }, context: ExecutionContext): Promise<string[]> {
    // 实现文件匹配
  }
}
```

**测试**:
- [ ] 简单模式 (*.txt)
- [ ] 递归模式 (**/*.ts)
- [ ] 忽略模式
- [ ] 限制结果数

##### 5.2.5: llm_chat ⭐
```typescript
// src/runtime/tools/llm-chat.ts
export class LLMChatTool implements BuiltinTool {
  name = "llm_chat";
  
  async execute(args: {
    prompt: string;
    system_prompt?: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    provider?: "anthropic" | "openai";
    api_key?: string;
    api_base?: string;
  }, context: ExecutionContext): Promise<{
    content: string;
    model: string;
    tokens_used: number;
    duration_ms: number;
  }> {
    // 1. 从 context.agent 获取默认配置
    // 2. 参数覆盖
    // 3. 调用 LLM API
    // 4. 返回结果
  }
}
```

**测试**:
- [ ] 调用 Claude API
- [ ] 调用 OpenAI API
- [ ] 配置继承
- [ ] 参数覆盖
- [ ] API 错误处理
- [ ] 重试逻辑

##### 5.2.6: web_fetch
```typescript
// src/runtime/tools/web-fetch.ts
export class WebFetchTool implements BuiltinTool {
  name = "web_fetch";
  
  async execute(args: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  }, context: ExecutionContext): Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
    url: string;
  }> {
    // 实现 HTTP 请求
  }
}
```

**测试**:
- [ ] GET 请求
- [ ] POST 请求
- [ ] 自定义 headers
- [ ] 超时处理
- [ ] 重定向处理

##### 5.2.7: web_search
```typescript
// src/runtime/tools/web-search.ts
export class WebSearchTool implements BuiltinTool {
  name = "web_search";
  
  async execute(args: {
    query: string;
    engine?: "google" | "bing";
    max_results?: number;
  }, context: ExecutionContext): Promise<{
    results: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  }> {
    // 实现搜索
  }
}
```

**测试**:
- [ ] Google 搜索 (需配置 API Key)
- [ ] 结果数量限制
- [ ] API 配额处理

---

### Task 5.3: Subagent 机制 🟡

**优先级**: 高  
**工作量**: 1 周  
**负责人**: TBD

#### 目标

实现多子 Agent 组合和加载。

#### 子任务

##### 5.3.1: Subagent 加载器
```typescript
// src/runtime/subagent.ts
export class SubagentLoader {
  load(agentPath: string): Agent {
    // 1. 读取 agent.json
    // 2. 解析 subagents
    // 3. 加载每个 worker.yaml
    // 4. 返回 Agent 对象
  }

  resolveSubagent(name: string, agent: Agent): WorkerYaml {
    // 根据名称查找子 Agent 的 worker.yaml
  }
}
```

##### 5.3.2: Agent 运行器
```typescript
// src/runtime/agent.ts
export class Agent {
  identity: AgentIdentity;
  entry: { main_subagent: string };
  subagents: Map<string, WorkerYaml>;
  dependencies: Dependencies;

  async run(initialArgs: Record<string, any>): Promise<any> {
    // 1. 加载 entry.main_subagent
    const entryYaml = this.subagents.get(this.entry.main_subagent);
    
    // 2. 创建执行上下文
    const context = this.createContext(initialArgs);
    
    // 3. 执行 pipeline
    const engine = new PipelineEngine(this.toolRegistry, this.logger);
    const result = await engine.execute(entryYaml, context);
    
    return result;
  }

  private createContext(initialArgs: Record<string, any>): ExecutionContext {
    return {
      agent: this,
      initialArgs,
      sharedContext: {},
      steps: new Map(),
      env: process.env,
      cwd: process.cwd()
    };
  }
}
```

**测试**:
- [ ] 加载单子 Agent
- [ ] 加载多子 Agent
- [ ] 入口点验证
- [ ] 子 Agent 引用验证

---

### Task 5.4: CLI Run 命令 🟡

**优先级**: 高  
**工作量**: 3 天  
**负责人**: TBD

#### 目标

实现 `agent-deploy run` 命令。

#### 实现

```typescript
// src/cli.ts
async function handleRunCommand(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      args: { type: "string", multiple: true },
      verbose: { type: "boolean", default: false }
    }
  });

  const agentPath = parsed.positionals[0];
  const runtimeArgs = parseRuntimeArgs(parsed.values.args || []);

  // 1. 加载 Agent
  const loader = new SubagentLoader();
  const agent = loader.load(agentPath);

  // 2. 运行 Agent
  console.log(`🚀 Running agent: ${agent.identity.name}`);
  const result = await agent.run(runtimeArgs);

  // 3. 输出结果
  console.log(`✅ Result:`, result);
}

function parseRuntimeArgs(argsArray: string[]): Record<string, any> {
  // --args key=value → { key: "value" }
  // --args key=123 → { key: 123 }
  // --args flag → { flag: true }
}
```

**使用示例**:
```bash
agent-deploy run ./file-summarizer \
  --args file_path=/data/report.txt \
  --args output_path=/tmp/summary.md \
  --args timestamp="2026-06-07 10:30"
```

**测试**:
- [ ] 运行最小 Agent
- [ ] 运行完整 Agent
- [ ] 传递参数
- [ ] 错误处理
- [ ] Verbose 模式

---

### Task 5.5: v2 兼容层 🟢

**优先级**: 中  
**工作量**: 1 周  
**负责人**: TBD

#### 目标

自动转换 v2 Agent 为 v3 格式运行。

#### 实现

```typescript
// src/runtime/migrate.ts
export function migrateV2ToV3(v2: AgentJsonV2): {
  agentV3: AgentJsonV3;
  workerYaml: WorkerYaml;
} {
  const agentV3: AgentJsonV3 = {
    schema_version: "3.0",
    identity: v2.identity,
    entry: { main_subagent: "worker" },
    subagents: [
      {
        name: "worker",
        path: "worker.yaml",
        description: "Main workflow (auto-generated from v2)"
      }
    ]
  };

  const workerYaml: WorkerYaml = generateWorkerYaml(v2.instructions);

  return { agentV3, workerYaml };
}

function generateWorkerYaml(instructions: string | object): WorkerYaml {
  const instructionsText = typeof instructions === "string"
    ? instructions
    : instructions.content || "";

  return {
    tools: [
      { name: "llm_chat", type: "builtin" }
    ],
    pipeline: [
      {
        step: "process",
        tool: "llm_chat",
        args: {
          system_prompt: instructionsText,
          prompt: "{{user_input}}"
        },
        output: "result"
      }
    ]
  };
}
```

**测试**:
- [ ] 转换简单 v2 Agent
- [ ] 转换带外部文件的 v2 Agent
- [ ] 运行转换后的 Agent
- [ ] 结果一致性验证

---

### Task 5.6: 集成测试 🟢

**优先级**: 中  
**工作量**: 1 周  
**负责人**: TBD

#### 目标

端到端测试完整 Agent 工作流。

---

### Task 5.7: MCP 工具集成 🟡

**优先级**: 高  
**工作量**: 1 周  
**负责人**: TBD

#### 目标

实现 MCP (Model Context Protocol) 工具集成，让 Agent 能够调用外部 MCP servers。

#### 子任务

##### 5.7.1: MCP Client Wrapper
```typescript
// src/runtime/mcp/client.ts
export class MCPClient {
  private connections = new Map<string, MCPServerConnection>();

  async connect(serverName: string): Promise<MCPServerConnection> {
    // 1. 从配置读取 server 信息
    const config = this.loadServerConfig(serverName);
    
    // 2. 启动 MCP server process
    const connection = await this.startServer(config);
    
    // 3. 建立连接
    await connection.initialize();
    
    this.connections.set(serverName, connection);
    return connection;
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    return await connection.callTool(toolName, args);
  }

  async disconnect(serverName: string) {
    const connection = this.connections.get(serverName);
    if (connection) {
      await connection.close();
      this.connections.delete(serverName);
    }
  }
}
```

##### 5.7.2: MCP Tool 类型
```typescript
// src/runtime/tools/mcp-tool.ts
export class MCPTool implements BuiltinTool {
  name: string;
  type = "mcp";
  server: string;
  
  constructor(
    private mcpClient: MCPClient,
    private toolDef: MCPToolDefinition
  ) {
    this.name = toolDef.name;
    this.server = toolDef.server;
  }

  async execute(args: any, context: ExecutionContext): Promise<any> {
    try {
      const result = await this.mcpClient.callTool(
        this.server,
        this.name,
        args
      );
      return result;
    } catch (error) {
      if (error instanceof MCPConnectionError) {
        throw new ToolError(
          `MCP server '${this.server}' not available`,
          "MCP_SERVER_UNAVAILABLE"
        );
      }
      throw error;
    }
  }
}
```

##### 5.7.3: MCP Loader
```typescript
// src/runtime/mcp/loader.ts
export class MCPLoader {
  async loadMCPTools(agent: Agent): Promise<Map<string, MCPTool>> {
    const tools = new Map<string, MCPTool>();
    
    if (!agent.mcp?.required_servers) {
      return tools;
    }

    for (const serverDef of agent.mcp.required_servers) {
      // 1. 连接 MCP server
      const client = new MCPClient();
      await client.connect(serverDef.name);
      
      // 2. 列举 tools
      const availableTools = await client.listTools(serverDef.name);
      
      // 3. 验证所需 tools
      for (const toolName of serverDef.tools) {
        const toolDef = availableTools.find(t => t.name === toolName);
        if (!toolDef) {
          if (!serverDef.optional) {
            throw new Error(`Required MCP tool not found: ${toolName}`);
          }
          continue;
        }
        
        // 4. 注册到工具系统
        const mcpTool = new MCPTool(client, toolDef);
        tools.set(toolName, mcpTool);
      }
    }
    
    return tools;
  }
}
```

##### 5.7.4: MCP 配置管理
```typescript
// src/runtime/mcp/config.ts
export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  timeout?: number;
}

export class MCPConfigManager {
  private configPath = "~/.agent-deploy/mcp-config.json";

  loadConfig(): Record<string, MCPServerConfig> {
    // 读取 MCP 配置文件
  }

  getServerConfig(name: string): MCPServerConfig {
    const config = this.loadConfig();
    if (!config[name]) {
      throw new Error(
        `MCP server '${name}' not configured. ` +
        `Please add it to ${this.configPath}`
      );
    }
    return config[name];
  }
}
```

**测试**:
- [ ] 连接到 MCP server
- [ ] 列举 MCP tools
- [ ] 调用 MCP tool
- [ ] 错误处理 (server 不可用)
- [ ] 多 server 并发
- [ ] 配置读取

---

### Task 5.8: Skill 系统集成 🟡

**优先级**: 高  
**工作量**: 1 周  
**负责人**: TBD

#### 目标

实现 Skill 系统，让 Agent 能够加载和调用打包在 Agent 内的 Skills。

#### 子任务

##### 5.8.1: Skill Loader (从 Agent 内部加载)

```typescript
// src/runtime/skills/loader.ts
export class SkillLoader {
  async loadSkillsFromAgent(agent: Agent): Promise<Map<string, Agent>> {
    const skills = new Map<string, Agent>();

    // 遍历 subagents，找到 type: "skill" 的
    for (const subagentDef of agent.subagents) {
      if (subagentDef.type !== "skill") {
        continue;
      }

      // 加载 Skill 的 agent.json
      const skillPath = path.resolve(
        agent.basePath,
        path.dirname(subagentDef.path),
        "agent.json"
      );

      const skillAgent = await this.loadAgent(skillPath);

      // 验证是 Skill 类型
      if (skillAgent.type !== "skill") {
        console.warn(`Subagent ${subagentDef.name} declared as skill but type is not "skill"`);
      }

      skills.set(subagentDef.name, skillAgent);
    }

    return skills;
  }
}
```

    // 3. 注册所有 Skills
    for (const skill of [...systemSkills, ...userSkills]) {
      this.register(skill);
    }
  }

  register(skillInfo: SkillInfo) {
    this.skills.set(skillInfo.name, skillInfo);
  }

  find(name: string): SkillInfo | null {
    return this.skills.get(name) || null;
  }

  list(): SkillInfo[] {
    return Array.from(this.skills.values());
  }
}
```

##### 5.8.2: Skill Loader
```typescript
// src/runtime/skills/loader.ts
export class SkillLoader {
  constructor(
    private registry: SkillRegistry,
    private agentLoader: SubagentLoader
  ) {}

  async loadSkill(skillName: string): Promise<Agent> {
    // 1. 从 registry 查找
    const skillInfo = this.registry.find(skillName);
    if (!skillInfo) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    // 2. 加载 Skill Agent
    const skillAgent = await this.agentLoader.load(skillInfo.path);

    // 3. 验证是 Skill 类型
    if (skillAgent.type !== "skill") {
      throw new Error(`Not a skill: ${skillName}`);
    }

    return skillAgent;
  }

  async executeSkill(
    skillAgent: Agent,
    args: Record<string, any>
  ): Promise<any> {
    // 执行 Skill 的 pipeline
    return await skillAgent.run(args);
  }
}
```

##### 5.8.3: Skill Tool 类型
```typescript
// src/runtime/tools/skill-tool.ts
export class SkillTool implements BuiltinTool {
  name: string;
  type = "skill";
  
  constructor(
    private skillName: string,
    private skillLoader: SkillLoader
  ) {
    this.name = `skill_${skillName}`;
  }

  async execute(args: any, context: ExecutionContext): Promise<any> {
    // 1. 加载 Skill
    const skillAgent = await this.skillLoader.loadSkill(this.skillName);

    // 2. 验证参数
    this.validateParameters(args, skillAgent.parameters);

    // 3. 创建 Skill 执行上下文 (隔离)
    const skillContext = {
      ...context,
      initialArgs: args,
      steps: new Map()  // 隔离的步骤上下文
    };

    // 4. 执行 Skill pipeline
    const result = await skillAgent.run(args);

    return result;
  }

  private validateParameters(
    args: Record<string, any>,
    parameters: ParameterSchema
  ) {
    const validator = new SkillParameterValidator();
    const result = validator.validate(args, parameters);
    if (!result.valid) {
      throw new Error(
        `Invalid parameters for skill ${this.skillName}: ` +
        result.errors.join(", ")
      );
    }
  }
}
```

##### 5.8.4: Skill 参数验证
```typescript
// src/runtime/skills/validator.ts
export class SkillParameterValidator {
  validate(
    args: Record<string, any>,
    parameters: ParameterSchema
  ): ValidationResult {
    const errors: string[] = [];

    // 1. 检查必填参数
    for (const [key, schema] of Object.entries(parameters)) {
      if (schema.required && !(key in args)) {
        errors.push(`Missing required parameter: ${key}`);
      }
    }

    // 2. 检查类型
    for (const [key, value] of Object.entries(args)) {
      const schema = parameters[key];
      if (!schema) {
        errors.push(`Unknown parameter: ${key}`);
        continue;
      }

      if (!this.checkType(value, schema.type)) {
        errors.push(
          `Invalid type for ${key}: expected ${schema.type}, got ${typeof value}`
        );
      }

      // 3. 检查枚举
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(
          `Invalid value for ${key}: must be one of ${schema.enum.join(", ")}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case "string": return typeof value === "string";
      case "number": return typeof value === "number";
      case "boolean": return typeof value === "boolean";
      case "array": return Array.isArray(value);
      case "object": return typeof value === "object" && !Array.isArray(value);
      default: return true;
    }
  }
}
```

**测试**:
- [ ] 从 Agent 内部加载 Skills
- [ ] 加载 Skill
- [ ] 执行 Skill
- [ ] 参数验证
- [ ] Skill 作为 Subagent Tool
- [ ] Skill 组合

---

### Task 5.9: Memory 系统集成 🟡

**优先级**: 高  
**工作量**: 1 周  
**负责人**: TBD

#### 目标

实现记忆系统，让 Agent 能够记忆和学习，实现自我提升。

#### 子任务

##### 5.9.1: MemoryManager

```typescript
// src/runtime/memory/manager.ts
export class MemoryManager {
  private basePath: string;

  constructor() {
    this.basePath = path.join(os.homedir(), ".agent-deploy", "memory");
  }

  async loadAgentMemory(agentName: string): Promise<Memory> {
    const memoryPath = path.join(
      this.basePath,
      "agents",
      agentName,
      "long-term.json"
    );

    if (!fs.existsSync(memoryPath)) {
      return this.createEmptyMemory(agentName);
    }

    return JSON.parse(fs.readFileSync(memoryPath, "utf-8"));
  }

  async loadProjectMemory(
    projectPath: string,
    agentName: string
  ): Promise<Memory | null> {
    const projectHash = this.hashProjectPath(projectPath);
    const memoryPath = path.join(
      this.basePath,
      "projects",
      projectHash,
      "agents",
      `${agentName}.json`
    );

    if (!fs.existsSync(memoryPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(memoryPath, "utf-8"));
  }

  async saveAgentMemory(agentName: string, entry: MemoryEntry) {
    // 实现保存逻辑
  }

  async saveProjectMemory(
    projectPath: string,
    agentName: string,
    entry: MemoryEntry
  ) {
    // 实现保存逻辑
  }
}
```

##### 5.9.2: Memory Tools

```typescript
// src/runtime/tools/memory-read.ts
export class MemoryReadTool implements BuiltinTool {
  name = "memory_read";

  async execute(args: {
    scope: "agent" | "project" | "all";
    tags?: string[];
    types?: MemoryType[];
    limit?: number;
  }, context: ExecutionContext): Promise<MemoryEntry[]> {
    const memoryManager = new MemoryManager();
    // 实现读取逻辑
  }
}

// src/runtime/tools/memory-write.ts
export class MemoryWriteTool implements BuiltinTool {
  name = "memory_write";

  async execute(args: {
    scope: "agent" | "project";
    type: MemoryType;
    content: string;
    tags?: string[];
    confidence?: number;
  }, context: ExecutionContext): Promise<{ id: string }> {
    const memoryManager = new MemoryManager();
    // 实现写入逻辑
  }
}
```

##### 5.9.3: Memory CLI

```typescript
// src/cli/memory.ts
export async function handleMemoryCommand(args: string[]) {
  const subcommand = args[0]; // list, clear, export, import, stats

  switch (subcommand) {
    case "list":
      await listMemories(args);
      break;
    case "clear":
      await clearMemories(args);
      break;
    case "export":
      await exportMemories(args);
      break;
    case "import":
      await importMemories(args);
      break;
    case "stats":
      await showMemoryStats();
      break;
  }
}
```

**测试**:
- [ ] 保存和读取 Agent 记忆
- [ ] 保存和读取项目记忆
- [ ] 按 tags 过滤
- [ ] 按置信度过滤
- [ ] 记忆裁剪
- [ ] CLI 命令

#### 集成测试

##### E2E-6: MCP Integration
```bash
# MCP 配置打包在 Agent 内
cd tapd-task-manager/
ls mcp/servers.json  # Agent 自带 MCP 配置
    }
  }
}
EOF

# 运行使用 MCP 的 Agent
agent-deploy run ./tapd-task-manager \
  --args workspace_id=12345 \
  --args user_input="Create a login page"

# 验证: TAPD story 已创建
```

##### E2E-7: Skill System
```bash
# 安装 Skill
agent-deploy skill install text-summarizer

# 运行使用 Skill 的 Agent
agent-deploy run ./content-processor \
  --args file_path=/data/report.txt

# 验证: Skill 被正确调用
```

### Task 5.6: 集成测试 🟢

**优先级**: 中  
**工作量**: 1 周  
**负责人**: TBD

#### 目标

端到端测试完整 Agent 工作流。

#### 测试场景

##### E2E-1: 最小 Agent
```bash
# 运行 minimal-agent
agent-deploy run ./examples/minimal-agent --args user_name=Alice

# 预期输出:
# 🚀 Running agent: minimal-agent
# ✅ Result: "Hello Alice! ..."
```

##### E2E-2: 文件摘要 Agent
```bash
# 创建测试文件
echo "Long document..." > /tmp/test.txt

# 运行
agent-deploy run ./examples/file-summarizer \
  --args file_path=/tmp/test.txt \
  --args output_path=/tmp/summary.md

# 验证输出文件
cat /tmp/summary.md
```

##### E2E-3: 多子 Agent
```bash
# 运行 code-auditor
agent-deploy run ./examples/multi-subagent

# 验证报告生成
cat audit-report.md
```

##### E2E-4: 错误处理
```bash
# 文件不存在
agent-deploy run ./file-summarizer --args file_path=/nonexistent

# 预期: FileNotFoundError, pipeline abort
```

##### E2E-5: Fallback
```bash
# LLM API Key 未配置
unset ANTHROPIC_API_KEY

agent-deploy run ./file-summarizer --args file_path=/tmp/test.txt

# 预期: LLM 失败, fallback 到截断
```

---

## 里程碑

### M1: Pipeline 引擎核心 (Week 1-2)
- ✅ YAML 解析器
- ✅ 执行上下文
- ✅ Pipeline 执行器
- ✅ 模板变量系统
- ✅ 单元测试 (80%+ 覆盖)

### M2: Builtin Tools (Week 3-4)
- ✅ read_file / write_file
- ✅ bash / glob
- ✅ llm_chat (核心)
- ✅ web_fetch / web_search
- ✅ Tool Registry
- ✅ 单元测试 (每个工具)

### M3: Subagent + CLI (Week 5)
- ✅ Subagent 加载器
- ✅ Agent 运行器
- ✅ CLI run 命令
- ✅ 参数解析

### M4: MCP + Skill 集成 (Week 6-7)
- ✅ MCP Client Wrapper (从 Agent 内加载配置)
- ✅ MCP Tool 类型
- ✅ Skill Loader (从 Agent 内加载)
- ✅ Skill Tool 类型
- ✅ 参数验证
- ✅ 集成测试

### M5: Memory 系统 (Week 8)
- ✅ MemoryManager (Agent/Project 两层存储)
- ✅ Memory Tools (read/write/search/forget)
- ✅ Memory CLI 命令
- ✅ 裁剪和清理机制
- ✅ 集成测试

### M6: 兼容与测试 (Week 9)
- ✅ v2 → v3 自动转换
- ✅ E2E 测试套件 (8+ 场景)
- ✅ 文档更新
- ✅ 示例验证

---

## 成功标准

### 功能完整性
- [ ] 所有 7 个 Builtin Tools 实现
- [ ] Pipeline 引擎支持所有特性
- [ ] Subagent 加载和执行
- [ ] CLI run 命令可用
- [ ] v2 兼容层工作
- [ ] MCP 工具集成 (从 Agent 内加载)
- [ ] Skill 系统集成 (从 Agent 内加载)
- [ ] Memory 系统集成 (分层存储 + 4 个工具)

### 质量标准
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] E2E 测试 8+ 场景 (含 MCP + Skill + Memory)
- [ ] TypeScript 编译 0 错误
- [ ] 所有示例可运行

### 性能标准
- [ ] 最小 Agent 启动 < 100ms
- [ ] Pipeline 步骤执行 < 50ms (不含工具)
- [ ] LLM 调用超时 30s
- [ ] 文件操作超时 5s

### 文档标准
- [ ] agent-protocol 完整规范
- [ ] Runtime API 文档
- [ ] 迁移指南 (v2 → v3)
- [ ] 示例教程

---

## 风险与缓解

### 风险 1: llm_chat 实现复杂
**影响**: 高  
**概率**: 中

**缓解**:
- 先实现 Anthropic Claude (优先)
- 再实现 OpenAI GPT (次要)
- 使用现有 SDK (不自己实现 API 层)

### 风险 2: 模板变量嵌套深度
**影响**: 中  
**概率**: 高

**缓解**:
- 限制嵌套深度 (如 5 层)
- 循环检测
- 清晰错误提示

### 风险 3: 性能问题
**影响**: 中  
**概率**: 中

**缓解**:
- 提前性能测试
- 优化热路径
- 缓存机制 (工具注册表等)

---

## 下一步行动

### 立即开始 (本周)
1. ✅ 完成 agent-protocol 规范 (已完成)
2. ⏳ 创建 Phase 5 分支
3. ⏳ 实现 YAML 解析器
4. ⏳ 实现执行上下文

### Week 2
1. 实现 Pipeline 执行器
2. 实现模板变量系统
3. 单元测试

### Week 3-4
1. 实现 Builtin Tools
2. 集成测试

### Week 5
1. Subagent 机制
2. CLI 集成

### Week 6-7
1. MCP 工具集成 (从 Agent 内加载配置)
2. Skill 系统集成 (从 Agent 内加载 Skills)
3. 集成测试

### Week 8
1. Memory 系统集成
2. Memory Tools 实现
3. Memory CLI 命令

### Week 9
1. v2 兼容层
2. E2E 测试 (全场景)
3. 文档完善

---

**Phase 5 - 让 Agent 真正"活"起来！** 🚀
