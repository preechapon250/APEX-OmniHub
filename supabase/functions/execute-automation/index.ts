import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from '../_shared/auth.ts';
import { handleCors, corsJsonResponse } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();

    const body = await req.json();
    const { automationId } = body;

    // Validate automationId
    if (!automationId || typeof automationId !== 'string' || automationId.trim().length === 0) {
      return corsJsonResponse({ error: 'Invalid automationId' }, 400);
    }

    // Fetch automation
    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (fetchError) throw fetchError;
    if (!automation.is_active) {
      return corsJsonResponse({ error: 'Automation is not active' }, 400);
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

    return corsJsonResponse({ success: true, result });
  } catch (error) {
    console.error('Automation execution error:', error);
    return corsJsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
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
  if (!config.url || typeof config.url !== 'string') {
    throw new Error('Webhook URL is required');
  }

  // Validate URL
  try {
    new URL(config.url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30 second timeout

  try {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(config.data),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Webhook request timed out after 30 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function executeNotification(config: any) {
  // For now, just return success - can be extended to push notifications
  return {
    message: config.message,
    sent: true,
  };
}
