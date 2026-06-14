// 市场数据 → AgentConfig 映射工具

import type { AgentConfig, SkillRef, McpToolRef } from '../types';
import type { MarketAgentDetail } from '../services/marketApi';

const CATEGORY_MAP: Record<string, string> = {
  general: '办公效率',
  browser: '开发工具',
  data_analysis: '数据分析',
  content_creation: '内容创作',
  web_scraper: '数据分析',
  file_processor: '办公效率',
  ai_chat: '客户服务',
  utility: '办公效率',
  development: '开发工具',
  other: '办公效率',
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  general: '🤖',
  browser: '🔍',
  data_analysis: '📊',
  content_creation: '✍️',
  web_scraper: '🔍',
  file_processor: '📋',
  ai_chat: '💬',
  utility: '🛠️',
  development: '🛠️',
};

export function mapMarketAgentToConfig(detail: MarketAgentDetail): Partial<AgentConfig> {
  let jsonContent: any = null;
  try {
    jsonContent = JSON.parse(detail.json_content || '{}');
  } catch {
    // json_content 可能不是有效 JSON
  }

  const mappedCategory = CATEGORY_MAP[detail.category] || '办公效率';
  const instructions = jsonContent?.instructions || '';
  const summary = detail.description?.split('\n')[0] || detail.description || '';
  const detailText = instructions ? instructions.substring(0, 500) : detail.description || '';

  const skills: SkillRef[] = [];
  if (jsonContent?.skills && Array.isArray(jsonContent.skills)) {
    jsonContent.skills.forEach((skill: any, index: number) => {
      skills.push({
        skillId: skill.name || skill.id || `skill-${index}`,
        name: skill.display_name || skill.name || `Skill ${index + 1}`,
        version: skill.version || '1.0.0',
        description: skill.description || '',
        icon: skill.icon || '🛠️',
        category: skill.category || mappedCategory,
        parameters: skill.parameters || {},
        priority: index,
        isOfficial: false,
      });
    });
  }

  const mcpTools: McpToolRef[] = [];
  if (jsonContent?.mcp?.required_servers && Array.isArray(jsonContent.mcp.required_servers)) {
    jsonContent.mcp.required_servers.forEach((server: any) => {
      mcpTools.push({
        toolId: server.name || server.package || `mcp-${Date.now()}`,
        name: server.name || server.description || 'MCP Tool',
        description: server.description || '',
        icon: '🔌',
        category: '第三方API',
        config: {},
        permissions: [],
        isConnected: false,
      });
    });
  }

  const categories = [mappedCategory];
  if (detail.tags?.length) {
    detail.tags.forEach(tag => {
      const mapped = CATEGORY_MAP[tag];
      if (mapped && !categories.includes(mapped)) {
        categories.push(mapped);
      }
    });
  }

  const examples = jsonContent?.usage_examples
    ?.map((e: any) => e.input || '')
    .filter(Boolean) || [];

  return {
    name: detail.display_name || detail.name || '',
    version: detail.version || '1.0.0',
    icon: CATEGORY_ICON_MAP[detail.category] || '🤖',
    developer: detail.author || '',
    description: {
      summary,
      detail: detailText,
      examples,
    },
    categories: categories.slice(0, 3),
    skills,
    mcpTools,
    welcomeMessage: `你好！我是${detail.display_name || detail.name || 'AI助手'}，${summary}`,
    sampleInputs: examples,
  };
}
