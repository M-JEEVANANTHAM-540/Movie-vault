
CREATE TABLE public.movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  year INT,
  poster_path TEXT,
  video_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.movies TO anon, authenticated;
GRANT ALL ON public.movies TO service_role;

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Anyone can add movies" ON public.movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove movies" ON public.movies FOR DELETE USING (true);
