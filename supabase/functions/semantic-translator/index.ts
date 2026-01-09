/**
 * Semantic Translator Edge Function
 * Universal adapter for canonical event translation with atomic idempotency
 *
 * Endpoint: POST /semantic-translator
 *
 * Request Body:
 *   {
 *     "tenantId": "uuid",
 *     "idempotencyKey": "string",
 *     "source": "string",
 *     "eventData": {...},
 *     "locale": "en|es|de|ja|fr|pt|it" // optional
 *   }
 *
 * Response:
 *   {
 *     "success": true,
 *     "event": {...}, // CanonicalEvent
 *     "cached": false,
 *     "processingTime": 45
 *   }
 *
 * Author: OmniLink APEX
 * Date: 2026-01-09
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Language name mappings for system prompts
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  ja: 'Japanese',
  fr: 'French',
  pt: 'Portuguese',
  it: 'Italian',
};

/**
 * Map provider names to standardized providers
 */
const PROVIDER_MAPPING: Record<string, string> = {
  meta_business: 'meta_business',
  linkedin: 'linkedin',
  twitter: 'twitter',
  facebook: 'meta_business',
  instagram: 'meta_business',
  // Add more mappings as needed
};

/**
 * Map event types to standardized EventType enum
 */
const EVENT_TYPE_MAPPING: Record<string, string> = {
  post_viewed: 'social_post_viewed',
  post_saved: 'social_post_saved',
  post_shared: 'social_post_shared',
  comment: 'comment',
  message: 'message',
  reaction: 'reaction',
  ad_insight: 'ad_insight',
  page_insight: 'page_insight',
  campaign_performance: 'campaign_performance',
  audience_insight: 'audience_insight',
  profile_view: 'profile_view',
  connection_request: 'connection_request',
  follow: 'follow',
  unfollow: 'unfollow',
  content_published: 'content_published',
  content_updated: 'content_updated',
  content_deleted: 'content_deleted',
};

/**
 * Transform provider-specific event data to CanonicalEvent
 */
function transformToCanonicalEvent(
  tenantId: string,
  source: string,
  eventData: any,
  locale: string = 'en'
): any {
  const provider = PROVIDER_MAPPING[source] || source;
  const eventType = EVENT_TYPE_MAPPING[eventData.type || eventData.event_type] || 'content_published';

  // Generate IDs
  const eventId = uuidv4();
  const correlationId = uuidv4();

  // Extract user ID (try multiple common fields)
  const userId = eventData.user_id || eventData.userId || eventData.actor_id || 'unknown';

  // Extract external ID
  const externalId = eventData.id || eventData.event_id || eventData.external_id || eventId;

  // Build timestamp
  const timestamp = eventData.timestamp || eventData.created_at || eventData.time || new Date().toISOString();

  // Build consent flags (default to empty)
  const consentFlags = eventData.consent_flags || {};

  // Build metadata
  const metadata = {
    provider_specific_data: eventData,
    transformation_timestamp: new Date().toISOString(),
    transformer_version: '1.0.0',
  };

  // Build payload (standardized event data)
  const payload = {
    ...eventData,
    // Remove provider-specific fields that are now in metadata
    consent_flags: undefined,
    user_id: undefined,
    userId: undefined,
    actor_id: undefined,
    event_id: undefined,
    external_id: undefined,
    created_at: undefined,
    time: undefined,
  };

  return {
    eventId,
    correlationId,
    tenantId,
    userId,
    source,
    provider,
    externalId,
    eventType,
    timestamp,
    locale,
    consentFlags,
    metadata,
    payload,
  };
}

/**
 * Main request handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'method_not_allowed', message: 'Only POST requests are allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { tenantId, idempotencyKey, source, eventData, locale, metadata } = body;

    // Validate required fields
    if (!tenantId || !idempotencyKey || !source || !eventData) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          message: 'tenantId, idempotencyKey, source, and eventData are required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tenant access (user must belong to tenant)
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (tenantError || !tenantUser) {
      return new Response(
        JSON.stringify({ error: 'forbidden', message: 'Access denied to this tenant' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atomic lock pattern: Try to create translation receipt
    const { data: lockResult, error: lockError } = await supabase
      .rpc('atomic_translation_lock', {
        p_tenant_id: tenantId,
        p_idempotency_key: idempotencyKey,
        p_source: source,
        p_metadata: metadata || {}
      });

    if (lockError) {
      console.error('Atomic lock error:', lockError);
      return new Response(
        JSON.stringify({ error: 'lock_error', message: 'Failed to acquire translation lock' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lockData = lockResult[0];
    if (!lockData) {
      return new Response(
        JSON.stringify({ error: 'lock_failed', message: 'Unable to acquire translation lock' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { id: receiptId, status: lockStatus, created } = lockData;

    // If this is a cached result (existing translation), return it
    if (!created && lockStatus === 'COMPLETED') {
      const { data: cachedResult, error: cacheError } = await supabase
        .from('translation_receipts')
        .select('result')
        .eq('id', receiptId)
        .maybeSingle();

      if (!cacheError && cachedResult?.result) {
        const processingTime = Date.now() - startTime;
        return new Response(
          JSON.stringify({
            success: true,
            event: cachedResult.result,
            cached: true,
            processingTime,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // If still processing, wait a bit and check again (simple polling)
    if (!created && lockStatus === 'PROCESSING') {
      // In a real implementation, you might want to use WebSockets or server-sent events
      // For now, return a processing status
      const processingTime = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: false,
          error: 'processing',
          message: 'Translation is currently being processed',
          receiptId,
          processingTime,
        }),
        {
          status: 202, // Accepted
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Update status to PROCESSING
    await supabase
      .from('translation_receipts')
      .update({ status: 'PROCESSING' })
      .eq('id', receiptId);

    // Perform the translation
    const canonicalEvent = transformToCanonicalEvent(tenantId, source, eventData, locale);

    // Validate the result (basic validation)
    if (!canonicalEvent.eventId || !canonicalEvent.eventType) {
      await supabase
        .from('translation_receipts')
        .update({
          status: 'FAILED',
          error_message: 'Invalid canonical event structure'
        })
        .eq('id', receiptId);

      return new Response(
        JSON.stringify({ error: 'transformation_failed', message: 'Event transformation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the result and update status to COMPLETED
    const { error: updateError } = await supabase
      .from('translation_receipts')
      .update({
        status: 'COMPLETED',
        result: canonicalEvent,
      })
      .eq('id', receiptId);

    if (updateError) {
      console.error('Failed to update translation receipt:', updateError);
      // Don't fail the request, but log the error
    }

    const processingTime = Date.now() - startTime;

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        event: canonicalEvent,
        cached: false,
        processingTime,
        receiptId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error in semantic-translator function:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: 'An unexpected error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});