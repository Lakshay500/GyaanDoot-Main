-- Add social features: user follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Add study groups
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  max_members INTEGER DEFAULT 10
);

-- Add study group members
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Add shared notes
CREATE TABLE IF NOT EXISTS public.shared_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add group challenges
CREATE TABLE IF NOT EXISTS public.group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  total_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies for study_groups
CREATE POLICY "Anyone can view study groups"
  ON public.study_groups FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
  ON public.study_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = study_groups.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- RLS Policies for study_group_members
CREATE POLICY "Anyone can view group members"
  ON public.study_group_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join groups"
  ON public.study_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.study_group_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for shared_notes
CREATE POLICY "Group members can view notes"
  ON public.shared_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = shared_notes.group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create notes"
  ON public.shared_notes FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = shared_notes.group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Note creators can update their notes"
  ON public.shared_notes FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Note creators can delete their notes"
  ON public.shared_notes FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for group_challenges
CREATE POLICY "Group members can view challenges"
  ON public.group_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = group_challenges.group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can manage challenges"
  ON public.group_challenges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = group_challenges.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Trigger for updating study groups updated_at
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updating shared notes updated_at
CREATE TRIGGER update_shared_notes_updated_at
  BEFORE UPDATE ON public.shared_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();