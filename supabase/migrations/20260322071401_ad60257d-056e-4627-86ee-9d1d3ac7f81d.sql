-- Add new columns to sevas table
ALTER TABLE public.sevas ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.sevas ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.sevas ADD COLUMN IF NOT EXISTS drive_link text;

-- Create storage bucket for seva images
INSERT INTO storage.buckets (id, name, public) VALUES ('seva-images', 'seva-images', true) ON CONFLICT (id) DO NOTHING;

-- RLS policies for seva-images storage
CREATE POLICY "Anyone can view seva images" ON storage.objects FOR SELECT USING (bucket_id = 'seva-images');
CREATE POLICY "Admins can upload seva images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'seva-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete seva images" ON storage.objects FOR DELETE USING (bucket_id = 'seva-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update seva images" ON storage.objects FOR UPDATE USING (bucket_id = 'seva-images' AND public.has_role(auth.uid(), 'admin'));