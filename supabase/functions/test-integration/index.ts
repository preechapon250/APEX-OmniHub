import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from '../_shared/auth.ts';
import { handleCors, corsJsonResponse } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient();

    const { integrationId } = await req.json();

    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (fetchError) throw fetchError;

    let testResult;
    switch (integration.type) {
      case 'slack':
        testResult = await testSlack(integration.config);
        break;
      case 'zapier':
        testResult = await testZapier(integration.config);
        break;
      case 'github':
        testResult = await testGitHub(integration.config);
        break;
      case 'notion':
        testResult = await testNotion(integration.config);
        break;
      case 'google_drive':
        testResult = await testGoogleDrive(integration.config);
        break;
      default:
        testResult = { connected: false, message: 'Integration type not supported' };
    }

    // Update integration status
    await supabase
      .from('integrations')
      .update({
        status: testResult.connected ? 'active' : 'error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);

    return corsJsonResponse(testResult);
  } catch (error) {
    console.error('Integration test error:', error);
    return corsJsonResponse({ connected: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

async function testSlack(config: any) {
  if (!config.apiKey) return { connected: false, message: 'API key missing' };

  const response = await fetch('https://slack.com/api/auth.test', {
    headers: { 'Authorization': `Bearer ${config.apiKey}` },
  });

  const data = await response.json();
  return {
    connected: data.ok,
    message: data.ok ? `Connected to ${data.team}` : data.error,
    details: data.ok ? { team: data.team, user: data.user } : null,
  };
}

async function testZapier(config: any) {
  if (!config.webhookUrl) return { connected: false, message: 'Webhook URL missing' };

  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
  });

  return {
    connected: response.ok,
    message: response.ok ? 'Webhook test successful' : 'Webhook test failed',
  };
}

async function testGitHub(config: any) {
  if (!config.apiKey) return { connected: false, message: 'API token missing' };

  const response = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${config.apiKey}` },
  });

  const data = await response.json();
  return {
    connected: response.ok,
    message: response.ok ? `Connected as ${data.login}` : 'Authentication failed',
    details: response.ok ? { username: data.login, name: data.name } : null,
  };
}

async function testNotion(config: any) {
  if (!config.apiKey) return { connected: false, message: 'API key missing' };

  const response = await fetch('https://api.notion.com/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Notion-Version': '2022-06-28',
    },
  });

  const data = await response.json();
  return {
    connected: response.ok,
    message: response.ok ? 'Connected to Notion' : 'Authentication failed',
    details: response.ok ? { type: data.type } : null,
  };
}

async function testGoogleDrive(config: any) {
  if (!config.apiKey) return { connected: false, message: 'API key missing' };

  const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
    headers: { 'Authorization': `Bearer ${config.apiKey}` },
  });

  const data = await response.json();
  return {
    connected: response.ok,
    message: response.ok ? `Connected as ${data.user?.emailAddress}` : 'Authentication failed',
    details: response.ok ? { email: data.user?.emailAddress } : null,
  };
}
