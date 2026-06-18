CREATE POLICY "Users can update their own availability blocks"
ON public.availability_blocks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);