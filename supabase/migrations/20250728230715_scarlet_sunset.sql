/*
  # Admin User Creation Function

  1. Functions
    - `handle_new_user_with_role` - Enhanced user creation function that handles admin role assignment
  
  2. Security
    - Updates the existing trigger to use the new function
    - Properly handles role assignment from user metadata
*/

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced function to handle user creation with role
CREATE OR REPLACE FUNCTION public.handle_new_user_with_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
BEGIN
  -- Get role from user metadata, default to 'user'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'user'::user_role
  );
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger with the enhanced function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_role();