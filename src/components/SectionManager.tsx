import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GripVertical, Save, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { sectionSchema } from "@/lib/validations";

interface Section {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  order_index: number;
}

interface SectionManagerProps {
  courseId: string;
}

export const SectionManager = ({ courseId }: SectionManagerProps) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
  });

  useEffect(() => {
    fetchSections();
  }, [courseId]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("course_sections")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sections.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate with Zod schema
    const validation = sectionSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("course_sections")
          .update({
            title: formData.title,
            description: formData.description || null,
            content: formData.content || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Success", description: "Section updated successfully." });
      } else {
        const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order_index)) : -1;
        const { error } = await supabase
          .from("course_sections")
          .insert({
            course_id: courseId,
            title: formData.title,
            description: formData.description || null,
            content: formData.content || null,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Section added successfully." });
      }

      setFormData({ title: "", description: "", content: "" });
      setEditingId(null);
      setAdding(false);
      fetchSections();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save section.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (section: Section) => {
    setEditingId(section.id);
    setFormData({
      title: section.title,
      description: section.description || "",
      content: section.content || "",
    });
    setAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      const { error } = await supabase
        .from("course_sections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Section deleted successfully." });
      fetchSections();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete section.",
        variant: "destructive",
      });
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

    try {
      const updates = newSections.map((section, idx) => ({
        id: section.id,
        order_index: idx,
      }));

      for (const update of updates) {
        await supabase
          .from("course_sections")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }

      setSections(newSections);
      toast({ title: "Success", description: "Section order updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder sections.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setFormData({ title: "", description: "", content: "" });
    setEditingId(null);
    setAdding(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading sections...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Sections</h2>
          <p className="text-sm text-muted-foreground">
            Organize your course content into structured sections
          </p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Section" : "New Section"}</CardTitle>
            <CardDescription>
              Create engaging content sections for your students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Titles max 200 chars, descriptions max 1000 chars
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="section-title">Title *</Label>
              <Input
                id="section-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
                placeholder="e.g., Introduction to Variables"
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-description">Description</Label>
              <Textarea
                id="section-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={1000}
                placeholder="Brief overview of what this section covers"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-content">Content</Label>
              <Textarea
                id="section-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Detailed content for this section (supports markdown)"
                rows={10}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Update" : "Save"} Section
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No sections yet. Add your first section to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          sections.map((section, index) => (
            <Card key={section.id} className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSection(index, "up")}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <GripVertical className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSection(index, "down")}
                      disabled={index === sections.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <GripVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {index + 1}. {section.title}
                        </h3>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {section.description}
                          </p>
                        )}
                        {section.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {section.content.substring(0, 100)}...
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(section)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(section.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
