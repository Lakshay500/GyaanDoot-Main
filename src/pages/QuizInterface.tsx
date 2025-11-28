import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Brain, Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { quizAnswerSchema } from "@/lib/validations";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

const QuizInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [serverScore, setServerScore] = useState({ correct: 0, total: 0, percentage: 0 });

  useEffect(() => {
    if (id) {
      fetchQuestions();
      checkEnrollment();
    }
  }, [id, user]);

  const checkEnrollment = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", id)
        .maybeSingle();

      if (!error && data) {
        setEnrollmentId(data.id);
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("course_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error("This course doesn't have any quiz questions yet.");
        navigate(`/courses/${id}`);
        return;
      }

      setQuestions(data);
    } catch (error) {
      toast.error("Failed to load quiz questions. Please try again.");
      navigate(`/courses/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSubmitAnswer = () => {
    if (!currentAnswer) {
      toast.error("Please select an answer before submitting.");
      return;
    }

    // Validate answer length for text inputs
    const validation = quizAnswerSchema.safeParse({ answer: currentAnswer });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    // Debug logging
    console.log("Quiz Answer Check:", {
      questionType: currentQuestion.question_type,
      userAnswer: currentAnswer,
      correctAnswer: currentQuestion.correct_answer,
      options: currentQuestion.options
    });

    // For multiple choice and true/false, compare the values exactly
    // For short answer, do case-insensitive comparison with trimming
    const isCorrect =
      currentQuestion.question_type === "short_answer"
        ? currentAnswer.trim().toLowerCase() === currentQuestion.correct_answer.trim().toLowerCase()
        : currentAnswer.trim() === currentQuestion.correct_answer.trim();
    
    setUserAnswers([
      ...userAnswers,
      {
        questionId: currentQuestion.id,
        answer: currentAnswer,
        isCorrect,
      },
    ]);

    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer("");
      setShowFeedback(false);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer("");
      setShowFeedback(false);
    }
  };

  const calculateScore = () => {
    const correct = userAnswers.filter((a) => a.isCorrect).length;
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  const saveQuizResult = async () => {
    if (!user || !enrollmentId) return;

    try {
      // Prepare answers in format expected by server function
      const answersMap = userAnswers.reduce((acc, ua) => {
        acc[ua.questionId] = { answer: ua.answer };
        return acc;
      }, {} as Record<string, { answer: string }>);

      // Call secure server-side scoring function
      const { data, error } = await supabase.rpc("submit_quiz_answers", {
        p_enrollment_id: enrollmentId,
        p_answers: answersMap,
      });

      if (error) {
        console.error("Error saving quiz result:", error);
        toast.error("Failed to submit quiz. Please try again.");
        return;
      }

      // Check for achievements
      if (data && data.length > 0) {
        const result = data[0];
        await supabase.functions.invoke('check-achievements', {
          body: { 
            type: 'quiz_completed', 
            data: { 
              percentage: result.percentage,
              enrollment_id: enrollmentId 
            } 
          }
        });
      }
    } catch (error) {
      console.error("Error saving quiz result:", error);
      toast.error("Failed to submit quiz. Please try again.");
    }
  };

  const handleFinishQuiz = async () => {
    await saveQuizResult();
    
    // Fetch the server-calculated score
    const score = await fetchQuizScore();
    setServerScore(score);
    setQuizCompleted(true);
  };

  const fetchQuizScore = async () => {
    if (!enrollmentId) return { correct: 0, total: questions.length, percentage: 0 };

    try {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("score, total_questions, percentage")
        .eq("enrollment_id", enrollmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { correct: 0, total: questions.length, percentage: 0 };
      }

      return {
        correct: data.score,
        total: data.total_questions,
        percentage: Math.round(data.percentage),
      };
    } catch (error) {
      return { correct: 0, total: questions.length, percentage: 0 };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <Skeleton className="h-12 w-full mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card className="border-primary/50 shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
                <CardDescription>Here's how you performed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {serverScore.percentage}%
                  </div>
                  <p className="text-xl text-muted-foreground">
                    {serverScore.correct} out of {serverScore.total} correct
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h3 className="font-semibold text-lg">Answer Summary</h3>
                  {questions.map((question, index) => {
                    const userAnswer = userAnswers.find((a) => a.questionId === question.id);
                    return (
                      <div key={question.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="flex-1 font-medium">
                            {index + 1}. {question.question_text}
                          </p>
                          {userAnswer?.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                          )}
                        </div>
                        
                        {!userAnswer?.isCorrect && (
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">
                              Your answer: <span className="text-rose-600">{userAnswer?.answer}</span>
                            </p>
                            <p className="text-muted-foreground">
                              Correct answer: <span className="text-emerald-600">{question.correct_answer}</span>
                            </p>
                          </div>
                        )}

                        {question.explanation && (
                          <div className="text-sm text-muted-foreground pt-2 border-t">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/courses/${id}`)}
                  >
                    Back to Course
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setUserAnswers([]);
                      setCurrentQuestionIndex(0);
                      setCurrentAnswer("");
                      setShowFeedback(false);
                      setQuizCompleted(false);
                    }}
                  >
                    Retake Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Progress */}
          <div className="mb-8 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.question_type.replace("_", " ")}
                </Badge>
                <Badge className="text-xs capitalize">
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Answer Options */}
              {currentQuestion.question_type === "multiple_choice" && (
                <RadioGroup
                  value={currentAnswer}
                  onValueChange={setCurrentAnswer}
                  disabled={showFeedback}
                >
                  <div className="space-y-3">
                    {Object.entries(currentQuestion.options).map(([key, value]) => {
                      const isCorrect = key === currentQuestion.correct_answer;
                      const isSelected = key === currentAnswer;
                      
                      return (
                        <div
                          key={key}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors ${
                            showFeedback && isCorrect
                              ? "border-emerald-500 bg-emerald-500/10"
                              : showFeedback && isSelected && !isCorrect
                              ? "border-rose-500 bg-rose-500/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={key} id={key} />
                          <Label htmlFor={key} className="flex-1 cursor-pointer font-medium">
                            {value as string}
                          </Label>
                          {showFeedback && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          )}
                          {showFeedback && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.question_type === "true_false" && (
                <RadioGroup
                  value={currentAnswer}
                  onValueChange={setCurrentAnswer}
                  disabled={showFeedback}
                >
                  <div className="space-y-3">
                    {["true", "false"].map((option) => {
                      const isCorrect = option === currentQuestion.correct_answer;
                      const isSelected = option === currentAnswer;
                      
                      return (
                        <div
                          key={option}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors ${
                            showFeedback && isCorrect
                              ? "border-emerald-500 bg-emerald-500/10"
                              : showFeedback && isSelected && !isCorrect
                              ? "border-rose-500 bg-rose-500/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={option} id={option} />
                          <Label htmlFor={option} className="flex-1 cursor-pointer font-medium capitalize">
                            {option}
                          </Label>
                          {showFeedback && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          )}
                          {showFeedback && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.question_type === "short_answer" && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    disabled={showFeedback}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {currentAnswer.length}/1000 characters
                  </p>
                  {showFeedback && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">Correct Answer:</p>
                      <p className="text-sm">{currentQuestion.correct_answer}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              {showFeedback && currentQuestion.explanation && (
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Explanation</p>
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex-1" />
                
                {!showFeedback ? (
                  <Button onClick={handleSubmitAnswer}>
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      "Finish Quiz"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuizInterface;
