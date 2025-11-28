import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { DashboardSkeleton } from "@/components/LoadingStates";
import { CourseRecommendations } from "@/components/CourseRecommendations";
import { StreakTracker } from "@/components/StreakTracker";
import { DailyChallenges } from "@/components/DailyChallenges";
import { LivePresence } from "@/components/LivePresence";
import { StudyGroups } from "@/components/StudyGroups";
import { GamificationBadges } from "@/components/GamificationBadges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { BookOpen, Trophy, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  last_accessed_at: string;
  enrolled_at: string;
  course: {
    title: string;
    description: string;
    category: string;
    level: string;
    thumbnail_url: string | null;
    duration_hours: number;
  };
  quiz_results: Array<{
    score: number;
    total_questions: number;
    percentage: number;
    completed_at: string;
  }>;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkAchievements } = useAchievements(user?.id);
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completed: 0,
    inProgress: 0,
    averageScore: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchEnrollments();
    
    // Check for streak achievements on dashboard load
    checkAchievements('streak_check', {});
  }, [user, navigate]);

  const fetchEnrollments = async () => {
    try {
      const { data: enrollmentData, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses (
            title,
            description,
            category,
            level,
            thumbnail_url,
            duration_hours
          ),
          quiz_results (
            score,
            total_questions,
            percentage,
            completed_at
          )
        `)
        .eq("user_id", user!.id)
        .order("last_accessed_at", { ascending: false });

      if (error) throw error;

      const enrichedEnrollments = (enrollmentData || []).map((enrollment: any) => ({
        id: enrollment.id,
        course_id: enrollment.course_id,
        progress: enrollment.progress,
        completed: enrollment.completed,
        last_accessed_at: enrollment.last_accessed_at,
        enrolled_at: enrollment.enrolled_at,
        course: enrollment.course,
        quiz_results: enrollment.quiz_results || [],
      }));

      setEnrollments(enrichedEnrollments);

      // Calculate stats
      const total = enrichedEnrollments.length;
      const completed = enrichedEnrollments.filter((e) => e.completed).length;
      const inProgress = total - completed;

      const allScores = enrichedEnrollments.flatMap((e) =>
        e.quiz_results.map((r) => r.percentage)
      );
      const avgScore =
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0;

      setStats({
        totalEnrolled: total,
        completed,
        inProgress,
        averageScore: Math.round(avgScore),
      });
    } catch (error: any) {
      toast.error("Failed to load your courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueLesson = async (courseId: string, enrollmentId: string) => {
    try {
      await supabase
        .from("enrollments")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", enrollmentId);
      
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error("Error updating last accessed:", error);
      navigate(`/courses/${courseId}`);
    }
  };

  const getLatestQuizScore = (enrollment: EnrolledCourse) => {
    if (enrollment.quiz_results.length === 0) return null;
    const latest = enrollment.quiz_results[0];
    return {
      score: latest.score,
      total: latest.total_questions,
      percentage: Math.round(latest.percentage),
    };
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pt-24 pb-16">
            <div className="container mx-auto px-4">
              <DashboardSkeleton />
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Learning Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your progress and continue your learning journey
            </p>
          </div>

          {/* Stats Cards */}
          <Tabs defaultValue="courses" className="mb-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="groups">Study Groups</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="presence">Live</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: BookOpen, label: "Total Courses", value: stats.totalEnrolled, color: "from-primary to-primary-glow" },
                  { icon: CheckCircle2, label: "Completed", value: stats.completed, color: "from-success to-emerald-400" },
                  { icon: Clock, label: "In Progress", value: stats.inProgress, color: "from-accent to-pink-400" },
                  { icon: Trophy, label: "Avg. Score", value: stats.averageScore > 0 ? `${stats.averageScore}%` : "N/A", color: "from-secondary to-purple-400" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                          <stat.icon className="w-4 h-4" />
                          {stat.label}
                        </CardDescription>
                        <CardTitle className="text-3xl">{stat.value}</CardTitle>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>

          {/* Enrolled Courses */}
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your learning journey by enrolling in a course
                </p>
                <Button onClick={() => navigate("/courses")}>
                  Browse Courses
                </Button>
              </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">My Courses</h2>
                    <div className="grid grid-cols-1 gap-6">
                      {enrollments.map((enrollment, index) => {
                  const latestScore = getLatestQuizScore(enrollment);
                  return (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow hover:border-primary/50">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">{enrollment.course.category}</Badge>
                          {enrollment.completed && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="line-clamp-2">{enrollment.course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {enrollment.course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{enrollment.progress}%</span>
                          </div>
                          <Progress value={enrollment.progress} />
                        </div>

                        {latestScore && (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium">Latest Score</span>
                            </div>
                            <span className="font-bold">{latestScore.percentage}%</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => continueLesson(enrollment.course_id, enrollment.id)}
                          >
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  );
                })}
                    </div>
                    <CourseRecommendations />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="challenges">
                <DailyChallenges />
              </TabsContent>

              <TabsContent value="groups">
                <StudyGroups />
              </TabsContent>

              <TabsContent value="badges">
                <GamificationBadges />
              </TabsContent>

              <TabsContent value="presence">
                <LivePresence roomId="dashboard" />
              </TabsContent>
            </Tabs>
            </div>
          </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
