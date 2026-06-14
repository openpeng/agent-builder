import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BuilderLayout } from './components/Layout';
import { useAgentStore } from './store/useAgentStore';
import QuickStart from './pages/QuickStart';
import AgentIntro from './pages/AgentIntro';
import SkillSelector from './pages/SkillSelector';
import McpToolSelector from './pages/McpToolSelector';
import PreviewPublish from './pages/PreviewPublish';
import MarketPage from './pages/MarketPage';

// 路由与store步骤同步组件
function StepSync() {
  const location = useLocation();
  const setCurrentStep = useAgentStore((s) => s.setCurrentStep);

  useEffect(() => {
    const pathStepMap: Record<string, 'intro' | 'skills' | 'mcp-tools' | 'preview-publish'> = {
      '/quick-start': 'intro',
      '/intro': 'intro',
      '/skills': 'skills',
      '/mcp-tools': 'mcp-tools',
      '/preview-publish': 'preview-publish',
    };
    const step = pathStepMap[location.pathname];
    if (step) setCurrentStep(step);
  }, [location.pathname, setCurrentStep]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <StepSync />
      <BuilderLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/market" replace />} />
          <Route path="/quick-start" element={<QuickStart />} />
          <Route path="/intro" element={<AgentIntro />} />
          <Route path="/skills" element={<SkillSelector />} />
          <Route path="/mcp-tools" element={<McpToolSelector />} />
          <Route path="/preview-publish" element={<PreviewPublish />} />
          <Route path="/market" element={<MarketPage />} />
        </Routes>
      </BuilderLayout>
    </BrowserRouter>
  );
}

export default App;
