-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create creations table for storing generated images
CREATE TABLE public.creations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  base_image_url TEXT,
  style_type TEXT DEFAULT 'none',
  style_strength INTEGER DEFAULT 50,
  face_strength INTEGER DEFAULT 50,
  content_strength INTEGER DEFAULT 50,
  is_public BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.creations(id) ON DELETE SET NULL,
  generation_type TEXT DEFAULT 'generate',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on creations
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- Creations policies
CREATE POLICY "Users can view own creations" 
ON public.creations FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own creations" 
ON public.creations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creations" 
ON public.creations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creations" 
ON public.creations FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('creations', 'creations', true);

-- Storage policies for creations bucket
CREATE POLICY "Anyone can view public creations" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'creations');

CREATE POLICY "Users can upload to creations bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'creations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own creations in storage" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'creations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own creations from storage" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'creations' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creations_updated_at
BEFORE UPDATE ON public.creations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();