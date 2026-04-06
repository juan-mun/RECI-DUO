
CREATE TABLE public.residuos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria TEXT NOT NULL,
  nombre TEXT NOT NULL,
  cantidad_estimada NUMERIC NOT NULL,
  unidad TEXT NOT NULL,
  frecuencia TEXT NOT NULL,
  descripcion TEXT,
  condiciones_almacenamiento TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.residuos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own residuos"
ON public.residuos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own residuos"
ON public.residuos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own residuos"
ON public.residuos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all residuos"
ON public.residuos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_residuos_updated_at
BEFORE UPDATE ON public.residuos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
