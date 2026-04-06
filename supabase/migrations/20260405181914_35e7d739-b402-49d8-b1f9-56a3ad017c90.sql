CREATE POLICY "Users can delete own residuos"
ON public.residuos
FOR DELETE
USING (auth.uid() = user_id);