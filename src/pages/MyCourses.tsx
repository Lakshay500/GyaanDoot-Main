import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { CourseCardSkeleton } from "@/components/LoadingStates";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  duration_hours: number;
  is_published: boolean;
  created_at: string;
}

const MyCourses = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; courseId: string | null }>({
    open: false,
    courseId: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchMyCourses();
    }
  }, [user, authLoading, navigate]);

  const fetchMyCourses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: !currentStatus })
        .eq("id", courseId);

      if (error) throw error;

      setCourses(
        courses.map((c) =>
          c.id === courseId ? { ...c, is_published: !currentStatus } : c
        )
      );

      toast({
        title: "Success",
        description: `Course ${!currentStatus ? "published" : "unpublished"} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async () => {
    if (!deleteDialog.courseId) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", deleteDialog.courseId);

      if (error) throw error;

      setCourses(courses.filter((c) => c.id !== deleteDialog.courseId));
      
      toast({
        title: "Success",
        description: "Course deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({ open: false, courseId: null });
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

  if (loading || authLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-accent/5">
          <Navbar />
          <main className="flex-1 pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="h-12 w-64 mb-8 bg-muted animate-pulse rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header with gradient background */}
          <div className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-primary/20 animate-in fade-in slide-in-from-top duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  My Courses
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage your courses, track performance, and inspire students worldwide
                </p>
              </div>
              <Button 
                onClick={() => navigate("/courses/new")}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Course
              </Button>
            </div>
          </div>

          {courses.length === 0 ? (
            <Card className="text-center py-20 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 animate-in fade-in slide-in-from-bottom duration-700">
              <CardContent>
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No courses yet</h3>
                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                  Start creating your first course to share your knowledge with students worldwide.
                </p>
                <Button 
                  onClick={() => navigate("/courses/new")}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <Card 
                  key={course.id} 
                  className="flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5">
                          {course.category}
                        </Badge>
                        <Badge className={`text-xs ${getLevelColor(course.level)}`}>
                          {course.level}
                        </Badge>
                      </div>
                      <Badge
                        variant={course.is_published ? "default" : "secondary"}
                        className={`text-xs ${course.is_published ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}`}
                      >
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-base">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{course.duration_hours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">
                          {course.price === 0 ? "FREE" : `$${course.price.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    <div className="flex w-full gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => togglePublish(course.id, course.is_published)}
                      >
                        {course.is_published ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex w-full gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/courses/${course.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/courses/${course.id}/analytics`)}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, courseId: course.id })}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, courseId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your course and all associated questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
      </PageTransition>
  );
};

export default MyCourses;
