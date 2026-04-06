
-- Add expiry and metadata columns to registration_documents
ALTER TABLE public.registration_documents
ADD COLUMN IF NOT EXISTS fecha_vencimiento date,
ADD COLUMN IF NOT EXISTS numero_resolucion text,
ADD COLUMN IF NOT EXISTS autoridad_emisora text,
ADD COLUMN IF NOT EXISTS categorias_autorizadas text[];

-- Allow users to update their own documents (for re-uploading)
CREATE POLICY "Users can update own documents"
ON public.registration_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM registration_requests r
    WHERE r.id = registration_documents.request_id AND r.user_id = auth.uid()
  )
);
