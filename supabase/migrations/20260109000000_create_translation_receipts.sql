-- Atomic Idempotency: Translation Receipts Table
-- Migration: 20260109000000_create_translation_receipts
-- Purpose: Enable atomic lock pattern for semantic translation processing

-- Create translation_receipts table
CREATE TABLE IF NOT EXISTS public.translation_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  result JSONB,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for atomic idempotency
  UNIQUE (tenant_id, idempotency_key, source)
);

-- Performance index for active translations (PENDING/PROCESSING)
CREATE INDEX IF NOT EXISTS idx_translation_active
ON public.translation_receipts (tenant_id, idempotency_key, source)
WHERE status IN ('PENDING', 'PROCESSING');

-- Index for cleanup of old completed translations
CREATE INDEX IF NOT EXISTS idx_translation_cleanup
ON public.translation_receipts (created_at)
WHERE status = 'COMPLETED' AND created_at < NOW() - INTERVAL '30 days';

-- Enable Row Level Security
ALTER TABLE public.translation_receipts ENABLE ROW LEVEL SECURITY;

-- Service role only policy (security hardening)
CREATE POLICY "Service role access only" ON public.translation_receipts
FOR ALL USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_receipt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_translation_receipt_updated_at
  BEFORE UPDATE ON public.translation_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_receipt_updated_at();

-- Function for atomic lock pattern
CREATE OR REPLACE FUNCTION atomic_translation_lock(
  p_tenant_id UUID,
  p_idempotency_key TEXT,
  p_source TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id UUID;
  v_existing_status TEXT;
BEGIN
  -- Attempt atomic insert with conflict resolution
  INSERT INTO public.translation_receipts (
    tenant_id,
    idempotency_key,
    source,
    status,
    metadata
  ) VALUES (
    p_tenant_id,
    p_idempotency_key,
    p_source,
    'PENDING',
    p_metadata
  )
  ON CONFLICT (tenant_id, idempotency_key, source) DO NOTHING
  RETURNING id, status, true INTO v_existing_id, v_existing_status, created;

  -- If insert succeeded, return new record
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_id, v_existing_status, true;
    RETURN;
  END IF;

  -- If conflict occurred, return existing record
  SELECT tr.id, tr.status, false
  INTO v_existing_id, v_existing_status, created
  FROM public.translation_receipts tr
  WHERE tr.tenant_id = p_tenant_id
    AND tr.idempotency_key = p_idempotency_key
    AND tr.source = p_source;

  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_id, v_existing_status, false;
  END IF;
END;
$$;