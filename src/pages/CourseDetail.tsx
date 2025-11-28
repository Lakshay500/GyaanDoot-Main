import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionViewer } from "@/components/SectionViewer";
import { CourseProgressTimeline } from "@/components/CourseProgressTimeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Clock, DollarSign, User, Brain, CheckCircle2, XCircle, UserPlus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { ReviewSection } from "@/components/ReviewSection";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  duration_hours: number;
  thumbnail_url: string | null;
  instructor_id: string;
}

interface Profile {
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  difficulty: string;
  explanation: string | null;
}

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkAchievements } = useAchievements(user?.id);
  const [course, setCourse] = useState<Course | null>(null);
  const [instructor, setInstructor] = useState<Profile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
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
        setIsEnrolled(true);
        setEnrollmentId(data.id);
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please log in to enroll in this course.");
      navigate("/auth");
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: id!,
        progress: 0,
        completed: false,
      });

      if (error) {
        if (error.code === "23505") {
          toast.success("You're already enrolled in this course.");
          setIsEnrolled(true);
        } else {
          throw error;
        }
      } else {
        toast.success("You've been enrolled in this course.");
        setIsEnrolled(true);
        await checkEnrollment();
      }
    } catch (error: any) {
      toast.error("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      if (courseData.instructor_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, bio, avatar_url")
          .eq("id", courseData.instructor_id)
          .single();

        if (!profileError) {
          setInstructor(profileData);
        }
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("course_id", id)
        .order("created_at", { ascending: true });

      if (!questionsError) {
        setQuestions(questionsData || []);
      }
    } catch (error) {
      toast.error("Failed to load course details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "intermediate":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "advanced":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "medium":
        return <Brain className="w-4 h-4 text-amber-600" />;
      case "hard":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-64 w-full mb-8" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Course not found</h2>
            <p className="text-muted-foreground mb-6">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
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
        <div className="container mx-auto px-4">
          {/* Course Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline">{course.category}</Badge>
              <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {course.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              {course.description}
            </p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">{course.duration_hours} hours</span>
              </div>
              <div className="flex items-center gap-2">
                {course.price === 0 ? (
                  <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">FREE</span>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold">${course.price.toFixed(2)}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-medium">{questions.length} Questions</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Sections for Enrolled Students */}
              {isEnrolled && enrollmentId && (
                <SectionViewer courseId={id!} enrollmentId={enrollmentId} />
              )}

              {/* Course Image */}
              {course.thumbnail_url && (
                <Card className="overflow-hidden">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-64 object-cover"
                  />
                </Card>
              )}

              {/* Quiz Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Quiz Questions
                  </CardTitle>
                  <CardDescription>
                    Review the questions included in this course quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No questions available yet
                    </p>
                  ) : (
                    questions.map((question, index) => (
                      <div key={question.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-sm">Question {index + 1}</span>
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                {getDifficultyIcon(question.difficulty)}
                                {question.difficulty}
                              </Badge>
                            </div>
                            <p className="font-medium mb-2">{question.question_text}</p>
                          </div>
                        </div>

                        {question.question_type === "multiple_choice" && question.options && (
                          <div className="space-y-2">
                            {Object.entries(question.options).map(([key, value]) => (
                              <div
                                key={key}
                                className={`p-2 rounded border text-sm ${
                                  key === question.correct_answer
                                    ? "border-emerald-500 bg-emerald-500/10"
                                    : "border-border"
                                }`}
                              >
                                <span className="font-medium mr-2">{key}.</span>
                                {value as string}
                                {key === question.correct_answer && (
                                  <CheckCircle2 className="w-4 h-4 inline ml-2 text-emerald-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.question_type === "true_false" && (
                          <div className="flex gap-2">
                            <Badge variant={question.correct_answer === "true" ? "default" : "outline"}>
                              True {question.correct_answer === "true" && "✓"}
                            </Badge>
                            <Badge variant={question.correct_answer === "false" ? "default" : "outline"}>
                              False {question.correct_answer === "false" && "✓"}
                            </Badge>
                          </div>
                        )}

                        {question.explanation && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Instructor Card */}
              {instructor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Instructor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      {instructor.avatar_url ? (
                        <img
                          src={instructor.avatar_url}
                          alt={instructor.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{instructor.full_name}</p>
                        <p className="text-sm text-muted-foreground">Course Instructor</p>
                      </div>
                    </div>
                    {instructor.bio && (
                      <>
                        <Separator />
                        <p className="text-sm text-muted-foreground">{instructor.bio}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Start Quiz Button */}
              {questions.length > 0 && isEnrolled && (
                <Card className="border-primary/50 shadow-lg">
                  <CardHeader>
                    <CardTitle>Ready to test your knowledge?</CardTitle>
                    <CardDescription>
                      Take the quiz to assess your understanding
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => navigate(`/courses/${id}/quiz`)}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Enrollment Button */}
              {!isEnrolled && (
                <Card className="border-primary/50 shadow-lg">
                  <CardHeader>
                    <CardTitle>Enroll in this course</CardTitle>
                    <CardDescription>
                      {course.price === 0 
                        ? "Get instant access to all course materials and quizzes"
                        : `Pay $${course.price.toFixed(2)} to get full access`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {enrolling ? "Enrolling..." : course.price === 0 ? "Enroll for Free" : "Enroll Now"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reviews Section - Full Width */}
            <div className="lg:col-span-3 mt-8">
              <ReviewSection courseId={id!} isEnrolled={isEnrolled} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;
