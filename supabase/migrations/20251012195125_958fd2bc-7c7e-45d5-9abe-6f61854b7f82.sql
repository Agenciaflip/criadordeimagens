-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for saved models
CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  gender TEXT NOT NULL,
  ethnicity TEXT NOT NULL,
  age_range TEXT NOT NULL,
  body_type TEXT NOT NULL,
  hair_color TEXT NOT NULL,
  hair_style TEXT NOT NULL,
  skin_tone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view models
CREATE POLICY "Anyone can view models" 
ON public.models 
FOR SELECT 
USING (true);

-- Create policy for anyone to create models
CREATE POLICY "Anyone can create models" 
ON public.models 
FOR INSERT 
WITH CHECK (true);

-- Create policy for anyone to update models
CREATE POLICY "Anyone can update models" 
ON public.models 
FOR UPDATE 
USING (true);

-- Create policy for anyone to delete models
CREATE POLICY "Anyone can delete models" 
ON public.models 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_models_updated_at
BEFORE UPDATE ON public.models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();