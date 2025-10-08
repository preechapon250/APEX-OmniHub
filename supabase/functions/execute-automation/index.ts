import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { automationId } = await req.json();

    // Fetch automation
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (fetchError) throw fetchError;
    if (!automation.is_active) {
      return new Response(JSON.stringify({ error: 'Automation is not active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Execute based on action_type
    let result;
    switch (automation.action_type) {
      case 'send_email':
        result = await executeEmailAction(automation.config, supabase);
        break;
      case 'create_record':
        result = await executeCreateRecord(automation.config, supabase);
        break;
      case 'webhook':
        result = await executeWebhook(automation.config);
        break;
      case 'notification':
        result = await executeNotification(automation.config);
        break;
      default:
        throw new Error(`Unknown action type: ${automation.action_type}`);
    }

    // Update automation execution timestamp
    await supabase
      .from('automations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', automationId);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Automation execution error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeEmailAction(config: any, supabase: any) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) throw new Error('RESEND_API_KEY not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from || 'noreply@omnilink.app',
      to: config.to,
      subject: config.subject,
      html: config.body,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }

  return await response.json();
}

async function executeCreateRecord(config: any, supabase: any) {
  const { table, data } = config;
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();

  if (error) throw error;
  return result;
}

async function executeWebhook(config: any) {
  const response = await fetch(config.url, {
    method: config.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: JSON.stringify(config.data),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return await response.json();
}

async function executeNotification(config: any) {
  // For now, just return success - can be extended to push notifications
  return {
    message: config.message,
    sent: true,
  };
}
