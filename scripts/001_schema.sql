-- Photo Activation App Schema

-- photos table: stores all captured activation photos
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Admins and promoters (authenticated users) can insert photos
CREATE POLICY "authenticated_insert_photos" ON public.photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone can read photos (needed for public download page)
CREATE POLICY "public_read_photos" ON public.photos
  FOR SELECT
  TO public
  USING (true);

-- Only admins (service role or authenticated) can delete
CREATE POLICY "authenticated_delete_photos" ON public.photos
  FOR DELETE
  TO authenticated
  USING (true);
