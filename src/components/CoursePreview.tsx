import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Lock } from "lucide-react";
import { useState } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";

interface PreviewSection {
  id: string;
  title: string;
  description?: string;
  is_free_preview: boolean;
  video_url?: string;
  duration_seconds?: number;
}

interface CoursePreviewProps {
  sections: PreviewSection[];
  onEnroll: () => void;
}

export const CoursePreview = ({ sections, onEnroll }: CoursePreviewProps) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const freeSections = sections.filter((s) => s.is_free_preview);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Free Preview Lessons
          </CardTitle>
          <CardDescription>
            Try {freeSections.length} free {freeSections.length === 1 ? "lesson" : "lessons"} before enrolling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {freeSections.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No free preview lessons available for this course.
            </p>
          ) : (
            freeSections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{section.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      Free
                    </Badge>
                  </div>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                  {section.duration_seconds && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.floor(section.duration_seconds / 60)} min
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVideo(section.video_url || null)}
                  disabled={!section.video_url}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Watch
                </Button>
              </div>
            ))
          )}

          {sections.length > freeSections.length && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">
                    {sections.length - freeSections.length} more{" "}
                    {sections.length - freeSections.length === 1 ? "lesson" : "lessons"} available
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enroll now to unlock the full course content
                  </p>
                  <Button onClick={onEnroll} className="w-full">
                    Enroll Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVideo && (
        <Card>
          <CardContent className="p-4">
            <VideoPlayer videoUrl={selectedVideo} videoId="preview" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
