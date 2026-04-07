CREATE POLICY "Recolectoras can view residuos for published solicitudes"
ON public.residuos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'recolectora'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.solicitud_residuos sr
    JOIN public.solicitudes_recoleccion s ON s.id = sr.solicitud_id
    WHERE sr.residuo_id = residuos.id
    AND s.status IN ('publicada', 'con_ofertas')
  )
);