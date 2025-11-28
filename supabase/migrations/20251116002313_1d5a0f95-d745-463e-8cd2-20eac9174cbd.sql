-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('chat-files', 'chat-files', false, 10485760, ARRAY['image/*', 'application/pdf', 'text/*']),
  ('course-videos', 'course-videos', false, 524288000, ARRAY['video/*']),
  ('certificates', 'certificates', true, 5242880, ARRAY['application/pdf', 'image/*'])
ON CONFLICT (id) DO NOTHING;

-- Group chat messages
CREATE TABLE IF NOT EXISTS public.group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mentor profiles
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bio TEXT NOT NULL,
  expertise TEXT[] NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  availability_schedule JSONB,
  total_sessions INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session bookings
CREATE TABLE IF NOT EXISTS public.session_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  price NUMERIC NOT NULL,
  notes TEXT,
  video_room_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session ratings
CREATE TABLE IF NOT EXISTS public.session_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.session_bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Course certificates
CREATE TABLE IF NOT EXISTS public.course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_url TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Video content
CREATE TABLE IF NOT EXISTS public.course_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Video progress tracking
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.course_videos(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Course recommendations cache
CREATE TABLE IF NOT EXISTS public.course_recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  recommended_courses JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_recommendations_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_chat_messages
CREATE POLICY "Group members can view messages"
  ON public.group_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = group_chat_messages.group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.group_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.study_group_members
      WHERE group_id = group_chat_messages.group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.group_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for mentor_profiles
CREATE POLICY "Anyone can view mentor profiles"
  ON public.mentor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Mentors can create own profile"
  ON public.mentor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentors can update own profile"
  ON public.mentor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for session_bookings
CREATE POLICY "Users can view own bookings"
  ON public.session_bookings FOR SELECT
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM public.mentor_profiles
      WHERE id = session_bookings.mentor_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create bookings"
  ON public.session_bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update bookings"
  ON public.session_bookings FOR UPDATE
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM public.mentor_profiles
      WHERE id = session_bookings.mentor_id
        AND user_id = auth.uid()
    )
  );

-- RLS Policies for session_ratings
CREATE POLICY "Anyone can view ratings"
  ON public.session_ratings FOR SELECT
  USING (true);

CREATE POLICY "Students can rate completed sessions"
  ON public.session_ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_bookings
      WHERE id = session_ratings.booking_id
        AND student_id = auth.uid()
        AND status = 'completed'
    )
  );

-- RLS Policies for course_certificates
CREATE POLICY "Users can view own certificates"
  ON public.course_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificates"
  ON public.course_certificates FOR SELECT
  USING (true);

-- RLS Policies for course_videos
CREATE POLICY "Anyone can view videos for published courses"
  ON public.course_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_videos.course_id
        AND (is_published = true OR instructor_id = auth.uid())
    )
  );

CREATE POLICY "Instructors can manage course videos"
  ON public.course_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_videos.course_id
        AND instructor_id = auth.uid()
    )
  );

-- RLS Policies for video_progress
CREATE POLICY "Users can view own progress"
  ON public.video_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.video_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress records"
  ON public.video_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for course_recommendations_cache
CREATE POLICY "Users can view own recommendations"
  ON public.course_recommendations_cache FOR SELECT
  USING (auth.uid() = user_id);

-- Storage policies for chat files
CREATE POLICY "Group members can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Group members can view files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files');

-- Storage policies for course videos
CREATE POLICY "Instructors can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can view course videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-videos');

-- Storage policies for certificates
CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

-- Triggers for updated_at
CREATE TRIGGER update_group_chat_messages_updated_at
  BEFORE UPDATE ON public.group_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_session_bookings_updated_at
  BEFORE UPDATE ON public.session_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_course_videos_updated_at
  BEFORE UPDATE ON public.course_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to update mentor ratings
CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mentor_profiles
  SET 
    average_rating = (
      SELECT AVG(sr.rating)
      FROM public.session_ratings sr
      JOIN public.session_bookings sb ON sb.id = sr.booking_id
      WHERE sb.mentor_id = (
        SELECT mentor_id FROM public.session_bookings WHERE id = NEW.booking_id
      )
    ),
    total_sessions = (
      SELECT COUNT(*)
      FROM public.session_bookings
      WHERE mentor_id = (
        SELECT mentor_id FROM public.session_bookings WHERE id = NEW.booking_id
      ) AND status = 'completed'
    )
  WHERE id = (SELECT mentor_id FROM public.session_bookings WHERE id = NEW.booking_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_mentor_rating_trigger
  AFTER INSERT ON public.session_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_rating();