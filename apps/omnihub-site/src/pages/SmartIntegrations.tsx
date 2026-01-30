import { Layout } from '@/components/Layout';
import { Section, SectionHeader } from '@/components/Section';
import { IconIntegrations } from '@/components/icons';
import {
  FeatureCard,
  CTASection,
  SpecTable,
  UseCaseCard,
} from '@/components/CapabilityPageComponents';
import '../styles/capability-pages.css';

const features = [
  {
    icon: <IconIntegrations size={32} />,
    title: 'Universal Connectivity',
    description: 'Connect to any platform with pre-built adapters and custom integration capabilities.',
    details: 'OmniHub provides a comprehensive library of pre-built integrations for enterprise systems, SaaS platforms, and modern APIs, with the flexibility to create custom adapters for proprietary systems.',
    bulletPoints: [
      'Pre-built adapters for 100+ enterprise platforms',
      'Custom adapter creation framework with SDK',
      'API-first design supporting REST, GraphQL, gRPC, and WebSocket',
      'Legacy system support via SOAP, FTP, and database connectors',
    ],
  },
  {
    icon: <IconIntegrations size={32} />,
    title: 'Unified Data Model',
    description: 'Break down data silos with a canonical data model that normalizes information across all platforms.',
    details: 'The unified data model transforms disparate data formats into a single, consistent representation, enabling seamless data flow and reducing integration complexity.',
    bulletPoints: [
      'Automatic data transformation and normalization',
      'Type-safe data mapping with validation',
      'Bidirectional sync with conflict resolution',
      'Data quality checks and enrichment',
    ],
  },
  {
    icon: <IconIntegrations size={32} />,
    title: 'Real-Time Synchronization',
    description: 'Keep data synchronized across all platforms in real-time with intelligent change detection.',
    details: 'OmniHub monitors data changes across all connected systems and propagates updates instantly, ensuring consistency while minimizing network overhead through smart batching and deduplication.',
    bulletPoints: [
      'Event-driven architecture for instant updates',
      'Change data capture (CDC) for database sync',
      'Intelligent batching and throttling',
      'Conflict detection and resolution strategies',
    ],
  },
];

const useCases = [
  {
    title: 'CRM-ERP Integration',
    description: 'Synchronize customer data, orders, and inventory between CRM and ERP systems in real-time, eliminating data silos and manual data entry.',
  },
  {
    title: 'Marketing Platform Unification',
    description: 'Connect email marketing, social media, analytics, and advertising platforms for a unified view of campaign performance and customer engagement.',
  },
  {
    title: 'Multi-Cloud Data Integration',
    description: 'Integrate data across AWS, Azure, and Google Cloud platforms while maintaining data governance and compliance requirements.',
  },
];

const technicalSpecs = [
  { label: 'Integration Capacity', value: '10,000+ active integrations per instance' },
  { label: 'Sync Latency', value: 'Sub-5 second real-time synchronization (p95)' },
  { label: 'Data Throughput', value: 'Up to 100,000 records/second' },
  { label: 'Supported Platforms', value: 'Salesforce, SAP, Oracle, Microsoft, Google, AWS, Slack, Jira, 100+ more' },
  { label: 'Protocol Support', value: 'REST, GraphQL, gRPC, WebSocket, SOAP, MQTT, AMQP, Kafka, SFTP' },
];

export function SmartIntegrationsPage() {
  return (
    <Layout title="Smart Integrations">
      <Section>
        <SectionHeader
          title="Smart Integrations"
          subtitle="Unify your tools and data into one intelligent system. Say goodbye to silos and productivity bottlenecks."
        />

        <div className="page-content">
          <p className="text-lg mb-8" style={{ lineHeight: '1.75' }}>
            OmniHub's Smart Integrations eliminate the complexity of connecting disparate systems by
            providing a unified integration layer that speaks every platform's language. Whether you're
            integrating legacy systems, modern SaaS applications, or custom-built tools, OmniHub makes
            it seamless.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', marginTop: 'var(--space-12)' }}>
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>

          {/* Use Cases */}
          <div className="section-spacing">
            <h2 className="heading-2 mb-8">Use Cases</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              {useCases.map((useCase) => (
                <UseCaseCard key={useCase.title} {...useCase} />
              ))}
            </div>
          </div>

          {/* Technical Specs */}
          <div className="section-spacing">
            <h2 className="heading-2 mb-8">Technical Specifications</h2>
            <SpecTable specs={technicalSpecs} />
          </div>

          {/* CTA */}
          <CTASection
            title="Ready to unify your systems?"
            description="Discover how Smart Integrations can eliminate data silos and boost productivity."
            buttonText="View Integration Catalog"
            buttonHref="/tech-specs.html"
          />
        </div>
      </Section>
    </Layout>
  );
}
