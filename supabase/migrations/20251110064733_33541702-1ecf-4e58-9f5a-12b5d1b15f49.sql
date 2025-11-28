-- Create enrollments table to track student course enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed BOOLEAN DEFAULT false NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Create quiz_results table to track quiz attempts
CREATE TABLE public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  percentage NUMERIC GENERATED ALWAYS AS ((score / total_questions) * 100) STORED,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on quiz_results
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enrollments
-- Students can view their own enrollments
CREATE POLICY "Users can view own enrollments"
ON public.enrollments
FOR SELECT
USING (auth.uid() = user_id);

-- Students can insert their own enrollments
CREATE POLICY "Users can enroll in courses"
ON public.enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Students can update their own enrollments (progress, last_accessed)
CREATE POLICY "Users can update own enrollments"
ON public.enrollments
FOR UPDATE
USING (auth.uid() = user_id);

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view course enrollments"
ON public.enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = enrollments.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- RLS Policies for quiz_results
-- Students can view their own quiz results
CREATE POLICY "Users can view own quiz results"
ON public.quiz_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = quiz_results.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Students can insert their own quiz results
CREATE POLICY "Users can insert own quiz results"
ON public.quiz_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = quiz_results.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Instructors can view quiz results for their courses
CREATE POLICY "Instructors can view course quiz results"
ON public.quiz_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    JOIN public.courses ON courses.id = enrollments.course_id
    WHERE enrollments.id = quiz_results.enrollment_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_quiz_results_enrollment_id ON public.quiz_results(enrollment_id);

-- Add trigger for updated_at on enrollments
CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();