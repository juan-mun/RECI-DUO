
-- 1. Recolectoras can view solicitudes where they have an accepted/active offer
CREATE POLICY "Recolectoras can view solicitudes with accepted ofertas"
ON public.solicitudes_recoleccion
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ofertas_recoleccion o
    WHERE o.solicitud_id = solicitudes_recoleccion.id
    AND o.recolectora_id = auth.uid()
    AND o.status IN ('aceptada', 'en_camino', 'completada')
  )
);

-- 2. Recolectoras can view solicitud_residuos for solicitudes with accepted ofertas
CREATE POLICY "Recolectoras can view solicitud_residuos with accepted ofertas"
ON public.solicitud_residuos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ofertas_recoleccion o
    WHERE o.solicitud_id = solicitud_residuos.solicitud_id
    AND o.recolectora_id = auth.uid()
    AND o.status IN ('aceptada', 'en_camino', 'completada')
  )
);

-- 3. Recolectoras can view residuos linked to their active solicitudes
CREATE POLICY "Recolectoras can view residuos for accepted solicitudes"
ON public.residuos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solicitud_residuos sr
    JOIN public.ofertas_recoleccion o ON o.solicitud_id = sr.solicitud_id
    WHERE sr.residuo_id = residuos.id
    AND o.recolectora_id = auth.uid()
    AND o.status IN ('aceptada', 'en_camino', 'completada')
  )
);

-- 4. Recolectoras can insert certificados (needed for completion flow)
CREATE POLICY "Recolectoras can insert certificados"
ON public.certificados
FOR INSERT
WITH CHECK (auth.uid() = recolectora_id);

-- 5. Admin DELETE policies for data management
CREATE POLICY "Admins can delete solicitudes"
ON public.solicitudes_recoleccion FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ofertas"
ON public.ofertas_recoleccion FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete solicitud_residuos"
ON public.solicitud_residuos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete certificados"
ON public.certificados FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete residuos"
ON public.residuos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
