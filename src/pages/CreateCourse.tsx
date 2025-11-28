import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  courseSchema, 
  questionSchema, 
  validateMultipleChoiceOptions, 
  validateCorrectAnswer 
} from "@/lib/validations";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuestionForm {
  id: string;
  question_text: string;
  question_type: string;
  options: Record<string, string>;
  correct_answer: string;
  difficulty: string;
  explanation: string;
}

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    price: "0",
    duration_hours: "1",
  });

  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question_text: "",
        question_type: "multiple_choice",
        options: { A: "", B: "", C: "", D: "" },
        correct_answer: "",
        difficulty: "easy",
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const updateQuestionOption = (id: string, optionKey: string, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === id
          ? { ...q, options: { ...q.options, [optionKey]: value } }
          : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a course.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Validate course data using zod schema
    const courseValidation = courseSchema.safeParse({
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      level: courseData.level,
      price: parseFloat(courseData.price),
      duration_hours: parseInt(courseData.duration_hours),
    });

    if (!courseValidation.success) {
      const firstError = courseValidation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    // Validate questions if any exist
    if (questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        // Skip empty questions
        if (!q.question_text.trim()) continue;

        // Validate question structure
        const questionValidation = questionSchema.safeParse({
          question_text: q.question_text,
          question_type: q.question_type,
          difficulty: q.difficulty,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          options: q.options,
        });

        if (!questionValidation.success) {
          const firstError = questionValidation.error.errors[0];
          toast({
            title: `Question ${i + 1} Validation Error`,
            description: firstError.message,
            variant: "destructive",
          });
          return;
        }

        // Validate multiple choice options
        if (q.question_type === "multiple_choice") {
          if (!validateMultipleChoiceOptions(q.options)) {
            toast({
              title: `Question ${i + 1} Error`,
              description: "All multiple choice options must be filled in.",
              variant: "destructive",
            });
            return;
          }
        }

        // Validate correct answer matches question type
        if (!validateCorrectAnswer(q.question_type, q.correct_answer, q.options)) {
          toast({
            title: `Question ${i + 1} Error`,
            description: "The correct answer doesn't match the question type or available options.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setLoading(true);

    try {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert([
          {
            ...courseData,
            price: parseFloat(courseData.price),
            duration_hours: parseInt(courseData.duration_hours),
            instructor_id: user.id,
            is_published: false,
          },
        ])
        .select()
        .single();

      if (courseError) throw courseError;

      if (questions.length > 0) {
        const questionsToInsert = questions
          .filter((q) => q.question_text.trim() !== "")
          .map((q) => ({
            course_id: course.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.question_type === "multiple_choice" ? q.options : null,
            correct_answer: q.correct_answer,
            difficulty: q.difficulty,
            explanation: q.explanation || null,
          }));

        if (questionsToInsert.length > 0) {
          const { error: questionsError } = await supabase
            .from("questions")
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
      }

      toast({
        title: "Success!",
        description: "Your course has been created successfully.",
      });

      navigate("/my-courses");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create New Course
            </h1>
            <p className="text-muted-foreground">
              Share your knowledge by creating an engaging course with quiz questions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Information
                </CardTitle>
                <CardDescription>Basic details about your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    All fields are validated for security. Titles max 200 chars, descriptions max 5000 chars.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Web Development"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    maxLength={200}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {courseData.title.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn in this course..."
                    value={courseData.description}
                    onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                    rows={4}
                    maxLength={5000}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {courseData.description.length}/5000 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Programming, Design"
                      value={courseData.category}
                      onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                      maxLength={50}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Letters, numbers, spaces, hyphens & ampersands only
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={courseData.level}
                      onValueChange={(value) => setCourseData({ ...courseData, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={courseData.price}
                      onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={courseData.duration_hours}
                      onChange={(e) => setCourseData({ ...courseData, duration_hours: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quiz Questions</CardTitle>
                    <CardDescription>Add questions to test student knowledge</CardDescription>
                  </div>
                  <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No questions added yet. Click "Add Question" to get started.</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div key={question.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Question {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                          placeholder="Enter your question..."
                          value={question.question_text}
                          onChange={(e) => updateQuestion(question.id, "question_text", e.target.value)}
                          rows={2}
                          maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                          {question.question_text.length}/1000 characters
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Question Type</Label>
                          <Select
                            value={question.question_type}
                            onValueChange={(value) => updateQuestion(question.id, "question_type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select
                            value={question.difficulty}
                            onValueChange={(value) => updateQuestion(question.id, "difficulty", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {question.question_type === "multiple_choice" && (
                        <div className="space-y-2">
                          <Label>Answer Options</Label>
                          {Object.keys(question.options).map((key) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium w-8 flex items-center">{key}.</span>
                              <Input
                                placeholder={`Option ${key}`}
                                value={question.options[key]}
                                onChange={(e) => updateQuestionOption(question.id, key, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        {question.question_type === "multiple_choice" ? (
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) => updateQuestion(question.id, "correct_answer", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct option" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(question.options).map((key) => (
                                <SelectItem key={key} value={key}>
                                  {key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : question.question_type === "true_false" ? (
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) => updateQuestion(question.id, "correct_answer", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Enter the correct answer..."
                            value={question.correct_answer}
                            onChange={(e) => updateQuestion(question.id, "correct_answer", e.target.value)}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                          placeholder="Explain why this is the correct answer..."
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                          rows={2}
                          maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground">
                          {question.explanation?.length || 0}/2000 characters
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/my-courses")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateCourse;
