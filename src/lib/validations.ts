import { z } from "zod";

// Course validation schema
export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .regex(
      /^[a-zA-Z0-9\s\-:.,!?'"()]+$/,
      "Title contains invalid characters"
    ),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-&]+$/,
      "Category can only contain letters, numbers, spaces, hyphens and ampersands"
    ),
  level: z.enum(["beginner", "intermediate", "advanced"], {
    errorMap: () => ({ message: "Please select a valid level" }),
  }),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(10000, "Price cannot exceed $10,000")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  duration_hours: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 hour")
    .max(1000, "Duration cannot exceed 1000 hours"),
});

export type CourseFormData = z.infer<typeof courseSchema>;

// Question validation schema
export const questionSchema = z.object({
  question_text: z
    .string()
    .trim()
    .min(5, "Question must be at least 5 characters")
    .max(1000, "Question must be less than 1000 characters"),
  question_type: z.enum(["multiple_choice", "true_false", "short_answer"], {
    errorMap: () => ({ message: "Please select a valid question type" }),
  }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({ message: "Please select a valid difficulty" }),
  }),
  options: z.record(z.string()).optional(),
  correct_answer: z
    .string()
    .trim()
    .min(1, "Correct answer is required")
    .max(500, "Answer must be less than 500 characters"),
  explanation: z
    .string()
    .trim()
    .max(2000, "Explanation must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

// Quiz answer validation schema
export const quizAnswerSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, "Answer is required")
    .max(1000, "Answer must be less than 1000 characters"),
});

export type QuizAnswerData = z.infer<typeof quizAnswerSchema>;

// Validate multiple choice question has all options filled
export const validateMultipleChoiceOptions = (
  options: Record<string, string>
): boolean => {
  return Object.values(options).every((option) => option.trim().length > 0);
};

// Validate correct answer matches question type
export const validateCorrectAnswer = (
  questionType: string,
  correctAnswer: string,
  options?: Record<string, string>
): boolean => {
  if (questionType === "multiple_choice") {
    return options ? Object.keys(options).includes(correctAnswer) : false;
  }
  if (questionType === "true_false") {
    return correctAnswer === "true" || correctAnswer === "false";
  }
  return correctAnswer.trim().length > 0;
};

// Review validation schema
export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  review_text: z
    .string()
    .trim()
    .max(2000, "Review must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// Section validation schema
export const sectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Section title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  content: z
    .string()
    .trim()
    .max(50000, "Content must be less than 50,000 characters")
    .optional()
    .or(z.literal("")),
});

export type SectionFormData = z.infer<typeof sectionSchema>;
