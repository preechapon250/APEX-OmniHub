import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/Home';
import { OnboardingWizard } from '@/pages/Launch/OnboardingWizard';
import { OmniDashPage } from '@/pages/OmniDash';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Legacy/Existing Pages
import { LoginPage } from '@/pages/Login';
import { PrivacyPage } from '@/pages/Privacy';
import { TermsPage } from '@/pages/Terms';
import { DemoPage } from '@/pages/Demo';
import { TechSpecsPage } from '@/pages/TechSpecs';
import { RequestAccessPage } from '@/pages/RequestAccess';
import { AdvancedAnalyticsPage } from '@/pages/AdvancedAnalytics';
import { AiAutomationPage } from '@/pages/AiAutomation';
import { FortressPage } from '@/pages/Fortress';
import { MaestroPage } from '@/pages/Maestro';
import { ManModePage } from '@/pages/ManMode';
import { OmniPortPage } from '@/pages/OmniPort';
import { OrchestratorPage } from '@/pages/Orchestrator';
import { SmartIntegrationsPage } from '@/pages/SmartIntegrations';
import { TriForcePage } from '@/pages/TriForce';

function App() {
  return (
    <Routes>
      {/* Core Application Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/launch" element={<OnboardingWizard />} />
      <Route
        path="/omnidash"
        element={
          <ProtectedRoute>
            <OmniDashPage />
          </ProtectedRoute>
        }
      />

      {/* Existing Content Pages - Mapping to clean URLs */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/tech-specs" element={<TechSpecsPage />} />
      <Route path="/request-access" element={<RequestAccessPage />} />
      <Route path="/advanced-analytics" element={<AdvancedAnalyticsPage />} />
      <Route path="/ai-automation" element={<AiAutomationPage />} />
      <Route path="/fortress" element={<FortressPage />} />
      <Route path="/maestro" element={<MaestroPage />} />
      <Route path="/omniport" element={<OmniPortPage />} />
      <Route path="/orchestrator" element={<OrchestratorPage />} />
      <Route path="/smart-integrations" element={<SmartIntegrationsPage />} />
      <Route path="/tri-force" element={<TriForcePage />} />

      {/* Man Mode - Protected with Man Mode gating (Feature branch integration) */}
      <Route
        path="/man-mode"
        element={
          <ProtectedRoute requireManMode>
            <ManModePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
