import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TimelineSection {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  completed: boolean;
  completed_at: string | null;
}

interface CourseProgressTimelineProps {
  enrollmentId: string;
  courseId: string;
}

export const CourseProgressTimeline = ({ enrollmentId, courseId }: CourseProgressTimelineProps) => {
  const [sections, setSections] = useState<TimelineSection[]>([]);
  const [stats, setStats] = useState({
    totalSections: 0,
    completedSections: 0,
    timeSpent: 0,
    progress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [enrollmentId, courseId]);

  const fetchProgressData = async () => {
    try {
      // Fetch all sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch completed sections
      const { data: completionsData, error: completionsError } = await supabase
        .from('section_completions')
        .select('section_id, completed_at')
        .eq('enrollment_id', enrollmentId);

      if (completionsError) throw completionsError;

      const completedSectionIds = new Set(completionsData?.map(c => c.section_id) || []);
      const completionMap = new Map(completionsData?.map(c => [c.section_id, c.completed_at]) || []);

      const enrichedSections = sectionsData?.map(section => ({
        ...section,
        completed: completedSectionIds.has(section.id),
        completed_at: completionMap.get(section.id) || null
      })) || [];

      setSections(enrichedSections);

      // Calculate stats
      const completed = enrichedSections.filter(s => s.completed).length;
      const total = enrichedSections.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Estimate time spent (15 min per completed section)
      const timeSpent = completed * 15;

      setStats({
        totalSections: total,
        completedSections: completed,
        timeSpent,
        progress
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not completed';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getNextMilestone = () => {
    const completed = stats.completedSections;
    const milestones = [5, 10, 15, 20];
    return milestones.find(m => m > completed) || stats.totalSections;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Progress...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{stats.progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completedSections}/{stats.totalSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">{stats.timeSpent}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Milestone</p>
                <p className="text-2xl font-bold">{getNextMilestone()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Learning Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-start gap-4 py-4 border-b last:border-0">
                <div className="flex flex-col items-center">
                  {section.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                  {index < sections.length - 1 && (
                    <div className={`w-0.5 h-12 mt-2 ${section.completed ? 'bg-emerald-500' : 'bg-border'}`} />
                  )}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{section.title}</h4>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {section.completed ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
                          {formatDate(section.completed_at)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Upcoming</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sections available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {stats.totalSections - stats.completedSections} sections remaining
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
