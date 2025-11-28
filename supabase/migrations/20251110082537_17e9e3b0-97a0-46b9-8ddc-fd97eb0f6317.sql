-- Add database length constraints to match client-side validation
ALTER TABLE public.courses 
  ADD CONSTRAINT courses_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT courses_description_length CHECK (char_length(description) <= 5000),
  ADD CONSTRAINT courses_category_length CHECK (char_length(category) <= 50);

ALTER TABLE public.questions
  ADD CONSTRAINT questions_text_length CHECK (char_length(question_text) <= 1000),
  ADD CONSTRAINT questions_answer_length CHECK (char_length(correct_answer) <= 500),
  ADD CONSTRAINT questions_explanation_length CHECK (char_length(explanation) <= 2000);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_name_length CHECK (char_length(full_name) <= 200),
  ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 2000),
  ADD CONSTRAINT profiles_education_length CHECK (char_length(education) <= 1000);

-- Create secure server-side quiz scoring function
CREATE OR REPLACE FUNCTION public.submit_quiz_answers(
  p_enrollment_id UUID,
  p_answers JSONB
) RETURNS TABLE(
  quiz_result_id UUID,
  score INTEGER,
  total_questions INTEGER,
  percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
  v_user_id UUID;
  v_score INTEGER := 0;
  v_total INTEGER := 0;
  v_percentage NUMERIC;
  v_result_id UUID;
  question_record RECORD;
  user_answer TEXT;
BEGIN
  -- Verify enrollment belongs to authenticated user
  SELECT e.user_id, e.course_id INTO v_user_id, v_course_id
  FROM enrollments e
  WHERE e.id = p_enrollment_id AND e.user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid enrollment or access denied';
  END IF;

  -- Calculate score by comparing submitted answers to correct answers
  FOR question_record IN 
    SELECT id, correct_answer, question_type
    FROM questions
    WHERE course_id = v_course_id
    ORDER BY created_at
  LOOP
    v_total := v_total + 1;
    user_answer := p_answers->question_record.id::text->>'answer';
    
    -- Compare based on question type
    IF question_record.question_type = 'short_answer' THEN
      -- Case-insensitive comparison for short answers
      IF LOWER(TRIM(user_answer)) = LOWER(TRIM(question_record.correct_answer)) THEN
        v_score := v_score + 1;
      END IF;
    ELSE
      -- Exact match for multiple choice and true/false
      IF user_answer = question_record.correct_answer THEN
        v_score := v_score + 1;
      END IF;
    END IF;
  END LOOP;

  -- Calculate percentage
  v_percentage := CASE 
    WHEN v_total > 0 THEN ROUND((v_score::NUMERIC / v_total::NUMERIC) * 100, 2)
    ELSE 0 
  END;

  -- Insert quiz result
  INSERT INTO quiz_results (enrollment_id, score, total_questions, percentage, answers)
  VALUES (p_enrollment_id, v_score, v_total, v_percentage, p_answers)
  RETURNING id INTO v_result_id;

  -- Update enrollment progress to 100% and mark as completed
  UPDATE enrollments
  SET progress = 100, completed = true
  WHERE id = p_enrollment_id;

  -- Return results
  RETURN QUERY SELECT v_result_id, v_score, v_total, v_percentage;
END;
$$;