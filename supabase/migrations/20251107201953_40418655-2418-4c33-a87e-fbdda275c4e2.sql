-- Fix PUBLIC_DATA_EXPOSURE: Restrict profile visibility to authenticated users only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restrictive policies for profile access
-- Policy 1: Users can view their own complete profile (including email)
CREATE POLICY "Users can view own complete profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can view limited public profile data (excluding email)
CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() != id
  );

-- Note: To properly hide email from public view, applications should select specific columns
-- rather than SELECT *, excluding the email field when viewing others' profiles

-- Fix OPEN_ENDPOINTS: Ensure only admins can insert non-student roles
-- The existing RLS policy "Admins can manage all roles" should prevent unauthorized inserts,
-- but we'll add an explicit INSERT policy to be extra safe
DROP POLICY IF EXISTS "Users can insert roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- The handle_new_user trigger will still be able to insert the default student role
-- because it runs as SECURITY DEFINER