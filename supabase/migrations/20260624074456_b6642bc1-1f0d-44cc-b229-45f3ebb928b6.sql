
CREATE POLICY "Anyone can read movie files" ON storage.objects FOR SELECT USING (bucket_id = 'movies');
CREATE POLICY "Anyone can upload movie files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'movies');
CREATE POLICY "Anyone can delete movie files" ON storage.objects FOR DELETE USING (bucket_id = 'movies');
