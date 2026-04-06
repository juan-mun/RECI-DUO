
CREATE TABLE public.certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_certificado TEXT NOT NULL UNIQUE,
  solicitud_id UUID REFERENCES public.solicitudes_recoleccion(id),
  generadora_id UUID NOT NULL,
  recolectora_id UUID NOT NULL,
  generadora_razon_social TEXT NOT NULL,
  generadora_nit TEXT NOT NULL,
  generadora_ciudad TEXT NOT NULL,
  generadora_representante TEXT NOT NULL,
  recolectora_razon_social TEXT NOT NULL,
  recolectora_nit TEXT NOT NULL,
  recolectora_licencia_ambiental TEXT,
  recolectora_autoridad_ambiental TEXT,
  tipo_residuo TEXT NOT NULL,
  categoria_residuo TEXT NOT NULL,
  cantidad_dispuesta NUMERIC NOT NULL,
  unidad TEXT NOT NULL,
  fecha_recoleccion DATE NOT NULL,
  destino_final TEXT NOT NULL,
  codigo_verificacion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Generadoras can view own certificados" ON public.certificados FOR SELECT USING (auth.uid() = generadora_id);
CREATE POLICY "Recolectoras can view own certificados" ON public.certificados FOR SELECT USING (auth.uid() = recolectora_id);
CREATE POLICY "Admins can view all certificados" ON public.certificados FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert certificados" ON public.certificados FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_certificados_updated_at BEFORE UPDATE ON public.certificados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
