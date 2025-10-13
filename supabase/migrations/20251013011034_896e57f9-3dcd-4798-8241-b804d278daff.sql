-- Create profiles table with auto-population trigger
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to models table
ALTER TABLE public.models ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update models RLS policies to be user-specific
DROP POLICY IF EXISTS "Anyone can view models" ON public.models;
DROP POLICY IF EXISTS "Anyone can create models" ON public.models;
DROP POLICY IF EXISTS "Anyone can update models" ON public.models;
DROP POLICY IF EXISTS "Anyone can delete models" ON public.models;

CREATE POLICY "Users can view their own models"
  ON public.models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own models"
  ON public.models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models"
  ON public.models FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models"
  ON public.models FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create clothing_items table
CREATE TABLE public.clothing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  style TEXT,
  pattern TEXT,
  fabric TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;

-- Clothing items policies
CREATE POLICY "Users can view their own clothing items"
  ON public.clothing_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clothing items"
  ON public.clothing_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clothing items"
  ON public.clothing_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clothing items"
  ON public.clothing_items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for clothing_items updated_at
CREATE TRIGGER update_clothing_items_updated_at
  BEFORE UPDATE ON public.clothing_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create creations table
CREATE TABLE public.creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
  clothing_id UUID REFERENCES public.clothing_items(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  pose TEXT,
  scenario TEXT,
  lighting TEXT,
  style TEXT,
  title TEXT,
  description TEXT,
  is_variation BOOLEAN DEFAULT false,
  parent_creation_id UUID REFERENCES public.creations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- Creations policies
CREATE POLICY "Users can view their own creations"
  ON public.creations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creations"
  ON public.creations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creations"
  ON public.creations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creations"
  ON public.creations FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for creations updated_at
CREATE TRIGGER update_creations_updated_at
  BEFORE UPDATE ON public.creations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();