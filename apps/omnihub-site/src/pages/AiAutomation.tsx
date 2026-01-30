import { Layout } from '@/components/Layout';
import { Section, SectionHeader } from '@/components/Section';
import { IconAutomation } from '@/components/icons';
import {
  FeatureCard,
  CTASection,
  SpecTable,
  UseCaseCard,
} from '@/components/CapabilityPageComponents';
import '../styles/capability-pages.css';

const features = [
  {
    icon: <IconAutomation size={32} />,
    title: 'Intelligent Workflow Automation',
    description: 'Automate complex business processes with AI-driven decision making and adaptive execution.',
    details: 'OmniHub\'s AI-powered automation goes beyond simple task automation. It understands context, learns from patterns, and adapts to changing conditions in real-time.',
    bulletPoints: [
      'Natural language workflow creation and modification',
      'Adaptive execution based on real-time conditions',
      'Intelligent error handling and self-healing processes',
      'Predictive analytics for proactive optimization',
    ],
  },
  {
    icon: <IconAutomation size={32} />,
    title: 'Smart Task Orchestration',
    description: 'Coordinate multi-step processes across platforms with intelligent routing and prioritization.',
    details: 'The orchestration engine analyzes task dependencies, resource availability, and business priorities to optimize workflow execution automatically.',
    bulletPoints: [
      'Dynamic task prioritization and scheduling',
      'Resource optimization and load balancing',
      'Parallel execution with dependency management',
      'Real-time progress tracking and reporting',
    ],
  },
  {
    icon: <IconAutomation size={32} />,
    title: 'Continuous Learning & Optimization',
    description: 'AI models that continuously improve based on execution patterns and outcomes.',
    details: 'Every workflow execution generates insights that feed back into the AI models, creating a system that gets smarter over time.',
    bulletPoints: [
      'Pattern recognition and anomaly detection',
      'Performance optimization recommendations',
      'Automated workflow refinement suggestions',
      'Historical trend analysis and forecasting',
    ],
  },
];

const useCases = [
  {
    title: 'Customer Onboarding Automation',
    description: 'Streamline customer onboarding across CRM, billing, support, and communication platforms with intelligent data routing and validation.',
  },
  {
    title: 'Incident Response Orchestration',
    description: 'Automatically detect, categorize, and route incidents to appropriate teams while coordinating cross-platform notifications and escalations.',
  },
  {
    title: 'Data Pipeline Management',
    description: 'Orchestrate complex data workflows across ETL tools, databases, and analytics platforms with intelligent error recovery and data quality checks.',
  },
];

const technicalSpecs = [
  { label: 'Workflow Capacity', value: 'Up to 50,000 concurrent workflows' },
  { label: 'Decision Latency', value: 'Sub-50ms AI-driven decision making (p95)' },
  { label: 'Automation Success Rate', value: '99.7% successful execution rate' },
  { label: 'Learning Models', value: 'Transformer-based NLP, reinforcement learning, pattern recognition' },
  { label: 'Supported AI Providers', value: 'OpenAI, Anthropic, Google AI, Azure OpenAI, local models' },
];

export function AiAutomationPage() {
  return (
    <Layout title="AI-Powered Automation">
      <Section>
        <SectionHeader
          title="AI-Powered Automation"
          subtitle="Imagine a platform that anticipates your needs and streamlines your operations effortlessly"
        />

        <div className="page-content">
          <p className="text-lg mb-8" style={{ lineHeight: '1.75' }}>
            OmniHub's AI-powered automation transforms how businesses operate by combining intelligent
            decision-making with seamless execution across all your platforms. The system learns from
            every interaction, continuously improving its ability to handle complex workflows with minimal
            human intervention.
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
            title="Ready to automate intelligently?"
            description="Discover how AI-powered automation can transform your operations."
            buttonText="Request a Demo"
            buttonHref="/demo.html"
          />
        </div>
      </Section>
    </Layout>
  );
}
