import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnail_url?: string;
}

export const CourseRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;
    try {
      const { data: cached } = await supabase
        .from('course_recommendations_cache')
        .select('recommended_courses, generated_at')
        .eq('user_id', user.id)
        .single();

      if (cached) {
        const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
        if (cacheAge < 24 * 60 * 60 * 1000) {
          setRecommendations(cached.recommended_courses as unknown as Course[]);
          setLoading(false);
          return;
        }
      }
      await generateRecommendations();
    } catch (error) {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations');
      if (error) throw error;
      setRecommendations(data.recommendations || []);
      toast.success('AI recommendations generated!');
    } catch (error) {
      toast.error('Failed to generate recommendations');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Personalized for you</CardDescription>
          </div>
          <Button variant="outline" onClick={generateRecommendations} disabled={generating}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <Button onClick={generateRecommendations} disabled={generating}>
              Generate AI Recommendations
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((course, index) => (
              <motion.div key={course.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/courses/${course.id}`}>
                  <CardHeader>
                    <Badge variant="outline">{course.category}</Badge>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
