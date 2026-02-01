import { CapabilityPageTemplate } from '@/components/CapabilityPageTemplate';
import { advancedAnalyticsData } from '@/data/capability-pages';

export function AdvancedAnalyticsPage() {
  return <CapabilityPageTemplate {...advancedAnalyticsData} />;
}
