// 市场 API 封装 — 对接 agent-market FastAPI 服务

const DEFAULT_MARKET_URL = import.meta.env.VITE_MARKET_URL || 'http://localhost:8321';

export interface MarketAgentListItem {
  id: string;
  display_name: string;
  version: string;
  description: string;
  category: string;
  tags: string[];
  download_count: number;
  rating: number;
  package_size: number;
  created_at: string;
}

export interface MarketAgentDetail extends MarketAgentListItem {
  name: string;
  author: string;
  type: string;
  readme: string;
  license: string;
  homepage_url: string;
  source_url: string;
  dependencies: Record<string, string>;
  json_content: string;
  updated_at: string;
  published_at: string | null;
}

export interface MarketSearchResult {
  total: number;
  page: number;
  page_size: number;
  items: MarketAgentListItem[];
}

export interface RatingItem {
  score: number;
  comment: string;
  created_at: string;
}

export interface RatingsResult {
  items: RatingItem[];
  total: number;
  average: number;
}

export interface UploadResult {
  id: string;
  version: string;
  package_size: number;
}

export interface ApiKeyItem {
  key: string;
  owner: string;
  role: string;
}

export interface HealthStatus {
  status: string;
  agents_count: number;
  uptime: number;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const apiKey = localStorage.getItem('market_api_key');
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

export async function searchMarketAgents(params: {
  q?: string;
  category?: string;
  type?: string;
  tags?: string;
  sort?: 'downloads' | 'rating' | 'created' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
  marketUrl?: string;
}): Promise<MarketSearchResult> {
  const baseUrl = params.marketUrl || DEFAULT_MARKET_URL;
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.category) searchParams.set('category', params.category);
  if (params.type) searchParams.set('type', params.type);
  if (params.tags) searchParams.set('tags', params.tags);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.page_size) searchParams.set('page_size', String(params.page_size));

  const res = await fetch(`${baseUrl}/api/v1/agents?${searchParams}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`市场API错误: ${res.status}`);
  return res.json();
}

export async function getMarketAgentDetail(
  agentId: string,
  marketUrl?: string
): Promise<MarketAgentDetail> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const res = await fetch(`${baseUrl}/api/v1/agents/${encodeURIComponent(agentId)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`市场API错误: ${res.status}`);
  return res.json();
}

export async function getMarketAgentRatings(
  agentId: string,
  marketUrl?: string
): Promise<RatingsResult> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const res = await fetch(`${baseUrl}/api/v1/agents/${encodeURIComponent(agentId)}/ratings`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`市场API错误: ${res.status}`);
  return res.json();
}

export async function submitMarketRating(
  agentId: string,
  score: number,
  comment: string,
  marketUrl?: string
): Promise<void> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const res = await fetch(`${baseUrl}/api/v1/agents/${encodeURIComponent(agentId)}/ratings`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, comment }),
  });
  if (!res.ok) throw new Error(`评分提交失败: ${res.status}`);
}

export async function deleteMarketAgent(
  agentId: string,
  marketUrl?: string
): Promise<void> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const res = await fetch(`${baseUrl}/api/v1/agents/${encodeURIComponent(agentId)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`删除失败: ${res.status}`);
}

export async function uploadMarketAgent(
  file: File,
  force: boolean,
  marketUrl?: string
): Promise<UploadResult> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('force', String(force));

  const res = await fetch(`${baseUrl}/api/v1/agents`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `上传失败: ${res.status}`);
  }
  return res.json();
}

export async function listApiKeys(marketUrl?: string): Promise<ApiKeyItem[]> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const res = await fetch(`${baseUrl}/api/v1/api-keys`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`获取API Keys失败: ${res.status}`);
  return res.json();
}

export async function createApiKey(
  owner: string,
  role: string,
  marketUrl?: string
): Promise<{ key: string }> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const res = await fetch(`${baseUrl}/api/v1/api-keys`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建失败: ${res.status}`);
  }
  return res.json();
}

export async function revokeApiKey(
  key: string,
  marketUrl?: string
): Promise<void> {
  const baseUrl = marketUrl || DEFAULT_MARKET_URL;
  const res = await fetch(`${baseUrl}/api/v1/api-keys/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`撤销失败: ${res.status}`);
}

export async function checkMarketHealth(marketUrl?: string): Promise<HealthStatus | null> {
  try {
    const baseUrl = marketUrl || DEFAULT_MARKET_URL;
    const res = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
