
-- Solicitudes de recolección
CREATE TABLE public.solicitudes_recoleccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  direccion_recoleccion TEXT NOT NULL,
  notas_acceso TEXT,
  fecha_preferida DATE NOT NULL,
  rango_horario_inicio TIME NOT NULL,
  rango_horario_fin TIME NOT NULL,
  instrucciones_especiales TEXT,
  status TEXT NOT NULL DEFAULT 'publicada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitudes_recoleccion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own solicitudes" ON public.solicitudes_recoleccion FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all solicitudes" ON public.solicitudes_recoleccion FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Recolectoras can view published solicitudes" ON public.solicitudes_recoleccion FOR SELECT USING (has_role(auth.uid(), 'recolectora'::app_role) AND status IN ('publicada', 'con_ofertas'));
CREATE POLICY "Users can create own solicitudes" ON public.solicitudes_recoleccion FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own solicitudes" ON public.solicitudes_recoleccion FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON public.solicitudes_recoleccion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Residuos por solicitud
CREATE TABLE public.solicitud_residuos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_recoleccion(id) ON DELETE CASCADE,
  residuo_id UUID NOT NULL REFERENCES public.residuos(id),
  cantidad_real NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitud_residuos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own solicitud_residuos" ON public.solicitud_residuos FOR SELECT USING (EXISTS (SELECT 1 FROM public.solicitudes_recoleccion s WHERE s.id = solicitud_id AND s.user_id = auth.uid()));
CREATE POLICY "Admins can view all solicitud_residuos" ON public.solicitud_residuos FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Recolectoras can view published solicitud_residuos" ON public.solicitud_residuos FOR SELECT USING (EXISTS (SELECT 1 FROM public.solicitudes_recoleccion s WHERE s.id = solicitud_id AND s.status IN ('publicada', 'con_ofertas') AND has_role(auth.uid(), 'recolectora'::app_role)));
CREATE POLICY "Users can insert own solicitud_residuos" ON public.solicitud_residuos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.solicitudes_recoleccion s WHERE s.id = solicitud_id AND s.user_id = auth.uid()));

-- Ofertas de recolección
CREATE TABLE public.ofertas_recoleccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_recoleccion(id) ON DELETE CASCADE,
  recolectora_id UUID NOT NULL,
  precio_propuesto NUMERIC NOT NULL,
  fecha_disponible DATE NOT NULL,
  mensaje TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ofertas_recoleccion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solicitud owners can view ofertas" ON public.ofertas_recoleccion FOR SELECT USING (EXISTS (SELECT 1 FROM public.solicitudes_recoleccion s WHERE s.id = solicitud_id AND s.user_id = auth.uid()));
CREATE POLICY "Recolectoras can view own ofertas" ON public.ofertas_recoleccion FOR SELECT USING (auth.uid() = recolectora_id);
CREATE POLICY "Admins can view all ofertas" ON public.ofertas_recoleccion FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Recolectoras can create ofertas" ON public.ofertas_recoleccion FOR INSERT WITH CHECK (auth.uid() = recolectora_id AND has_role(auth.uid(), 'recolectora'::app_role));
CREATE POLICY "Recolectoras can update own ofertas" ON public.ofertas_recoleccion FOR UPDATE USING (auth.uid() = recolectora_id);
CREATE POLICY "Solicitud owners can update ofertas" ON public.ofertas_recoleccion FOR UPDATE USING (EXISTS (SELECT 1 FROM public.solicitudes_recoleccion s WHERE s.id = solicitud_id AND s.user_id = auth.uid()));

CREATE TRIGGER update_ofertas_updated_at BEFORE UPDATE ON public.ofertas_recoleccion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
