import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { CourseCardSkeleton } from "@/components/LoadingStates";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Clock, DollarSign, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGestures } from "@/hooks/useGestures";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  duration_hours: number;
  thumbnail_url: string | null;
}

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;
  const { toast } = useToast();

  // Gesture controls for mobile
  useGestures({
    onPullRefresh: () => {
      fetchCourses();
      toast({
        title: "Refreshing courses...",
        duration: 2000,
      });
    },
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredCourses]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, category, level, price, duration_hours, thumbnail_url, tags")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const coursesWithTags = (data || []).map(course => ({
        ...course,
        tags: course.tags || []
      }));
      setCourses(coursesWithTags);
      setFilteredCourses(coursesWithTags);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilteredData = (filtered: Course[]) => {
    setFilteredCourses(filtered);
  };

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 animate-gradient" style={{ backgroundSize: '200% 200%' }} />
      
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 relative">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="relative mb-16 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent p-12 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg animate-in fade-in slide-in-from-bottom duration-700">
                Explore Unlimited Learning
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
                Master new skills with expert-led courses. Join thousands of learners worldwide and transform your career today!
              </p>
              <div className="flex flex-wrap gap-6 justify-center items-center text-white/90">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  <span className="font-semibold">{courses.length}+ Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <span className="font-semibold">Expert Instructors</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <span className="font-semibold">Lifetime Access</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
            </p>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters to see more courses.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50 flex flex-col h-full"
                  >
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </div>

                  <CardHeader className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                      <Badge className={`text-xs ${getLevelColor(course.level)}`}>
                        {course.level}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration_hours}h</span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-primary">
                        {course.price === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">FREE</span>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4" />
                            <span>{course.price.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      View Course
                    </Button>
                  </CardFooter>
                </Card>
                </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNumber = idx + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => paginate(pageNumber)}
                                isActive={currentPage === pageNumber}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} className="px-2">...</span>;
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
    </PageTransition>
  );
};

export default Courses;
