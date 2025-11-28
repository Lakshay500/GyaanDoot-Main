import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, ChevronRight, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { triggerConfetti } from "@/lib/confetti";
import { VideoPlayer } from "./VideoPlayer";

interface Section {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  order_index: number;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration_seconds: number | null;
  section_id: string;
}

interface SectionViewerProps {
  courseId: string;
  enrollmentId: string;
}

export const SectionViewer = ({ courseId, enrollmentId }: SectionViewerProps) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [courseId, enrollmentId]);

  const fetchData = async () => {
    try {
      const [sectionsResult, completionsResult, videosResult] = await Promise.all([
        supabase
          .from("course_sections")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
        supabase
          .from("section_completions")
          .select("section_id")
          .eq("enrollment_id", enrollmentId),
        supabase
          .from("course_videos")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true }),
      ]);

      if (sectionsResult.error) throw sectionsResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (videosResult.error) throw videosResult.error;

      const sectionsData = sectionsResult.data || [];
      const completionsData = completionsResult.data || [];
      const videosData = videosResult.data || [];

      setSections(sectionsData);
      setVideos(videosData);
      setCompletedSections(new Set(completionsData.map((c) => c.section_id)));

      if (sectionsData.length > 0) {
        const firstIncomplete = sectionsData.find(
          (s) => !completionsData.some((c) => c.section_id === s.id)
        );
        setSelectedSection(firstIncomplete || sectionsData[0]);
      }

      const progressPercent =
        sectionsData.length > 0
          ? Math.round((completionsData.length / sectionsData.length) * 100)
          : 0;
      setProgress(progressPercent);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load course sections.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async (sectionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("section_completions").insert({
        enrollment_id: enrollmentId,
        section_id: sectionId,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Completed",
            description: "You've already marked this section as complete.",
          });
          return;
        }
        throw error;
      }

      setCompletedSections(new Set([...completedSections, sectionId]));
      
      const newProgress = Math.round(((completedSections.size + 1) / sections.length) * 100);
      setProgress(newProgress);

      await supabase
        .from("enrollments")
        .update({ progress: newProgress })
        .eq("id", enrollmentId);

      toast({
        title: "Section Completed!",
        description: "Your progress has been updated.",
      });

      // Trigger confetti and generate certificate if course is fully completed
      if (newProgress === 100) {
        triggerConfetti();
        await generateCertificate();
      }

      const currentIndex = sections.findIndex((s) => s.id === sectionId);
      if (currentIndex < sections.length - 1) {
        setSelectedSection(sections[currentIndex + 1]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark section as complete.",
        variant: "destructive",
      });
    }
  };

  const generateCertificate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { courseId }
      });

      if (error) throw error;

      toast({
        title: "Certificate Generated!",
        description: "Your course completion certificate is ready.",
      });
    } catch (error) {
      console.error('Certificate generation error:', error);
    }
  };

  const handleVideoProgress = (sectionId: string) => {
    // Auto-mark section as complete when video is 90% watched
    if (!completedSections.has(sectionId)) {
      markAsComplete(sectionId);
    }
  };

  const sectionVideos = selectedSection 
    ? videos.filter(v => v.section_id === selectedSection.id)
    : [];

  if (loading) {
    return <div className="text-center py-8">Loading course content...</div>;
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No course sections available yet. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>
            {completedSections.size} of {sections.length} sections completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{progress}% Complete</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>Click to view section content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.map((section, index) => {
              const isCompleted = completedSections.has(section.id);
              const isSelected = selectedSection?.id === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {index + 1}. {section.title}
                      </p>
                    </div>
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {selectedSection && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{selectedSection.title}</CardTitle>
                  {selectedSection.description && (
                    <CardDescription className="mt-2">
                      {selectedSection.description}
                    </CardDescription>
                  )}
                </div>
                {completedSections.has(selectedSection.id) && (
                  <Badge className="bg-emerald-600">Completed</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedSection.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{selectedSection.content}</div>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No content available for this section yet.
                </p>
              )}

              {!completedSections.has(selectedSection.id) && (
                <Button
                  onClick={() => markAsComplete(selectedSection.id)}
                  className="w-full"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
