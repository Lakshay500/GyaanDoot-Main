import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Video, Clock, DollarSign, Calendar, CheckCircle2, Users, Monitor } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { VideoCall } from "@/components/VideoCall";
import { CollaborativeWhiteboard } from "@/components/CollaborativeWhiteboard";

interface MentorSession {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: number;
  status: string;
  scheduled_at?: string;
  video_room_url?: string;
  mentor: {
    full_name: string;
  };
}

// Initialize Stripe only if we have a publishable key
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const MentorSessions = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [mySessions, setMySessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeVideoCall, setActiveVideoCall] = useState<string | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    price: 0
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchSessions();
  }, [user, navigate]);

  const fetchSessions = async () => {
    try {
      // Fetch available sessions
      const { data: availableSessions, error: availableError } = await supabase
        .from("mentor_sessions")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (availableError) throw availableError;

      // Fetch user's sessions
      const { data: userSessions, error: userError } = await supabase
        .from("mentor_sessions")
        .select("*")
        .or(`mentor_id.eq.${user!.id},student_id.eq.${user!.id}`)
        .order("scheduled_at", { ascending: true });

      if (userError) throw userError;

      // Fetch mentor profiles separately
      const enrichAvailable = await Promise.all(
        (availableSessions || []).map(async (session) => {
          const { data: mentor } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", session.mentor_id)
            .single();
          
          return {
            ...session,
            mentor: mentor || { full_name: "Unknown" }
          };
        })
      );

      const enrichUser = await Promise.all(
        (userSessions || []).map(async (session) => {
          const { data: mentor } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", session.mentor_id)
            .single();
          
          return {
            ...session,
            mentor: mentor || { full_name: "Unknown" }
          };
        })
      );

      setSessions(enrichAvailable);
      setMySessions(enrichUser);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const { error } = await supabase
        .from("mentor_sessions")
        .insert({
          mentor_id: user!.id,
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session created successfully"
      });
      setCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        duration_minutes: 60,
        price: 0
      });
      fetchSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive"
      });
    }
  };

  const bookSession = async (sessionId: string, price: number) => {
    try {
      toast({
        title: "Coming Soon",
        description: "Payment integration will be available soon. For now, the session will be booked for free."
      });

      // Update session to booked
      const { error } = await supabase
        .from("mentor_sessions")
        .update({
          student_id: user!.id,
          status: "booked",
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq("id", sessionId);

      if (error) throw error;
      
      fetchSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book session",
        variant: "destructive"
      });
    }
  };

  const joinVideoCall = (sessionId: string) => {
    setActiveVideoCall(sessionId);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Mentor Sessions
              </h1>
              <p className="text-muted-foreground">
                Connect with experienced mentors for personalized guidance
              </p>
            </div>
            {hasRole('mentor') || hasRole('teacher') ? (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Session</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Mentor Session</DialogTitle>
                    <DialogDescription>
                      Set up a new mentoring session for students
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Database Design Consultation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what you'll cover in this session"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <Button onClick={createSession} className="w-full">
                      Create Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>

          {mySessions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">My Sessions</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {mySessions.map((session) => (
                  <Card key={session.id} className="border-primary/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{session.title}</CardTitle>
                        <Badge>
                          {session.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {session.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Mentor: {session.mentor.full_name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {session.duration_minutes} minutes
                        </div>
                        {session.scheduled_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(session.scheduled_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {session.video_room_url && session.status === 'scheduled' && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => joinVideoCall(session.id)}
                            className="flex-1"
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Join Video Call
                          </Button>
                          <Button
                            onClick={() => setShowWhiteboard(!showWhiteboard)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Monitor className="h-4 w-4 mr-2" />
                            Whiteboard
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-4">Available Sessions</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : sessions.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions available at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <Card key={session.id} className="border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{session.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {session.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {session.mentor.full_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {session.duration_minutes} minutes
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        ${session.price}
                      </div>
                    </div>
                    <Button 
                      onClick={() => bookSession(session.id, session.price)}
                      className="w-full"
                    >
                      Book Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Video Call Modal */}
          {activeVideoCall && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="max-w-6xl w-full">
                <VideoCall
                  sessionId={activeVideoCall}
                  sessionName={mySessions.find(s => s.id === activeVideoCall)?.title || "Session"}
                  onEnd={() => setActiveVideoCall(null)}
                />
              </div>
            </div>
          )}

          {/* Whiteboard Modal */}
          {showWhiteboard && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="max-w-6xl w-full relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-4 right-4 z-10"
                  onClick={() => setShowWhiteboard(false)}
                >
                  ×
                </Button>
                <CollaborativeWhiteboard
                  roomId={activeVideoCall || "default"}
                  roomName={mySessions.find(s => s.id === activeVideoCall)?.title || "Session"}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MentorSessions;
