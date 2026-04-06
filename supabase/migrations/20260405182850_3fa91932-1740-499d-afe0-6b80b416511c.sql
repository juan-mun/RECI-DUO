CREATE POLICY "Recolectoras can update solicitudes with accepted ofertas"
ON public.solicitudes_recoleccion
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ofertas_recoleccion o
    WHERE o.solicitud_id = solicitudes_recoleccion.id
    AND o.recolectora_id = auth.uid()
    AND o.status IN ('aceptada', 'en_camino', 'completada')
  )
);