
ALTER TABLE public.ofertas_recoleccion
ADD COLUMN contrapropuesta_precio numeric DEFAULT NULL,
ADD COLUMN contrapropuesta_fecha date DEFAULT NULL,
ADD COLUMN contrapropuesta_mensaje text DEFAULT NULL;
