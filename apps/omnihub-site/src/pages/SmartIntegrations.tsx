import { CapabilityPageTemplate } from '@/components/CapabilityPageTemplate';
import { smartIntegrationsData } from '@/data/capability-pages';

export function SmartIntegrationsPage() {
  return <CapabilityPageTemplate {...smartIntegrationsData} />;
}
