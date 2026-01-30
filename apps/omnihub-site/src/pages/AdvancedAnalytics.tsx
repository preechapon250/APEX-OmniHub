import { Layout } from '@/components/Layout';
import { Section, SectionHeader } from '@/components/Section';
import { IconAnalytics } from '@/components/icons';
import {
  FeatureCard,
  CTASection,
  SpecTable,
  UseCaseCard,
} from '@/components/CapabilityPageComponents';
import '../styles/capability-pages.css';

const features = [
  {
    icon: <IconAnalytics size={32} />,
    title: '360° Operational Visibility',
    description: 'Gain complete visibility into your operations with unified dashboards and real-time metrics.',
    details: 'OmniHub aggregates data from all connected systems into a single, comprehensive view. Track KPIs, monitor workflows, and identify bottlenecks across your entire operation in real-time.',
    bulletPoints: [
      'Real-time dashboards with customizable widgets',
      'Cross-platform metric aggregation and correlation',
      'Drill-down capabilities for root cause analysis',
      'Automated anomaly detection and alerts',
    ],
  },
  {
    icon: <IconAnalytics size={32} />,
    title: 'Predictive Intelligence',
    description: 'Leverage AI-powered predictive analytics to anticipate trends and optimize operations.',
    details: 'Advanced machine learning models analyze historical patterns and current trends to provide actionable insights and forecasts, helping you stay ahead of potential issues and opportunities.',
    bulletPoints: [
      'Forecasting models for resource planning',
      'Trend analysis and pattern recognition',
      'Predictive maintenance and issue detection',
      'What-if scenario modeling and simulation',
    ],
  },
  {
    icon: <IconAnalytics size={32} />,
    title: 'Business Intelligence & Reporting',
    description: 'Transform raw data into actionable insights with powerful BI tools and custom reporting.',
    details: 'Create custom reports, automate distribution, and enable self-service analytics for stakeholders across your organization. From executive summaries to detailed operational reports, OmniHub delivers the insights you need.',
    bulletPoints: [
      'Custom report builder with drag-and-drop interface',
      'Scheduled report generation and distribution',
      'Interactive data exploration and visualization',
      'Export capabilities for Excel, PDF, and BI tools',
    ],
  },
];

const useCases = [
  {
    title: 'Executive Performance Dashboards',
    description: 'Consolidate KPIs from sales, operations, finance, and customer success into executive-ready dashboards with real-time updates.',
  },
  {
    title: 'Workflow Performance Optimization',
    description: 'Analyze workflow execution patterns, identify bottlenecks, and receive AI-driven recommendations for optimization.',
  },
  {
    title: 'Customer Journey Analytics',
    description: 'Track customer interactions across all touchpoints to understand behavior patterns, improve experiences, and increase retention.',
  },
];

const technicalSpecs = [
  { label: 'Data Processing', value: 'Up to 1 million events/second for analytics' },
  { label: 'Query Performance', value: 'Sub-second query response on datasets up to 10TB' },
  { label: 'Dashboard Refresh', value: 'Real-time updates with <100ms latency' },
  { label: 'Data Retention', value: 'Configurable retention from 30 days to unlimited' },
  { label: 'Visualization Types', value: 'Charts, graphs, maps, heatmaps, custom widgets' },
  { label: 'Export Formats', value: 'CSV, Excel, PDF, JSON, API access' },
];

export function AdvancedAnalyticsPage() {
  return (
    <Layout title="Advanced Analytics">
      <Section>
        <SectionHeader
          title="Advanced Analytics"
          subtitle="Gain a 360° view of your organization. Make data-driven decisions with cutting-edge insights."
        />

        <div className="page-content">
          <p className="text-lg mb-8" style={{ lineHeight: '1.75' }}>
            OmniHub's Advanced Analytics transforms raw operational data into strategic insights. By
            aggregating and analyzing data from all your connected systems, you gain unprecedented
            visibility into your organization's performance, enabling faster, more informed decision-making.
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
            title="Ready to unlock insights?"
            description="Discover how Advanced Analytics can transform your data into strategic advantages."
            buttonText="Schedule a Demo"
            buttonHref="/demo.html"
          />
        </div>
      </Section>
    </Layout>
  );
}
