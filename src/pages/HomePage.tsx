import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Package,
  Zap,
  CheckCircle2,
  Shield,
  Layers,
  FileJson,
  Cpu,
  Network,
  MessageSquare,
  Wrench,
  Gauge,
  Workflow,
  Terminal,
  Server,
  FileCode,
} from 'lucide-react';

// Inline GitHub SVG since lucide-react doesn't include brand icons
const GhIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ verticalAlign: 'middle' }}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
);
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  // Smooth scroll to sections
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      {/* Orb background effects */}
      <div className="home-orb home-orb-1" />
      <div className="home-orb home-orb-2" />
      <div className="home-orb home-orb-3" />

      {/* ======== Header Nav ======== */}
      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-logo" onClick={() => scrollTo('hero')}>Agent Hub</div>
          <nav className="home-nav">
            <button onClick={() => scrollTo('overview')}>概览</button>
            <button onClick={() => scrollTo('quickstart')}>快速开始</button>
            <button onClick={() => scrollTo('architecture')}>架构</button>
            <button onClick={() => scrollTo('protocol')}>协议</button>
            <button onClick={() => scrollTo('api')}>API</button>
            <button onClick={() => scrollTo('roadmap')}>路线图</button>
          </nav>
          <div className="home-header-actions">
            <button className="home-header-btn" onClick={() => navigate('/quick-start')}>
              <Zap size={14} /> 开始构建
            </button>
            <a
              className="home-gh-link"
              href="https://github.com/openpeng/agent-hub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GhIcon size={14} /> GitHub
            </a>
          </div>
        </div>
      </header>

      {/* ======== Hero ======== */}
      <section className="home-hero" id="hero">
        <h1 className="home-hero-title">Agent Hub</h1>
        <p className="home-hero-subtitle">
          Agent 是 AI 能力的完整载体 — 自有工具、自有状态、自洽运行。<br />
          <strong>Agent Runtime</strong> 让 Agent 跑起来；<strong>Agent Market</strong> 让 Agent 流通起来。<br />
          两个独立项目，一个统一协议，共同构建开放的 AI Agent 生态。
        </p>
        <div className="home-hero-badges">
          <span className="home-badge">Agent = 完整的 AI 能力世界</span>
          <span className="home-badge">子Agent 自治运行时</span>
          <span className="home-badge">多Agent 协作协议</span>
          <span className="home-badge">安全沙箱 权限审计</span>
          <span className="home-badge">开放市场 一键发布</span>
          <span className="home-badge">llm_chat 配置自动继承</span>
        </div>
        <div className="home-hero-actions">
          <button className="home-btn home-btn-primary" onClick={() => navigate('/quick-start')}>
            <Zap size={16} /> 开始构建 Agent
          </button>
          <button className="home-btn home-btn-outline" onClick={() => navigate('/market')}>
            <Globe size={16} /> 浏览 Agent 市场
          </button>
        </div>
      </section>

      {/* ======== Core Module Cards ======== */}
      <section className="home-section" id="overview">
        <div className="home-modules-row">
          <div className="home-module-card home-mod-1">
            <div className="home-mod-icon">
              <Cpu size={28} />
            </div>
            <h3>Agent Runtime</h3>
            <div className="home-mod-path">src/agents/</div>
            <p className="home-mod-desc">
              <strong>让 Agent 跑起来。</strong>加载 agent.json → 审计权限 → 注入配置 → 启动 Pipeline — 从声明到执行的完整引擎。支持旧 SKILL.md 自动兼容。
            </p>
          </div>
          <div className="home-module-card home-mod-2">
            <div className="home-mod-icon">
              <Globe size={28} />
            </div>
            <h3>Agent Market</h3>
            <div className="home-mod-path">src/market/</div>
            <p className="home-mod-desc">
              <strong>让 Agent 流通起来。</strong>FastAPI 市场服务 + Python SDK — 搜索、发布、下载、评分。SQLite 存储，零外部依赖，本地优先。
            </p>
            <a className="home-mod-gh" href="https://github.com/openpeng/agent-market" target="_blank" rel="noopener noreferrer">
              <GhIcon size={14} /> github.com/openpeng/agent-market
            </a>
          </div>
          <div className="home-module-card home-mod-3">
            <div className="home-mod-icon">
              <Package size={28} />
            </div>
            <h3>Agent Deploy</h3>
            <div className="home-mod-path">skills/agent-deploy/</div>
            <p className="home-mod-desc">
              <strong>一键部署到任意 AI 工具。</strong>MCP Server 自动检测 Cursor / Claude Code / CodeBuddy / Copilot 等 9 种工具，下载适配，一条命令搞定。
            </p>
            <a className="home-mod-gh" href="https://github.com/openpeng/agent-deploy" target="_blank" rel="noopener noreferrer">
              <GhIcon size={14} /> github.com/openpeng/agent-deploy
            </a>
          </div>
        </div>
      </section>

      {/* ======== Project Highlights ======== */}
      <section className="home-section">
        <div className="home-card">
          <h3 className="home-card-title">
            <CheckCircle2 size={20} className="home-text-accent" />
            项目亮点
          </h3>
          <p className="home-card-sub">Agent 不是更大的 Skill，它是 AI 能力的完整载体 — 一个 Skill 解决一个任务，一个 Agent 拥有一个世界。</p>
          <ul className="home-feature-list">
            <li><strong>原子化设计</strong> — 每个 Agent 是完备的自治单元：工具、Pipeline、状态、LLM 配置自包含</li>
            <li><strong>配置自动继承</strong> — LLM 配置从主 Agent 自动注入子 Agent，声明即用</li>
            <li><strong>自由伸缩</strong> — 从「读取文件」到「多Agent协作数据分析系统」，同一套抽象</li>
            <li><strong>多Agent 协作</strong> — 标准化协议通信，串行、并行、条件路由，Agent 编排 Agent</li>
            <li><strong>安全沙箱</strong> — 文件、网络、子进程、资源四维审计，每个Agent都有权限边界</li>
            <li><strong>市场生态</strong> — 一键发布、搜索、下载、评分，Agent 像 App 一样流通</li>
            <li><strong>自动发现</strong> — 安装即用，MainAgent 自动发现 market 下所有 Agent</li>
          </ul>
        </div>
      </section>

      {/* ======== Why Agent - Skill vs Agent ======== */}
      <section className="home-section">
        <div className="home-card">
          <h3 className="home-card-title">
            <Layers size={20} className="home-text-accent" />
            为什么是 Agent？— 超越 Skill 的范式跃迁
          </h3>
          <p className="home-card-sub">Skill 解决上下文爆炸的表面问题，Agent 回答的是 AI 能力的组织方式这一根本问题：</p>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead>
                <tr><th></th><th>Skill（技能）</th><th>Agent（智能体）</th></tr>
              </thead>
              <tbody>
                <tr><td>本质</td><td>一个可调用的函数片段</td><td><strong>一个拥有独立世界的完整存在</strong></td></tr>
                <tr><td>状态</td><td>无状态，每次调用重新开始</td><td><strong>有状态，拥有记忆和生命周期</strong></td></tr>
                <tr><td>工具</td><td>被动被编排</td><td><strong>主动声明需求，自治执行</strong></td></tr>
                <tr><td>配置</td><td>依赖调用方传入一切</td><td><strong>自包含 LLM 配置、环境变量、权限</strong></td></tr>
                <tr><td>复杂度</td><td>上限是单次调用的复杂度</td><td><strong>从一行代码到百Agent协同，同一抽象</strong></td></tr>
                <tr><td>协作</td><td>由编排层统一调度</td><td><strong>Agent 可以直接发现和调用其他 Agent</strong></td></tr>
                <tr><td>可分享性</td><td>分享一个代码片段</td><td><strong>分享一个完整的 AI 能力世界</strong></td></tr>
              </tbody>
            </table>
          </div>
          <p className="home-card-note">
            Skill 到 Agent 的升级，不是「更好的函数」，而是<strong>从碎片到整体</strong>的范式跃迁。Agent 是 AI 能力的最小完整单元 — 它既是原子，也可以组成分子。
          </p>
        </div>
      </section>

      {/* ======== Project Structure ======== */}
      <section className="home-section">
        <div className="home-card">
          <h3 className="home-card-title">
            <FileCode size={20} className="home-text-accent" />
            项目结构 — 两个仓库，三大模块
          </h3>
          <div className="home-two-col">
            <div className="home-col-box home-col-purple">
              <div className="home-col-title">Agent Runtime</div>
              <div className="home-col-subtitle"><code>src/agents/</code></div>
              <p className="home-col-desc">让 Agent <strong>跑起来</strong> — 加载、审计、执行的完整引擎</p>
              <div className="home-col-items">
                <code>MainAgent</code> 顶层入口<br />
                <code>AgentLoader</code> 包加载校验<br />
                <code>Auditor</code> 安全审计<br />
                <code>SubAgentRuntime</code> 隔离执行<br />
                <code>MessageBus</code> 协作文通<br />
                <code>ToolRegistry</code> 工具注册
              </div>
            </div>
            <div className="home-col-box home-col-green">
              <div className="home-col-title">Agent Market</div>
              <div className="home-col-subtitle"><code>src/market/</code></div>
              <p className="home-col-desc">让 Agent <strong>流通起来</strong> — 发现、分享、安装的开放生态</p>
              <div className="home-col-items">
                <code>server.py</code> FastAPI 服务<br />
                <code>MarketClient</code> Python SDK<br />
                <code>database.py</code> SQLite 存储<br />
                <code>search.py</code> 全文搜索<br />
                <code>ratings.py</code> 评分系统<br />
                <code>cache.py</code> 本地缓存
              </div>
            </div>
          </div>
          <p className="home-card-note" style={{ textAlign: 'center' }}>
            <a href="https://github.com/openpeng/agent-market" target="_blank" rel="noopener noreferrer">github.com/openpeng/agent-market</a>
            &nbsp;← 同一份 agent.json + worker.yaml 定义 →
            <a href="https://github.com/openpeng/agent-deploy" target="_blank" rel="noopener noreferrer">github.com/openpeng/agent-deploy</a>
          </p>
        </div>
      </section>

      {/* ======== Quick Start ======== */}
      <section className="home-section" id="quickstart">
        <h2 className="home-section-title">快速开始</h2>

        <div className="home-card">
          <h3 className="home-card-title">从市场下载到运行 Agent</h3>
          <p className="home-card-sub">从 Market 搜索到运行 Agent 只需 3 行代码：</p>
          <div className="home-steps">
            <div className="home-step">
              <div className="home-step-num">1</div>
              <div className="home-step-body"><strong>安装</strong> — <code>client.install("file-summarizer")</code></div>
            </div>
            <div className="home-step">
              <div className="home-step-num">2</div>
              <div className="home-step-body"><strong>加载</strong> — <code>main.load_package(path)</code>（自动注入 LLM 配置）</div>
            </div>
            <div className="home-step">
              <div className="home-step-num">3</div>
              <div className="home-step-body"><strong>运行</strong> — <code>result = main.run_sync(initial_args={'{"file_path": "..."}'})</code></div>
            </div>
          </div>
        </div>

        <div className="home-card">
          <h3 className="home-card-title">对接本地 Agent 市场</h3>
          <p className="home-card-sub">MarketClient 提供完整的 Python SDK 无缝对接市场：</p>
          <pre className="home-code">{`from market.client import MarketClient
from agents import MainAgent

client = MarketClient(server_url="http://localhost:8321",
                       api_key="pd_mkt_xxxxxxxxxxxxxxxx")
main = MainAgent()

# 搜索
client.search(query="web", category="browser", sort="downloads")
# 安装后直接运行（自动发现 LLM 配置）
path = client.install("file-summarizer")
main.load_package(str(path))
result = main.run_sync(initial_args={"file_path": "data.txt"})
# 发布 / 更新
client.publish("./my-agent-pkg", force=True)
client.check_updates("my-agent")
client.clean_cache(max_age_days=30)
client.list_installed()
client.uninstall("old-agent")`}</pre>
        </div>

        <div className="home-card">
          <h3 className="home-card-title">CLI 命令示例</h3>
          <pre className="home-code">{`# 健康检查 & 搜索
curl http://localhost:8321/api/v1/health
curl "http://localhost:8321/api/v1/agents?q=web&category=browser"

# 发布 / 下载
curl -X POST -H "Authorization: Bearer pd_mkt_..." -F file=@agent.tar.gz \\
  http://localhost:8321/api/v1/agents
curl -OJ http://localhost:8321/api/v1/agents/my-agent/download`}</pre>
        </div>
      </section>

      {/* ======== Agent Package Format ======== */}
      <section className="home-section">
        <div className="home-card">
          <h3 className="home-card-title">
            <Package size={20} className="home-text-accent" />
            Agent 包格式
          </h3>
          <p className="home-card-sub">Agent 包的标准目录结构（支持 .tar.gz / .zip）：</p>
          <pre className="home-code">{`my-agent/
├── agent.json        # [必填] 包元数据 + 入口定义
├── worker.yaml       # [必填] 入口工作流定义
├── libs/             # [可选] 共享 Python 脚本
│   └── helper.py
├── templates/        # [可选] 模板文件
└── README.md         # [推荐] 说明文档`}</pre>
        </div>
      </section>

      {/* ======== agent.json Protocol ======== */}
      <section className="home-section" id="protocol">
        <div className="home-card">
          <h3 className="home-card-title">
            <FileJson size={20} className="home-text-accent" />
            agent.json 协议详解
          </h3>
          <p className="home-card-sub">agent.json 是 Agent 包的核心声明式配置（worker.yaml 位于包根目录）：</p>
          <pre className="home-code">{`{
  // 身份信息（必填）
  "identity": {
    "name": "my-agent",         // 唯一标识
    "version": "1.0.0",         // semver
    "description": "...",
    "author": "your-name",
    "display_name": "显示名称",
    "tags": ["tag1", "tag2"]
  },
  // 入口配置（必填）
  "entry": { "main_subagent": "worker" },
  // 子Agent引用列表（必填）
  "subagents": [
    { "name": "worker", "path": "worker.yaml" }
  ],
  "category": "utility",
  "type": "agent",
  "license": "MIT",
  "dependencies": { "python3": ">=3.10" }
}`}</pre>
        </div>
      </section>

      {/* ======== Security Model ======== */}
      <section className="home-section">
        <div className="home-card">
          <h3 className="home-card-title">
            <Shield size={20} className="home-text-accent" />
            安全与权限模型
          </h3>
          <p className="home-card-sub">每个子Agent声明所需权限，Auditor 自动审计拒绝越权访问：</p>
          <pre className="home-code">{`# 权限声明示例
permissions:
  filesystem:
    read: ["data/**"]
    write: ["output/**"]
  network:
    outbound: true
    allowed_hosts: ["api.example.com"]
  subprocess:
    max_concurrent: 2
    allowed_commands: ["python3", "node"]
  resources:
    memory_limit: "1GB"
    timeout: 300`}</pre>
        </div>
      </section>

      {/* ======== Architecture ======== */}
      <section className="home-section" id="architecture">
        <h2 className="home-section-title">Agent Runtime 架构</h2>

        {/* worker.yaml */}
        <div className="home-card">
          <h3 className="home-card-title">
            <Workflow size={20} className="home-text-accent" />
            子Agent 配置规范 (worker.yaml)
          </h3>
          <p className="home-card-sub">每个子Agent由一个 YAML 文件定义，包含工具声明、Pipeline 步骤和权限配置：</p>
          <pre className="home-code">{`# worker.yaml — 完整示例（根目录）
name: worker
version: "1.0.0"
description: "数据处理 + LLM 分析子Agent"

# 工具声明
tools:
  - name: read_file
    type: builtin
  - name: llm_chat
    type: builtin
    # ★ 自动继承主Agent的 model/api_key/provider
  - name: bash
    type: builtin

# Pipeline 步骤
pipeline:
  - step: read_input
    tool: read_file
    args:
      path: "{{file_path}}"
    output: raw_data
    on_fail: fail

  - step: analyze_llm
    tool: llm_chat
    args:
      prompt: "分析: {{raw_data}}"
      system_prompt: "你是一个数据分析师"
    # model 不传 → 从主Agent自动继承
    output: llm_result
    on_fail: continue   # LLM不可用时不中止

  - step: fallback
    tool: bash
    args:
      command: "python3 {{package_dir}}/libs/analyze.py"
      timeout: 30
    output: done
    on_fail: fail

# 权限声明
permissions:
  filesystem:
    read: ["data/**", "libs/**"]
    write: ["output/**"]
  subprocess:
    max_concurrent: 1
    allowed_commands: ["python3", "cat", "echo"]

# 环境变量
env:
  LOG_LEVEL: "info"`}</pre>

          <div className="home-table-wrap">
            <table className="home-table">
              <thead>
                <tr><th>字段</th><th>类型</th><th>说明</th></tr>
              </thead>
              <tbody>
                <tr><td><code>tools</code></td><td>array</td><td>工具声明列表。类型：builtin / skill / custom / mcp</td></tr>
                <tr><td><code>pipeline[]</code></td><td>array</td><td>顺序执行的步骤列表</td></tr>
                <tr><td><code>pipeline[].on_fail</code></td><td>string</td><td>失败策略：abort / skip / retry(N)</td></tr>
                <tr><td><code>permissions</code></td><td>object</td><td>文件系统、网络、子进程、资源的权限声明</td></tr>
                <tr><td><code>collaboration</code></td><td>object</td><td>协作配置</td></tr>
                <tr><td><code>healthcheck</code></td><td>object</td><td>健康检查配置</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* LLM Config Inheritance */}
        <div className="home-card">
          <h3 className="home-card-title">
            <Cpu size={20} className="home-text-accent" />
            LLM 配置自动继承
          </h3>
          <p className="home-card-sub">子Agent 使用 llm_chat 时，无需配置 model/api_key——配置自动从主 Agent 继承：</p>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead><tr><th>优先级</th><th>读取位置</th><th>示例</th></tr></thead>
              <tbody>
                <tr><td><span className="home-tag home-tag-red">1 最高</span></td><td><code>args.model</code> / <code>args.api_key</code></td><td><code>model: "gpt-4o"</code> 覆盖默认值</td></tr>
                <tr><td><span className="home-tag home-tag-yellow">2 默认</span></td><td><code>shared_context.llm_config</code></td><td>MainAgent 启动时从环境变量读取并注入</td></tr>
                <tr><td><span className="home-tag home-tag-gray">3 兜底</span></td><td>环境变量</td><td><code>LLM_MODEL</code> / <code>OPENROUTER_API_KEY</code></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Collaboration Config */}
        <div className="home-card">
          <h3 className="home-card-title">
            <Network size={20} className="home-text-accent" />
            协作配置 (CollaborationConfig)
          </h3>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead><tr><th>字段</th><th>默认值</th><th>可选值</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td><code>execution_mode</code></td><td>sync</td><td>sync / async / async_wait</td><td>执行模式</td></tr>
                <tr><td><code>trigger</code></td><td>auto</td><td>auto / manual / on_complete / on_fail / conditional</td><td>激活条件</td></tr>
                <tr><td><code>coordination</code></td><td>sequential</td><td>sequential / parallel_all / parallel_any / conditional</td><td>协作策略</td></tr>
                <tr><td><code>data_exchange</code></td><td>file</td><td>file / message / shared_context / stream</td><td>数据交换</td></tr>
                <tr><td><code>merge_strategy</code></td><td>concat</td><td>concat / merge_dict / union / intersect / custom</td><td>结果合并</td></tr>
                <tr><td><code>depends_on</code></td><td>[]</td><td>string[]</td><td>依赖列表</td></tr>
                <tr><td><code>timeout</code></td><td>300</td><td>int</td><td>最大执行时间</td></tr>
                <tr><td><code>max_retries</code></td><td>0</td><td>int</td><td>重试次数</td></tr>
                <tr><td><code>priority</code></td><td>0</td><td>int</td><td>优先级</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* MessageBus Protocol */}
        <div className="home-card">
          <h3 className="home-card-title">
            <MessageSquare size={20} className="home-text-accent" />
            消息总线协议 (MessageBus)
          </h3>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead><tr><th>分类</th><th>消息类型</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td><span className="home-tag home-tag-blue">控制</span></td><td><code>subagent.create</code> / <code>subagent.destroy</code> / <code>subagent.pause</code> / <code>subagent.resume</code></td><td>生命周期控制</td></tr>
                <tr><td><span className="home-tag home-tag-green">任务</span></td><td><code>task.assign</code> / <code>task.progress</code> / <code>task.complete</code> / <code>task.fail</code></td><td>任务管理</td></tr>
                <tr><td><span className="home-tag home-tag-yellow">工具</span></td><td><code>tool.call</code> / <code>tool.result</code> / <code>tool.request</code></td><td>工具调用</td></tr>
                <tr><td><span className="home-tag home-tag-purple">状态</span></td><td><code>status.report</code> / <code>log.emit</code> / <code>health.check</code></td><td>状态报告</td></tr>
                <tr><td><span className="home-tag home-tag-red">协作</span></td><td><code>collab.request_help</code> / <code>collab.forward</code> / <code>collab.merge</code></td><td>Agent间协作</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tool System */}
        <div className="home-card">
          <h3 className="home-card-title">
            <Wrench size={20} className="home-text-accent" />
            工具系统
          </h3>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead><tr><th>类型</th><th>标识</th><th>说明</th><th>示例</th></tr></thead>
              <tbody>
                <tr><td><span className="home-tag home-tag-green">builtin</span></td><td><code>type: builtin</code></td><td>标准内置工具</td><td>read_file, bash, web_fetch, web_search, glob</td></tr>
                <tr><td><span className="home-tag home-tag-purple">skill</span></td><td><code>type: skill</code></td><td>通过 SKILL.md 注册</td><td>自定义数据分析/处理技能</td></tr>
                <tr><td><span className="home-tag home-tag-blue">custom</span></td><td><code>type: custom</code></td><td>用户自定义工具</td><td>internal_api.py, reporter.py</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline Execution */}
        <div className="home-card">
          <h3 className="home-card-title">
            <Gauge size={20} className="home-text-accent" />
            Pipeline 执行机制
          </h3>
          <pre className="home-diagram">{`┌──────────────────────────────────────────────────┐
│               Pipeline 步骤执行流程                │
├──────────────────────────────────────────────────┤
│  1. 模板变量解析                                  │
│     • {{var}} → 运行时参数                        │
│     • {{steps.step_name.output}} → 上一步输出     │
│     • {{shared_context.key}} → 共享上下文         │
│     • {{state.key}} → 子Agent私有状态             │
│                                                   │
│  2. 工具参数注入 → 传递解析后的参数               │
│  3. 工具调用 → call_tool(tool_name, **args)       │
│  4. 错误处理 → abort / skip / retry(N)            │
│  5. 结果保存 → _step_results[step_name]           │
│  6. 进度通知 → MessageBus 发送 TASK_PROGRESS      │
└──────────────────────────────────────────────────┘`}</pre>
        </div>

        {/* Lifecycle */}
        <div className="home-card">
          <h3 className="home-card-title">
            <Workflow size={20} className="home-text-accent" />
            生命周期管理
          </h3>
          <pre className="home-diagram">{`LOADED → VALIDATED → APPROVED → CREATED → RUNNING
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
    PAUSED  COMPLETED  FAILED
        │               │
        └───→ DESTROYED ←───┘`}</pre>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead><tr><th>状态</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td><code>loaded</code></td><td>子Agent配置已从YAML加载</td></tr>
                <tr><td><code>validated</code></td><td>配置校验通过</td></tr>
                <tr><td><code>approved</code></td><td>安全审计通过，权限已批准</td></tr>
                <tr><td><code>created</code></td><td>运行时实例已创建</td></tr>
                <tr><td><code>running</code></td><td>正在执行 Pipeline</td></tr>
                <tr><td><code>paused</code></td><td>已暂停（可恢复）</td></tr>
                <tr><td><code>completed</code></td><td>Pipeline 执行成功完成</td></tr>
                <tr><td><code>failed</code></td><td>执行失败</td></tr>
                <tr><td><code>destroyed</code></td><td>资源已清理，实例已销毁</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* MCP Tool */}
        <div className="home-card">
          <h3 className="home-card-title">
            <Terminal size={20} className="home-text-accent" />
            自定义 MCP 工具
          </h3>
          <pre className="home-code">{`# worker.yaml — MCP 工具声明
tools:
  - name: fs
    type: mcp
    server:
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    allowed_tools: ["read_file", "write_file"]

pipeline:
  - step: read_config
    tool: fs__read_file        # 命名空间格式: <name>__<tool>
    args:
      path: "/tmp/config.json"`}</pre>
        </div>
      </section>

      {/* ======== Market API ======== */}
      <section className="home-section" id="api">
        <h2 className="home-section-title">Market REST API 参考</h2>
        <div className="home-card">
          <h3 className="home-card-title">
            <Server size={20} className="home-text-accent" />
            基础信息
          </h3>
          <div className="home-table-wrap">
            <table className="home-table">
              <tbody>
                <tr><td>Base URL</td><td><code>http://localhost:8321/api/v1</code></td></tr>
                <tr><td>认证方式</td><td><code>Authorization: Bearer pd_mkt_xxx</code></td></tr>
                <tr><td>端口</td><td>8321</td></tr>
                <tr><td>数据库</td><td><code>./data/market/market.db</code> (SQLite)</td></tr>
              </tbody>
            </table>
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>全部端点</h4>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead><tr><th>方法</th><th>路径</th><th>认证</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td><span className="home-method-get">GET</span></td><td className="home-endpoint">/api/v1/health</td><td>—</td><td>健康检查</td></tr>
                <tr><td><span className="home-method-post">POST</span></td><td className="home-endpoint">/api/v1/agents</td><td>publisher+</td><td>注册/上传 Agent 包</td></tr>
                <tr><td><span className="home-method-get">GET</span></td><td className="home-endpoint">/api/v1/agents</td><td>—</td><td>搜索/列表 Agent</td></tr>
                <tr><td><span className="home-method-get">GET</span></td><td className="home-endpoint">/api/v1/agents/batch?ids=a,b,c</td><td>—</td><td>批量查询</td></tr>
                <tr><td><span className="home-method-get">GET</span></td><td className="home-endpoint">/api/v1/agents/{'{id}'}</td><td>—</td><td>获取详情</td></tr>
                <tr><td><span className="home-method-get">GET</span></td><td className="home-endpoint">/api/v1/agents/{'{id}'}/download</td><td>—</td><td>下载包文件</td></tr>
                <tr><td><span className="home-method-post">POST</span></td><td className="home-endpoint">/api/v1/agents/{'{id}'}/ratings</td><td>publisher+</td><td>评分</td></tr>
                <tr><td><span className="home-method-get">GET</span></td><td className="home-endpoint">/api/v1/agents/{'{id}'}/ratings</td><td>—</td><td>获取评分列表</td></tr>
                <tr><td><span className="home-method-delete">DELETE</span></td><td className="home-endpoint">/api/v1/agents/{'{id}'}</td><td>admin</td><td>删除 Agent</td></tr>
                <tr><td><span className="home-method-post">POST</span></td><td className="home-endpoint">/api/v1/api-keys</td><td>master/admin</td><td>创建 API Key</td></tr>
                <tr><td><span className="home-method-get">GET</span></td><td className="home-endpoint">/api/v1/api-keys</td><td>admin</td><td>列出 API Keys</td></tr>
                <tr><td><span className="home-method-delete">DELETE</span></td><td className="home-endpoint">/api/v1/api-keys/{'{key}'}</td><td>admin</td><td>撤销 API Key</td></tr>
              </tbody>
            </table>
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>搜索参数</h4>
          <div className="home-table-wrap">
            <table className="home-table">
              <thead><tr><th>参数</th><th>类型</th><th>默认</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td><code>q</code></td><td>string</td><td>""</td><td>关键词搜索</td></tr>
                <tr><td><code>category</code></td><td>string</td><td>""</td><td>分类过滤</td></tr>
                <tr><td><code>type</code></td><td>string</td><td>""</td><td>类型过滤</td></tr>
                <tr><td><code>tags</code></td><td>string</td><td>""</td><td>标签过滤</td></tr>
                <tr><td><code>sort</code></td><td>string</td><td>"downloads"</td><td>排序字段</td></tr>
                <tr><td><code>order</code></td><td>string</td><td>"desc"</td><td>排序方向</td></tr>
                <tr><td><code>page</code></td><td>int</td><td>1</td><td>页码</td></tr>
                <tr><td><code>page_size</code></td><td>int</td><td>20</td><td>每页条数</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ======== Roadmap ======== */}
      <section className="home-section" id="roadmap">
        <h2 className="home-section-title">未来判断 — Agent 是 AI 能力的原子载体</h2>
        <div className="home-card">
          <p className="home-card-sub">
            我们相信，Agent 将成为 AI 时代最基础的能力封装单位。就像函数是代码的原子、容器是部署的原子、App 是移动互联网的原子 — Agent 是 AI 的原子。
          </p>
          <div className="home-steps">
            <div className="home-step">
              <div className="home-step-num">1</div>
              <div className="home-step-body"><strong>Function 时代</strong> — 一个函数解决一个计算问题。AI 调用函数，但函数不理解 AI。</div>
            </div>
            <div className="home-step">
              <div className="home-step-num">2</div>
              <div className="home-step-body"><strong>Skill 时代</strong> — 一个 Skill 解决一个领域任务。上下文膨胀，仍是被动片段。</div>
            </div>
            <div className="home-step">
              <div className="home-step-num">3</div>
              <div className="home-step-body">
                <strong>Agent 时代 ← 我们在这一步</strong> — Agent 拥有完整世界：工具、状态、配置、权限、记忆。从单功能到复杂系统，同一套抽象自由伸缩。
              </div>
            </div>
            <div className="home-step">
              <div className="home-step-num">4</div>
              <div className="home-step-body"><strong>Agent 协作网络</strong> — Agent 发现 Agent、Agent 编排 Agent、Agent 交易 Agent。市场成为 Agent 的 App Store。</div>
            </div>
            <div className="home-step">
              <div className="home-step-num">5</div>
              <div className="home-step-body"><strong>数字组织</strong> — 成百上千个 Agent 组成自组织系统。像细胞形成组织、组织形成器官、器官形成生命体。</div>
            </div>
          </div>
          <p className="home-card-note">
            核心判断：不要做更大的 Skill，要做完整的 Agent。Agent 的简单与复杂不是对立面 — 一个只读文件的 Agent 和一个多Agent协作的数据分析系统，都是同一个 Agent 抽象。这让复杂度可以递进叠加，而非一次性膨胀。
          </p>
        </div>
      </section>

      {/* ======== Footer ======== */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-left">
            <strong>Agent Hub</strong>
            <span className="home-footer-divider">·</span>
            <span>跨平台 AI Agent 互操作系统</span>
          </div>
          <div className="home-footer-right">
            <span>Phase 8 完成 · MIT License</span>
            <span className="home-footer-divider">·</span>
            <span>维护者: Peng Xiao</span>
            <span className="home-footer-divider">·</span>
            <a href="https://github.com/openpeng/agent-hub" target="_blank" rel="noopener noreferrer">
              <GhIcon size={14} /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
