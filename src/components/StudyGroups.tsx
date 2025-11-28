import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Plus, BookOpen, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { GroupChat } from "./GroupChat";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  course_id: string;
  created_by: string;
  max_members: number;
  member_count: number;
  is_member: boolean;
}

export const StudyGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", courseId: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;

    const { data: groupsData } = await supabase
      .from("study_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (groupsData) {
      // Fetch member counts and check if user is a member
      const enriched = await Promise.all(
        groupsData.map(async (group) => {
          const { data: members } = await supabase
            .from("study_group_members")
            .select("user_id")
            .eq("group_id", group.id);

          return {
            ...group,
            member_count: members?.length || 0,
            is_member: members?.some(m => m.user_id === user.id) || false
          };
        })
      );

      setGroups(enriched);
    }
  };

  const createGroup = async () => {
    if (!user || !newGroup.name) return;

    setLoading(true);
    try {
      // Create group
      const { data: group, error } = await supabase
        .from("study_groups")
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          course_id: newGroup.courseId || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase
        .from("study_group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "admin"
        });

      toast.success("Study group created!");
      setShowCreate(false);
      setNewGroup({ name: "", description: "", courseId: "" });
      fetchGroups();
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("study_group_members")
        .insert({
          group_id: groupId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Joined study group!");
      fetchGroups();
    } catch (error) {
      toast.error("Failed to join group");
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("study_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Left study group");
      fetchGroups();
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Study Groups</h2>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
              <DialogDescription>
                Start a new study group to collaborate with peers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Group Name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
              />
              <Button onClick={createGroup} disabled={loading} className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.filter(g => g.is_member).length > 0 ? (
          <Tabs defaultValue={groups.filter(g => g.is_member)[0]?.id} className="col-span-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {groups.filter(g => g.is_member).map(group => (
                <TabsTrigger key={group.id} value={group.id}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {groups.filter(g => g.is_member).map(group => (
              <TabsContent key={group.id} value={group.id}>
                <GroupChat groupId={group.id} groupName={group.name} />
              </TabsContent>
            ))}
          </Tabs>
        ) : null}

        <div className="col-span-full">
          <h3 className="text-xl font-semibold mb-4">All Study Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {group.description}
                        </CardDescription>
                      </div>
                      {group.is_member && (
                        <Badge variant="secondary">Member</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                    {group.is_member ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => leaveGroup(group.id)}
                      >
                        Leave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => joinGroup(group.id)}
                        disabled={group.member_count >= group.max_members}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {groups.length === 0 && (
        <Card className="text-center p-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Study Groups Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create the first study group to start collaborating
          </p>
        </Card>
      )}

      {/* Chat Dialog */}
      {selectedGroup && (
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <GroupChat groupId={selectedGroup.id} groupName={selectedGroup.name} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
