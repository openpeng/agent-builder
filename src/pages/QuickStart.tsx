import { useNavigate } from 'react-router-dom';
import { Download, Sparkles, Edit3 } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import './QuickStart.css';

export default function QuickStart() {
  const navigate = useNavigate();
  const { agent, resetAgent } = useAgentStore();

  const handleManualCreate = () => {
    resetAgent();
    navigate('/intro');
  };

  const handleMarketImport = () => {
    // 触发 MarketImportModal — 通过 custom event
    window.dispatchEvent(new CustomEvent('open-market-import'));
  };

  const handleAiFill = () => {
    // 触发 AiAutoFillModal — 通过 custom event
    window.dispatchEvent(new CustomEvent('open-ai-fill'));
  };

  return (
    <div className="quickstart-page">
      <div className="quickstart-header">
        <h1>创建新的 Agent</h1>
        <p>选择一种方式开始构建你的 AI Agent</p>
      </div>

      <div className="quickstart-methods">
        {/* 从市场导入 */}
        <div className="quickstart-card" onClick={handleMarketImport}>
          <span className="quickstart-card-badge recommend">推荐</span>
          <div className="quickstart-card-icon">📥</div>
          <div className="quickstart-card-title">从市场导入</div>
          <div className="quickstart-card-desc">搜索市场中的已有 Agent，导入其配置并在此基础上修改</div>
          <div className="quickstart-card-action">
            开始 <Download size={14} />
          </div>
        </div>

        {/* AI 智能填写 */}
        <div className="quickstart-card ai-card" onClick={handleAiFill}>
          <span className="quickstart-card-badge smart">智能</span>
          <div className="quickstart-card-icon">✨</div>
          <div className="quickstart-card-title">AI 智能填写</div>
          <div className="quickstart-card-desc">描述你想要的 Agent，AI 自动生成完整配置</div>
          <div className="quickstart-card-action">
            开始 <Sparkles size={14} />
          </div>
        </div>

        {/* 手动创建 */}
        <div className="quickstart-card" onClick={handleManualCreate}>
          <div className="quickstart-card-icon">✏️</div>
          <div className="quickstart-card-title">手动创建</div>
          <div className="quickstart-card-desc">从零开始手动填写所有配置项，完全自定义</div>
          <div className="quickstart-card-action">
            开始 <Edit3 size={14} />
          </div>
        </div>
      </div>

      {/* 最近编辑 */}
      {agent.name && (
        <div className="quickstart-recent">
          <div className="quickstart-recent-title">当前编辑</div>
          <div className="quickstart-recent-list">
            <div className="quickstart-recent-item" onClick={() => navigate('/intro')}>
              <div className="quickstart-recent-icon">{agent.icon || '🤖'}</div>
              <div className="quickstart-recent-info">
                <div className="quickstart-recent-name">{agent.name}</div>
                <div className="quickstart-recent-meta">v{agent.version} · {agent.developer || '未知开发者'}</div>
              </div>
              <span className={`quickstart-recent-status ${agent.status}`}>
                {agent.status === 'published' ? '已发布' : '草稿'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
