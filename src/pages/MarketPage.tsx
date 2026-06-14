import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Upload,
  Trash2,
  X,
  Package,
  Globe,
  Server,
  Key,
} from 'lucide-react';
import {
  searchMarketAgents,
  getMarketAgentDetail,
  getMarketAgentRatings,
  submitMarketRating,
  deleteMarketAgent,
  uploadMarketAgent,
  checkMarketHealth,
  listApiKeys,
  createApiKey,
  revokeApiKey,
} from '../services/marketApi';
import { mapMarketAgentToConfig } from '../utils/marketMapper';
import { getHeaders } from '../services/marketApi';
import { extractAgentJsonFromTarGz } from '../utils/tarGzParser';
import { useAgentStore } from '../store/useAgentStore';
import type {
  MarketAgentListItem,
  MarketAgentDetail,
  RatingsResult,
  ApiKeyItem,
  HealthStatus,
} from '../services/marketApi';
import './MarketPage.css';

const CATEGORIES = ['全部', 'general', 'browser', 'data_analysis', 'content_creation', 'development', 'ai_chat', 'utility', 'other'];
const TYPES = [
  { value: '', label: '全部类型' },
  { value: 'agent', label: 'Agent' },
  { value: 'skill', label: 'Skill' },
  { value: 'workflow', label: 'Workflow' },
];
const SORTS = [
  { value: 'downloads', label: '下载量' },
  { value: 'rating', label: '评分' },
  { value: 'created', label: '创建时间' },
  { value: 'name', label: '名称' },
];

