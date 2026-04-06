
-- Create storage bucket for recoleccion evidence (photos, PDFs)
INSERT INTO storage.buckets (id, name, public) VALUES ('recoleccion-evidencias', 'recoleccion-evidencias', false);

-- Recolectoras can upload evidence files to their own folder
CREATE POLICY "Recolectoras can upload evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recoleccion-evidencias'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can view evidence files
CREATE POLICY "Authenticated users can view evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recoleccion-evidencias'
  AND auth.role() = 'authenticated'
);
