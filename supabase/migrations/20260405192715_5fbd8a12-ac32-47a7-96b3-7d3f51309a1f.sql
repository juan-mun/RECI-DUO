ALTER TABLE public.registration_documents
  ADD COLUMN IF NOT EXISTS ai_confidence integer,
  ADD COLUMN IF NOT EXISTS ai_anomalies text[],
  ADD COLUMN IF NOT EXISTS ai_fields jsonb,
  ADD COLUMN IF NOT EXISTS ai_validated_at timestamptz;