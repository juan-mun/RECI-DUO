CREATE POLICY "Recolectoras can delete own ofertas"
ON public.ofertas_recoleccion
FOR DELETE
USING (auth.uid() = recolectora_id);