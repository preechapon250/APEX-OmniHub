import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    // 1. FAST VALIDATION (Edge Layer)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Auth');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error } = await supabase.auth.getUser(authHeader);

    if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });

    const { query, traceId } = await req.json();

    // 2. THE HANDOFF (Connect to Python Orchestrator)
    console.log(`[Router] Dispatching ${traceId} to Orchestrator...`);

    const orchestratorUrl = Deno.env.get('ORCHESTRATOR_URL');
    if (!orchestratorUrl) throw new Error('System Misconfiguration: ORCHESTRATOR_URL missing');

    const response = await fetch(`${orchestratorUrl}/api/v1/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        user_intent: query,
        trace_id: traceId
      })
    });

    if (!response.ok) {
      throw new Error(`Orchestrator rejected request: ${await response.text()}`);
    }

    // 3. INSTANT ACKNOWLEDGEMENT
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
});
