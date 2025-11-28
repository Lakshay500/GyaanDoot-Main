-- Create chat messages table for real-time communication
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read messages
CREATE POLICY "Users can view chat messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to send messages
CREATE POLICY "Users can send chat messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
TO authenticated
USING (true);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view all achievements
CREATE POLICY "Users can view all user achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (true);

-- System can insert achievements
CREATE POLICY "System can award achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create mentor sessions table for bookings
CREATE TABLE public.mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL,
  student_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'available',
  video_room_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on mentor_sessions
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view available sessions
CREATE POLICY "Anyone can view available mentor sessions"
ON public.mentor_sessions
FOR SELECT
TO authenticated
USING (status = 'available' OR mentor_id = auth.uid() OR student_id = auth.uid());

-- Mentors can create sessions
CREATE POLICY "Mentors can create sessions"
ON public.mentor_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = mentor_id);

-- Mentors and students can update their sessions
CREATE POLICY "Participants can update sessions"
ON public.mentor_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = mentor_id OR auth.uid() = student_id);

-- Create course purchases table for Stripe integration
CREATE TABLE public.course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on course_purchases
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
ON public.course_purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insert some sample achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, category) VALUES
('First Course', 'Complete your first course', '🎓', 100, 'learning'),
('Quiz Master', 'Score 100% on any quiz', '🏆', 150, 'performance'),
('Early Bird', 'Log in for 7 consecutive days', '🌅', 200, 'engagement'),
('Helpful Mentor', 'Mentor 5 students', '🤝', 300, 'teaching'),
('Course Creator', 'Publish your first course', '📚', 250, 'teaching'),
('Speed Learner', 'Complete a course in under 2 days', '⚡', 175, 'learning');

-- Create trigger for updating updated_at
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_mentor_sessions_updated_at
BEFORE UPDATE ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();