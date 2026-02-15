import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildCorsHeaders, handlePreflight, corsErrorResponse } from "../_shared/cors.ts";

interface RequestBody {
  intent?: string;
  trigger?: string;
  constraints?: string;
  // Legacy support for OnboardingWizard
  description?: string;
  goal?: string;
}

interface SkillDefinition {
  name: string;
  description: string;
  instructions: string[];
  required_apis: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  try {
    // 1. Authentication Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsErrorResponse('UNAUTHORIZED', 'Missing authorization header', 401, origin);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return corsErrorResponse('UNAUTHORIZED', 'Invalid authentication token', 401, origin);
    }

    // 2. Parse Request Body
    const body = await req.json() as RequestBody;

    // Determine if this is a SkillForge request or OnboardingWizard request
    const isSkillForge = body.intent !== undefined;

    if (isSkillForge) {
      // ============================================================================
      // SKILL FORGE FLOW (New Implementation)
      // ============================================================================
      const { intent, trigger, constraints } = body;

      if (!intent || !trigger || !constraints) {
        return new Response(
          JSON.stringify({ error: 'MISSING_FIELDS', message: 'Intent, trigger, and constraints are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // 3. Entitlement Gate (The Monetization Throttle)
      const { data: entitlement, error: entitlementError } = await supabaseClient.rpc(
        'check_skill_entitlement',
        { user_uuid: user.id }
      );

      if (entitlementError) {
        console.error('Entitlement check failed:', entitlementError);
        return new Response(
          JSON.stringify({ error: 'ENTITLEMENT_CHECK_FAILED', message: 'Could not verify skill limits' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Enforce 3-skill limit (The Pilot Trap)
      if (!entitlement.allowed) {
        return new Response(
          JSON.stringify({
            error: 'LIMIT_REACHED',
            message: 'SYSTEM OVERLOAD — Upgrade to Architect Tier to forge more skills.',
            context: {
              current: entitlement.current,
              max: entitlement.max,
              tier: entitlement.tier,
            },
          }),
          {
            status: 402, // Payment Required
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // 4. Generate Skill (Mocked for deterministic testing)
      const skillName = `skill_${crypto.randomUUID()}`;

      const mockedSkill: SkillDefinition = {
        name: skillName,
        description: intent,
        instructions: [
          `Trigger when: ${trigger}`,
          `Apply constraints: ${constraints}`,
          'Execute business automation workflow',
          'Return structured result to OmniHub orchestrator',
        ],
        required_apis: ['omnihub_core', 'user_context_api'],
      };

      // 5. Persist to Database
      const { error: insertError } = await supabaseClient
        .from('user_generated_skills')
        .insert({
          user_id: user.id,
          name: skillName,
          trigger_intent: trigger,
          definition: mockedSkill,
        });

      if (insertError) {
        console.error('Failed to insert skill:', insertError);
        return new Response(
          JSON.stringify({ error: 'DATABASE_ERROR', message: 'Failed to save skill' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // 6. Success Response
      return new Response(
        JSON.stringify({
          success: true,
          skill: mockedSkill,
          entitlement: {
            used: entitlement.current + 1,
            max: entitlement.max,
            tier: entitlement.tier,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } else {
      // ============================================================================
      // ONBOARDING WIZARD FLOW (Legacy Support)
      // ============================================================================
      const { description, goal } = body;

      if (!description || !goal) {
        return new Response(
          JSON.stringify({ error: 'Missing description or goal' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Mock skill generation (simplified for OnboardingWizard)
      const isTech = description.toLowerCase().includes('tech') || description.toLowerCase().includes('software');

      const skills = [
        {
          id: crypto.randomUUID(),
          name: 'Operational_backbone_v1',
          description: 'Automated scheduling and customer communication dispatch.',
          projected_monthly_revenue: '$0 (Efficiency Gain)',
          confidence_score: 95,
          tier: 'CORE',
        },
        {
          id: crypto.randomUUID(),
          name: isTech ? 'Enterprise_Lead_Scraper' : 'Local_Service_Arbitrage',
          description: isTech
            ? 'Identifies high-value tech executives in target region.'
            : 'Aggregates local demand for immediate dispatch.',
          projected_monthly_revenue: '$4,500+',
          confidence_score: 88,
          tier: 'GROWTH_ENGINE',
        },
        {
          id: crypto.randomUUID(),
          name: 'Dynamic_Pricing_Engine',
          description: 'Adjusts service rates based on real-time demand and competitor analysis.',
          projected_monthly_revenue: '$1,200+',
          confidence_score: 82,
          tier: 'GROWTH_ENGINE',
        },
      ];

      return new Response(
        JSON.stringify({ skills }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
