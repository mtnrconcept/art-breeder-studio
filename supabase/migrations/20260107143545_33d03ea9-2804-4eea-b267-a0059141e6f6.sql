-- Create video_creations table
CREATE TABLE public.video_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tool_type TEXT NOT NULL,
  prompt TEXT,
  settings JSONB,
  duration_seconds INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_creations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own videos" 
ON public.video_creations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos" 
ON public.video_creations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" 
ON public.video_creations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" 
ON public.video_creations FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Public videos are viewable by everyone" 
ON public.video_creations FOR SELECT 
USING (is_public = true);

-- Create trigger for updated_at
CREATE TRIGGER update_video_creations_updated_at
BEFORE UPDATE ON public.video_creations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Storage policies for videos
CREATE POLICY "Video files are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Users can upload their own videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own videos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);