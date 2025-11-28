-- Create course_reviews table for ratings and reviews
CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT CHECK (char_length(review_text) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Create course_sections table for progress tracking
CREATE TABLE public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 1000),
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create section_completions table to track student progress
CREATE TABLE public.section_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(enrollment_id, section_id)
);

-- Enable RLS on course_reviews
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Enable RLS on course_sections
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

-- Enable RLS on section_completions
ALTER TABLE public.section_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_reviews
-- Anyone can view reviews for published courses
CREATE POLICY "Anyone can view published course reviews"
ON public.course_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_reviews.course_id
    AND courses.is_published = true
  )
);

-- Students can create reviews for courses they're enrolled in
CREATE POLICY "Students can create reviews for enrolled courses"
ON public.course_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.user_id = auth.uid()
    AND enrollments.course_id = course_reviews.course_id
  )
);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.course_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.course_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for course_sections
-- Anyone can view sections for published courses
CREATE POLICY "Anyone can view published course sections"
ON public.course_sections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_sections.course_id
    AND courses.is_published = true
  )
);

-- Instructors can manage sections for their courses
CREATE POLICY "Instructors can manage own course sections"
ON public.course_sections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_sections.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- RLS Policies for section_completions
-- Users can view their own completions
CREATE POLICY "Users can view own section completions"
ON public.section_completions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = section_completions.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Users can mark sections as complete for their enrollments
CREATE POLICY "Users can mark own sections complete"
ON public.section_completions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = section_completions.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX idx_course_reviews_user_id ON public.course_reviews(user_id);
CREATE INDEX idx_course_sections_course_id ON public.course_sections(course_id);
CREATE INDEX idx_section_completions_enrollment_id ON public.section_completions(enrollment_id);
CREATE INDEX idx_section_completions_section_id ON public.section_completions(section_id);

-- Add trigger for updated_at on course_reviews
CREATE TRIGGER update_course_reviews_updated_at
BEFORE UPDATE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add trigger for updated_at on course_sections
CREATE TRIGGER update_course_sections_updated_at
BEFORE UPDATE ON public.course_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Function to calculate course progress based on section completions
CREATE OR REPLACE FUNCTION public.calculate_course_progress(p_enrollment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sections INTEGER;
  completed_sections INTEGER;
  progress INTEGER;
BEGIN
  -- Get total sections for the course
  SELECT COUNT(*)
  INTO total_sections
  FROM course_sections cs
  JOIN enrollments e ON e.course_id = cs.course_id
  WHERE e.id = p_enrollment_id;

  -- Return 0 if no sections exist
  IF total_sections = 0 THEN
    RETURN 0;
  END IF;

  -- Get completed sections
  SELECT COUNT(*)
  INTO completed_sections
  FROM section_completions
  WHERE enrollment_id = p_enrollment_id;

  -- Calculate percentage
  progress := ROUND((completed_sections::NUMERIC / total_sections::NUMERIC) * 100);

  RETURN progress;
END;
$$;