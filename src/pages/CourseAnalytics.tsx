import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  BookOpen,
  TrendingUp,
  Star,
  Award,
  BarChart3,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Activity,
  Target
} from "lucide-react";

interface AnalyticsData {
  totalEnrollments: number;
  averageProgress: number;
  completionRate: number;
  averageQuizScore: number;
  averageRating: number;
  totalReviews: number;
  averageTimeSpent: number;
  activeStudents: number;
  enrollmentsByProgress: { range: string; count: number }[];
  recentEnrollments: Array<{
    user_name: string;
    enrolled_at: string;
    progress: number;
  }>;
  engagementTrend: Array<{
    date: string;
    activeUsers: number;
  }>;
}

const CourseAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      verifyInstructorAndFetchData();
    }
  }, [id, user]);

  const verifyInstructorAndFetchData = async () => {
    try {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("title, instructor_id")
        .eq("id", id)
        .single();

      if (courseError) throw courseError;

      if (course.instructor_id !== user?.id) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this analytics.",
          variant: "destructive",
        });
        navigate("/my-courses");
        return;
      }

      setCourseName(course.title);
      await fetchAnalytics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
      navigate("/my-courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          id,
          progress,
          completed,
          enrolled_at,
          profiles:user_id (full_name)
        `)
        .eq("course_id", id);

      if (enrollError) throw enrollError;

      const { data: quizResults, error: quizError } = await supabase
        .from("quiz_results")
        .select("score, total_questions, enrollment_id")
        .in(
          "enrollment_id",
          (enrollments || []).map((e: any) => e.id)
        );

      if (quizError) throw quizError;

      const { data: reviews, error: reviewError } = await supabase
        .from("course_reviews")
        .select("rating")
        .eq("course_id", id);

      if (reviewError) throw reviewError;

      const totalEnrollments = enrollments?.length || 0;
      const averageProgress =
        totalEnrollments > 0
          ? Math.round(
              enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) /
                totalEnrollments
            )
          : 0;
      const completedCount = enrollments?.filter((e: any) => e.completed).length || 0;
      const completionRate =
        totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;

      const quizScores =
        quizResults?.map((r: any) => (r.score / r.total_questions) * 100) || [];
      const averageQuizScore =
        quizScores.length > 0
          ? Math.round(quizScores.reduce((sum, s) => sum + s, 0) / quizScores.length)
          : 0;

      const ratings = reviews?.map((r: any) => r.rating) || [];
      const averageRating =
        ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : "0.0";

      const progressRanges = [
        { range: "0-25%", count: 0 },
        { range: "26-50%", count: 0 },
        { range: "51-75%", count: 0 },
        { range: "76-100%", count: 0 },
      ];

      enrollments?.forEach((e: any) => {
        const progress = e.progress || 0;
        if (progress <= 25) progressRanges[0].count++;
        else if (progress <= 50) progressRanges[1].count++;
        else if (progress <= 75) progressRanges[2].count++;
        else progressRanges[3].count++;
      });

      const recentEnrollments =
        enrollments
          ?.sort(
            (a: any, b: any) =>
              new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
          )
          .slice(0, 5)
          .map((e: any) => ({
            user_name: e.profiles?.full_name || "Unknown User",
            enrolled_at: new Date(e.enrolled_at).toLocaleDateString(),
            progress: e.progress || 0,
          })) || [];

      setAnalytics({
        totalEnrollments,
        averageProgress,
        completionRate,
        averageQuizScore,
        averageRating: parseFloat(averageRating),
        totalReviews: reviews?.length || 0,
        averageTimeSpent: 0, // Placeholder for future implementation
        activeStudents: enrollments?.filter((e: any) => {
          const lastAccessed = new Date(e.last_accessed_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastAccessed > weekAgo;
        }).length || 0,
        enrollmentsByProgress: progressRanges,
        recentEnrollments,
        engagementTrend: [] // Placeholder for future implementation
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <p className="text-center">Loading analytics...</p>
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
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/my-courses")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Courses
            </Button>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Course Analytics
            </h1>
            <p className="text-lg text-muted-foreground">{courseName}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <p className="text-3xl font-bold">{analytics.totalEnrollments}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <p className="text-3xl font-bold">{analytics.averageProgress}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-primary" />
                  <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                  <p className="text-3xl font-bold">
                    {analytics.averageRating}
                    <span className="text-base text-muted-foreground ml-1">/ 5.0</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {analytics.totalReviews} reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Active Students (7 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.activeStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.totalEnrollments > 0 ? Math.round((analytics.activeStudents / analytics.totalEnrollments) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Quiz Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.averageQuizScore}%</p>
                <Progress value={analytics.averageQuizScore} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Students Completing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round((analytics.completionRate / 100) * analytics.totalEnrollments)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {analytics.totalEnrollments} enrolled
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quiz Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quiz Performance
                </CardTitle>
                <CardDescription>
                  Average score across all quiz attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {analytics.averageQuizScore}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Average Quiz Score
                    </p>
                  </div>
                  <Progress value={analytics.averageQuizScore} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Progress Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Progress Distribution
                </CardTitle>
                <CardDescription>
                  Students grouped by course completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.enrollmentsByProgress.map((item) => (
                    <div key={item.range} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.range}</span>
                        <Badge variant="outline">{item.count} students</Badge>
                      </div>
                      <Progress
                        value={
                          analytics.totalEnrollments > 0
                            ? (item.count / analytics.totalEnrollments) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Enrollments */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recent Enrollments
                </CardTitle>
                <CardDescription>Latest students who joined your course</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recentEnrollments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No enrollments yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.recentEnrollments.map((enrollment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{enrollment.user_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Enrolled on {enrollment.enrolled_at}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{enrollment.progress}%</p>
                          <Progress
                            value={enrollment.progress}
                            className="h-2 w-24 mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseAnalytics;
