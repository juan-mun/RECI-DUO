
-- 1. Fix: Evidence storage - restrict SELECT to owners, related generadoras, and admins
DROP POLICY IF EXISTS "Authenticated users can view evidence" ON storage.objects;

CREATE POLICY "Evidence owners can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recoleccion-evidencias'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recoleccion-evidencias'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Generadoras can view evidence for own solicitudes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recoleccion-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.ofertas_recoleccion o
    JOIN public.solicitudes_recoleccion s ON s.id = o.solicitud_id
    WHERE o.recolectora_id::text = (storage.foldername(name))[1]
      AND s.user_id = auth.uid()
      AND o.status IN ('aceptada', 'en_camino', 'completada')
  )
);

-- 2. Fix: Certificados INSERT - validate generadora/solicitud relationship
DROP POLICY IF EXISTS "Recolectoras can insert certificados" ON public.certificados;

CREATE POLICY "Recolectoras can insert certificados"
ON public.certificados FOR INSERT
WITH CHECK (
  auth.uid() = recolectora_id
  AND EXISTS (
    SELECT 1 FROM public.solicitudes_recoleccion s
    JOIN public.ofertas_recoleccion o ON o.solicitud_id = s.id
    WHERE s.id = certificados.solicitud_id
      AND s.user_id = certificados.generadora_id
      AND o.recolectora_id = auth.uid()
      AND o.status = 'completada'
  )
);

-- 3. Fix: Solicitud UPDATE by recolectora - restrict to only status field changes with valid transitions
DROP POLICY IF EXISTS "Recolectoras can update solicitudes with accepted ofertas" ON public.solicitudes_recoleccion;

CREATE POLICY "Recolectoras can update solicitudes with accepted ofertas"
ON public.solicitudes_recoleccion FOR UPDATE
USING (recolectora_has_oferta_on_solicitud(auth.uid(), id))
WITH CHECK (
  recolectora_has_oferta_on_solicitud(auth.uid(), id)
  AND status IN ('en_camino', 'completada')
);

-- 4. Fix: Profiles - restrict recolectora read to only generadoras where they have an accepted oferta
DROP POLICY IF EXISTS "Recolectoras can view generadora profiles for related solicitud" ON public.profiles;

CREATE POLICY "Recolectoras can view generadora profiles for related solicitud"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'recolectora'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.solicitudes_recoleccion s
    JOIN public.ofertas_recoleccion o ON o.solicitud_id = s.id
    WHERE s.user_id = profiles.user_id
      AND o.recolectora_id = auth.uid()
      AND o.status IN ('aceptada', 'en_camino', 'completada')
  )
);
