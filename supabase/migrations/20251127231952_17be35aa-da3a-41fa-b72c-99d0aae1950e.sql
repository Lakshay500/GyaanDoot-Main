-- Create mentor_bookmarks table for favorite mentors
CREATE TABLE IF NOT EXISTS public.mentor_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mentor_id UUID NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mentor_id)
);

-- Enable RLS
ALTER TABLE public.mentor_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.mentor_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
ON public.mentor_bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON public.mentor_bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- Add online status tracking
CREATE TABLE IF NOT EXISTS public.mentor_presence (
  mentor_id UUID PRIMARY KEY REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_presence ENABLE ROW LEVEL SECURITY;

-- Everyone can view mentor presence
CREATE POLICY "Everyone can view mentor presence"
ON public.mentor_presence
FOR SELECT
USING (true);

-- Only the mentor can update their own presence
CREATE POLICY "Mentors can update their own presence"
ON public.mentor_presence
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentor_bookmarks_user_id ON public.mentor_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookmarks_mentor_id ON public.mentor_bookmarks(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_presence_online ON public.mentor_presence(is_online) WHERE is_online = true;