export default function MarketPage() {
  const navigate = useNavigate();
  const { importFromMarket } = useAgentStore();

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState<'market' | 'upload' | 'keys'>('market');

  // ---- Market tab state ----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSort, setSelectedSort] = useState('downloads');
  const [selectedOrder, setSelectedOrder] = useState<'asc' | 'desc'>('desc');
  const [results, setResults] = useState<MarketAgentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<MarketAgentDetail | null>(null);
  const [ratings, setRatings] = useState<RatingsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState<HealthStatus | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSize = 12;

  // ---- Upload tab state ----
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForce, setUploadForce] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  // ---- Keys tab state ----
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keyOwner, setKeyOwner] = useState('');
  const [keyRole, setKeyRole] = useState('publisher');
  const [keysError, setKeysError] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);

  // ---- Rating state ----
  const [pendingScore, setPendingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // ---- Toast state ----
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ---- Check market health ----
  useEffect(() => {
    checkMarketHealth().then((status) => {
      setMarketStatus(status);
    });
    const interval = setInterval(() => {
      checkMarketHealth().then(setMarketStatus);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ---- Search function ----
  const doSearch = useCallback(async (query: string, category: string, type: string, sort: string, order: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: pageNum, page_size: pageSize, sort, order };
      if (query.trim()) params.q = query.trim();
      if (category !== '全部') params.category = category;
      if (type) params.type = type;
      const result = await searchMarketAgents(params);
      setResults(result.items || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(err.message || '搜索失败');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Search debounce ----
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setSelectedAgent(null);
      doSearch(searchQuery, selectedCategory, selectedType, selectedSort, selectedOrder, 1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, selectedCategory, selectedType, selectedSort, selectedOrder, doSearch]);

  // ---- Load agent detail ----
  const handleSelectAgent = async (agent: MarketAgentListItem) => {
    setDetailLoading(true);
    setPendingScore(0);
    setRatingComment('');
    try {
      const [detail, ratingsData] = await Promise.all([
        getMarketAgentDetail(agent.id),
        getMarketAgentRatings(agent.id),
      ]);
      setSelectedAgent(detail);
      setRatings(ratingsData);
    } catch (err: any) {
      setError(err.message || '获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // ---- Import agent to builder ----
  const handleImport = async () => {
    if (!selectedAgent) return;

    let detail = { ...selectedAgent };

    // 如果 json_content 为空，尝试通过下载包来获取完整的 agent.json
    if (!detail.json_content || detail.json_content === '{}') {
      try {
        const marketUrl = import.meta.env.VITE_MARKET_URL || 'http://localhost:8321';
        const downloadUrl = `${marketUrl}/api/v1/agents/${encodeURIComponent(detail.id)}/download`;
        const resp = await fetch(downloadUrl, { headers: getHeaders() });
        if (resp.ok) {
          const blob = await resp.blob();
          const agentJson = await extractAgentJsonFromTarGz(blob);
          if (agentJson) {
            detail = { ...detail, json_content: JSON.stringify(agentJson) };
          }
        }
      } catch {
        // 下载失败则使用已有数据
      }
    }

    const config = mapMarketAgentToConfig(detail);
    importFromMarket(config);
    showToast(`已导入「${detail.display_name}」，前往编辑`, 'success');
    setTimeout(() => navigate('/intro'), 800);
  };

  // ---- Pagination ----
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedAgent(null);
    doSearch(searchQuery, selectedCategory, selectedType, selectedSort, selectedOrder, newPage);
  };

  // ---- Upload handlers ----
  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    setUploadResult(null);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const result = await uploadMarketAgent(uploadFile, uploadForce);
      setUploadResult(`上传成功！ID: ${result.id}, 版本: ${result.version}`);
      showToast('Agent 上传成功', 'success');
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || '上传失败');
      showToast(err.message || '上传失败', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ---- Drag & drop ----
  useEffect(() => {
    const zone = uploadZoneRef.current;
    if (!zone) return;
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); zone.classList.add('drag'); };
    const handleDragLeave = () => zone.classList.remove('drag');
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      zone.classList.remove('drag');
      if (e.dataTransfer?.files.length) handleFileSelect(e.dataTransfer.files[0]);
    };
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
    return () => {
      zone.removeEventListener('dragover', handleDragOver);
      zone.removeEventListener('dragleave', handleDragLeave);
      zone.removeEventListener('drop', handleDrop);
    };
  }, []);

  // ---- API Keys ----
  const loadApiKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const keys = await listApiKeys();
      setApiKeys(keys);
    } catch (err: any) {
      setKeysError(err.message || '获取失败');
      setApiKeys([]);
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'keys') loadApiKeys();
  }, [activeTab, loadApiKeys]);

  const handleCreateKey = async () => {
    if (!keyOwner.trim()) {
      showToast('请输入 Owner 名称', 'error');
      return;
    }
    try {
      const result = await createApiKey(keyOwner.trim(), keyRole);
      setNewKeyResult(result.key);
      localStorage.setItem('market_api_key', result.key);
      showToast('API Key 创建成功', 'success');
      setKeyOwner('');
      loadApiKeys();
    } catch (err: any) {
      showToast(err.message || '创建失败', 'error');
    }
  };

  const handleRevokeKey = async (key: string) => {
    if (!confirm(`确定撤销 Key: ${key}？`)) return;
    try {
      await revokeApiKey(key);
      showToast('Key 已撤销', 'success');
      loadApiKeys();
    } catch (err: any) {
      showToast(err.message || '撤销失败', 'error');
    }
  };

  // ---- Rating ----
  const handleSubmitRating = async () => {
    if (!selectedAgent || !pendingScore) {
      showToast('请选择评分星级', 'error');
      return;
    }
    setSubmittingRating(true);
    try {
      await submitMarketRating(selectedAgent.id, pendingScore, ratingComment);
      showToast('评分提交成功', 'success');
      setPendingScore(0);
      setRatingComment('');
      // Refresh ratings
      const ratingsData = await getMarketAgentRatings(selectedAgent.id);
      setRatings(ratingsData);
    } catch (err: any) {
      showToast(err.message || '评分失败', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  // ---- Delete agent ----
  const handleDeleteAgent = async (id: string, name: string) => {
    if (!confirm(`确定删除 Agent「${name}」？此操作不可撤销。`)) return;
    try {
      await deleteMarketAgent(id);
      showToast('Agent 已删除', 'success');
      setSelectedAgent(null);
      doSearch(searchQuery, selectedCategory, selectedType, selectedSort, selectedOrder, page);
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="market-page">
      {/* Toast */}
      {toast && (
        <div className={`market-toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* Header */}
      <div className="market-page-header">
        <div className="market-page-header-left">
          <Globe size={20} />
          <h2>Agent 市场</h2>
          <span className={`market-status-dot ${marketStatus ? 'online' : 'offline'}`} />
          <span className="market-status-text">
            {marketStatus ? `在线 · ${marketStatus.agents_count} 个 Agent` : '离线'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="market-tabs">
        <button
          className={`market-tab ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          <Search size={14} /> 浏览市场
        </button>
        <button
          className={`market-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={14} /> 上传发布
        </button>
        <button
          className={`market-tab ${activeTab === 'keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('keys')}
        >
          <Key size={14} /> API Keys
        </button>
      </div>

      {/* ========== MARKET TAB ========== */}
      {activeTab === 'market' && (
        <div className="market-tab-content">
          {/* Search bar */}
          <div className="market-search-row">
            <div className="market-search-box">
              <Search size={16} className="market-search-icon" />
              <input
                type="text"
                placeholder="搜索 Agent 名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              className="btn btn-sm"
              onClick={() => setSelectedOrder(selectedOrder === 'desc' ? 'asc' : 'desc')}
            >
              {selectedOrder === 'desc' ? '降序' : '升序'}
            </button>
          </div>

          {/* Category filter */}
          <div className="market-category-row">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`market-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === '全部' ? '全部' : cat}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="market-error-bar">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Results area */}
          <div className="market-results-layout">
            {/* Agent grid */}
            <div className="market-agent-grid">
              {loading ? (
                <div className="market-loading-center">
                  <div className="market-spinner" />
                  搜索中...
                </div>
              ) : results.length === 0 ? (
                <div className="market-empty-center">
                  <Package size={40} />
                  <div>未找到匹配的 Agent</div>
                  <div className="hint">尝试其他关键词或分类</div>
                </div>
              ) : (
                <>
                  {results.map((agent) => (
                    <div
                      key={agent.id}
                      className={`market-agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                      onClick={() => handleSelectAgent(agent)}
                    >
                      <div className="market-agent-card-top">
                        <span className="market-agent-card-name">{agent.display_name}</span>
                        <span className="market-agent-card-version">v{agent.version}</span>
                      </div>
                      <div className="market-agent-card-desc">{agent.description}</div>
                      <div className="market-agent-card-bottom">
                        <span className="market-agent-card-category">{agent.category}</span>
                        <span className="market-agent-card-stars">
                          <Star size={12} /> {agent.rating > 0 ? agent.rating.toFixed(1) : '--'}
                        </span>
                        <span className="market-agent-card-downloads">
                          <Download size={12} /> {agent.download_count}
                        </span>
                      </div>
                      {agent.tags?.length > 0 && (
                        <div className="market-agent-card-tags">
                          {agent.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="market-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="market-pagination-row">
                      <button
                        className="btn btn-sm"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                      >
                        <ChevronLeft size={14} /> 上一页
                      </button>
                      <span className="market-pagination-info">
                        第 {page} / {totalPages} 页 (共 {total} 个)
                      </span>
                      <button
                        className="btn btn-sm"
                        disabled={page >= totalPages}
                        onClick={() => handlePageChange(page + 1)}
                      >
                        下一页 <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Detail panel */}
            <div className={`market-detail-sidebar ${!selectedAgent ? 'empty' : ''}`}>
              {!selectedAgent ? (
                detailLoading ? (
                  <div className="market-loading-center">
                    <div className="market-spinner" />
                    加载详情...
                  </div>
                ) : (
                  <div className="market-empty-center">
                    <Server size={32} />
                    <div>点击左侧 Agent 查看详情</div>
                  </div>
                )
              ) : (
                <div className="market-detail-content">
                  <div className="market-detail-header">
                    <h3>{selectedAgent.display_name}</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAgent(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="market-detail-meta">
                    v{selectedAgent.version} · {selectedAgent.author || '未知作者'}
                  </div>
                  <div className="market-detail-desc">{selectedAgent.readme || selectedAgent.description}</div>

                  <div className="market-detail-info-list">
                    <div className="market-detail-info-row">
                      <span className="label">分类</span>
                      <span>{selectedAgent.category}</span>
                    </div>
                    <div className="market-detail-info-row">
                      <span className="label">类型</span>
                      <span>{selectedAgent.type}</span>
                    </div>
                    <div className="market-detail-info-row">
                      <span className="label">评分</span>
                      <span><Star size={12} /> {selectedAgent.rating > 0 ? selectedAgent.rating.toFixed(1) : '--'}</span>
                    </div>
                    <div className="market-detail-info-row">
                      <span className="label">下载</span>
                      <span>{selectedAgent.download_count} 次</span>
                    </div>
                    <div className="market-detail-info-row">
                      <span className="label">大小</span>
                      <span>{formatSize(selectedAgent.package_size)}</span>
                    </div>
                    <div className="market-detail-info-row">
                      <span className="label">许可</span>
                      <span>{selectedAgent.license || 'MIT'}</span>
                    </div>
                  </div>

                  {selectedAgent.tags?.length > 0 && (
                    <div className="market-detail-tags-row">
                      {selectedAgent.tags.map((tag) => (
                        <span key={tag} className="market-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="market-detail-actions">
                    <button className="btn btn-primary" onClick={handleImport}>
                      <Download size={14} /> 导入到构建器
                    </button>
                    <a
                      className="btn btn-outline"
                      href={`${import.meta.env.VITE_MARKET_URL || 'http://localhost:8321'}/api/v1/agents/${encodeURIComponent(selectedAgent.id)}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Package size={14} /> 下载包
                    </a>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteAgent(selectedAgent.id, selectedAgent.display_name)}
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>

                  {/* Ratings section */}
                  <div className="market-ratings-section">
                    <h4>评分 ({ratings?.total || 0})</h4>
                    <div className="market-rating-stars-input">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          className={`star-btn ${s <= pendingScore ? 'active' : ''}`}
                          onClick={() => setPendingScore(s)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="market-rating-comment"
                      placeholder="写下你的评价..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={2}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSubmitRating}
                      disabled={submittingRating || !pendingScore}
                    >
                      {submittingRating ? '提交中...' : '提交评分'}
                    </button>

                    {ratings?.items && ratings.items.length > 0 && (
                      <div className="market-rating-list">
                        {ratings.items.map((r, i) => (
                          <div key={i} className="market-rating-item">
                            <div className="market-rating-item-stars">
                              {'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}
                            </div>
                            <div className="market-rating-item-comment">{r.comment || '无评论'}</div>
                            <div className="market-rating-item-date">{r.created_at}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== UPLOAD TAB ========== */}
      {activeTab === 'upload' && (
        <div className="market-tab-content">
          <div
            className="market-upload-zone"
            ref={uploadZoneRef}
            onClick={() => document.getElementById('uploadFileInput')?.click()}
          >
            <Package size={48} />
            <div>点击或拖拽上传 Agent 包</div>
            <div className="hint">支持 .tar.gz / .zip 格式，最大 50MB</div>
            <input
              id="uploadFileInput"
              type="file"
              accept=".tar.gz,.zip"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>

          {uploadFile && (
            <div className="market-upload-fileinfo">
              <Package size={16} />
              <span>{uploadFile.name} ({formatSize(uploadFile.size)})</span>
            </div>
          )}

          <div className="market-upload-actions">
            <label className="market-upload-force">
              <input
                type="checkbox"
                checked={uploadForce}
                onChange={(e) => setUploadForce(e.target.checked)}
              />
              强制覆盖已有版本
            </label>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
            >
              {uploading ? (
                <>
                  <div className="market-spinner" style={{ width: 16, height: 16, marginRight: 8 }} />
                  上传中...
                </>
              ) : (
                <>
                  <Upload size={14} /> 上传并注册
                </>
              )}
            </button>
          </div>

          {uploadResult && (
            <div className="market-upload-result success">
              <div>✅ {uploadResult}</div>
            </div>
          )}
          {uploadError && (
            <div className="market-upload-result error">
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}
        </div>
      )}

      {/* ========== KEYS TAB ========== */}
      {activeTab === 'keys' && (
        <div className="market-tab-content">
          <div className="market-keys-form">
            <input
              type="text"
              placeholder="Owner 名称"
              value={keyOwner}
              onChange={(e) => setKeyOwner(e.target.value)}
              className="form-input"
              style={{ width: 200 }}
            />
            <select
              value={keyRole}
              onChange={(e) => setKeyRole(e.target.value)}
              className="form-input"
            >
              <option value="publisher">Publisher</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-primary" onClick={handleCreateKey}>
              <Key size={14} /> 创建 Key
            </button>
          </div>

          {newKeyResult && (
            <div className="market-new-key-result">
              <div className="success">Key 创建成功！</div>
              <code>{newKeyResult}</code>
              <div className="hint">已自动保存到本地存储</div>
            </div>
          )}

          {keysError && (
            <div className="market-error-bar">
              <AlertCircle size={14} /> {keysError}
            </div>
          )}

          {keysLoading ? (
            <div className="market-loading-center">
              <div className="market-spinner" />
              加载中...
            </div>
          ) : apiKeys.length > 0 ? (
            <table className="market-keys-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Owner</th>
                  <th>Role</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.key}>
                    <td><code>{k.key}</code></td>
                    <td>{k.owner}</td>
                    <td><span className="market-tag">{k.role}</span></td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRevokeKey(k.key)}
                      >
                        <Trash2 size={12} /> 撤销
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="market-empty-center">
              <Key size={32} />
              <div>暂无 API Keys</div>
              <div className="hint">在上方创建第一条 Key</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatSize(b: number): string {
  if (!b) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
