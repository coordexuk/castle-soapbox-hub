
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_registrations table
CREATE TABLE public.team_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 0,
  age_range TEXT,
  soapbox_name TEXT NOT NULL,
  design_description TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  brakes_steering TEXT NOT NULL,
  file_url TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES team_registrations(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_age INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('team-files', 'team-files', true);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for team_registrations
CREATE POLICY "Users can view their own registrations"
  ON public.team_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations"
  ON public.team_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
  ON public.team_registrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
  ON public.team_registrations FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all registrations"
  ON public.team_registrations FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for team_members
CREATE POLICY "Users can view their own team members"
  ON public.team_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_registrations
    WHERE id = registration_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own team members"
  ON public.team_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_registrations
    WHERE id = registration_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own team members"
  ON public.team_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.team_registrations
    WHERE id = registration_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own team members"
  ON public.team_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.team_registrations
    WHERE id = registration_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all team members"
  ON public.team_members FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Storage policies for team files
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'team-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view all files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-files');

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update participants count
CREATE OR REPLACE FUNCTION public.update_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.team_registrations
    SET participants_count = (
      SELECT COUNT(*) FROM public.team_members
      WHERE registration_id = OLD.registration_id
    )
    WHERE id = OLD.registration_id;
    RETURN OLD;
  ELSE
    UPDATE public.team_registrations
    SET participants_count = (
      SELECT COUNT(*) FROM public.team_members
      WHERE registration_id = NEW.registration_id
    )
    WHERE id = NEW.registration_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_participants_count();
