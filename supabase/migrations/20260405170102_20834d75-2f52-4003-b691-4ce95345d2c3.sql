-- Allow recolectoras to view profiles of users who have published solicitudes
CREATE POLICY "Recolectoras can view generadora profiles for published solicitudes"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'recolectora'::app_role)
  AND EXISTS (
    SELECT 1 FROM solicitudes_recoleccion s
    WHERE s.user_id = profiles.user_id
    AND s.status IN ('publicada', 'con_ofertas')
  )
);

-- Allow recolectoras to see offer counts on published solicitudes
CREATE POLICY "Recolectoras can view ofertas on published solicitudes"
ON public.ofertas_recoleccion
FOR SELECT
USING (
  has_role(auth.uid(), 'recolectora'::app_role)
  AND EXISTS (
    SELECT 1 FROM solicitudes_recoleccion s
    WHERE s.id = ofertas_recoleccion.solicitud_id
    AND s.status IN ('publicada', 'con_ofertas')
  )
);