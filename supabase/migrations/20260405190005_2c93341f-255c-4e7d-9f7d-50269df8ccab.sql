
-- 1. Create a SECURITY DEFINER function to break the recursion
CREATE OR REPLACE FUNCTION public.recolectora_has_oferta_on_solicitud(_recolectora_id uuid, _solicitud_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ofertas_recoleccion
    WHERE recolectora_id = _recolectora_id
    AND solicitud_id = _solicitud_id
    AND status IN ('aceptada', 'en_camino', 'completada')
  )
$$;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Recolectoras can view solicitudes with accepted ofertas" ON public.solicitudes_recoleccion;
DROP POLICY IF EXISTS "Recolectoras can update solicitudes with accepted ofertas" ON public.solicitudes_recoleccion;
DROP POLICY IF EXISTS "Recolectoras can view solicitud_residuos with accepted ofertas" ON public.solicitud_residuos;
DROP POLICY IF EXISTS "Recolectoras can view residuos for accepted solicitudes" ON public.residuos;

-- 3. Recreate policies using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Recolectoras can view solicitudes with accepted ofertas"
ON public.solicitudes_recoleccion FOR SELECT
USING (
  public.recolectora_has_oferta_on_solicitud(auth.uid(), id)
);

CREATE POLICY "Recolectoras can update solicitudes with accepted ofertas"
ON public.solicitudes_recoleccion FOR UPDATE
USING (
  public.recolectora_has_oferta_on_solicitud(auth.uid(), id)
);

CREATE POLICY "Recolectoras can view solicitud_residuos with accepted ofertas"
ON public.solicitud_residuos FOR SELECT
USING (
  public.recolectora_has_oferta_on_solicitud(auth.uid(), solicitud_id)
);

-- 4. For residuos, use a SECURITY DEFINER function too
CREATE OR REPLACE FUNCTION public.recolectora_can_view_residuo(_recolectora_id uuid, _residuo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.solicitud_residuos sr
    JOIN public.ofertas_recoleccion o ON o.solicitud_id = sr.solicitud_id
    WHERE sr.residuo_id = _residuo_id
    AND o.recolectora_id = _recolectora_id
    AND o.status IN ('aceptada', 'en_camino', 'completada')
  )
$$;

CREATE POLICY "Recolectoras can view residuos for accepted solicitudes"
ON public.residuos FOR SELECT
USING (
  public.recolectora_can_view_residuo(auth.uid(), id)
);
