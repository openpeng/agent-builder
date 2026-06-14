# Agent 可视化构建器

通过直观的可视化界面，零代码构建、配置并发布自定义 Agent 到市场。

## 功能特性

- **Agent 介绍配置** - 名称、图标、描述、分类标签、欢迎语
- **Skill 选择** - 从 Skill 库浏览、搜索、多选、拖拽排序、参数配置
- **MCP 工具选择** - 配置外部工具调用能力、权限管理、连接测试
- **预览发布** - 配置校验、对话测试、一键发布到市场

## 技术栈

- React 18 + TypeScript
- Zustand 状态管理
- React Router v7 路由
- @dnd-kit 拖拽排序
- Lucide React 图标
- Vite 构建工具

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── components/Layout/     # 布局组件（三栏布局、步骤导航、预览面板）
├── data/                  # 模拟数据（Skills、MCP工具）
├── pages/                 # 页面组件
│   ├── AgentIntro.tsx     # Agent介绍配置
│   ├── SkillSelector.tsx  # Skill选择
│   ├── McpToolSelector.tsx # MCP工具选择
│   └── PreviewPublish.tsx # 预览与发布
├── store/                 # Zustand状态管理
├── styles/                # 全局样式
├── types/                 # TypeScript类型定义
├── App.tsx                # 应用入口
└── main.tsx               # React根节点
```
