
DROP POLICY "Recolectoras can view generadora profiles for published solicit" ON public.profiles;

CREATE POLICY "Recolectoras can view generadora profiles for related solicitudes"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'recolectora'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.solicitudes_recoleccion s
    WHERE s.user_id = profiles.user_id
    AND s.status = ANY (ARRAY['publicada', 'con_ofertas', 'aceptada', 'en_proceso', 'en_camino', 'completada'])
  )
);
