import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMentorPresence } from "@/hooks/useMentorPresence";
import { Star, BookmarkPlus, BookmarkCheck, Video, Calendar, Award, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MentorBookingCalendar } from "@/components/MentorBookingCalendar";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface MentorProfile {
  id: string;
  user_id: string;
  bio: string;
  expertise: string[];
  hourly_rate: number;
  total_sessions: number;
  average_rating: number;
  is_verified: boolean;
  profiles?: { full_name: string; avatar_url?: string };
}

interface SessionHistory {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  rating?: number;
  review?: string;
}

const MentorProfile = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMentorOnline } = useMentorPresence();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation(0.2);
  const { ref: tabsRef, isVisible: tabsVisible } = useScrollAnimation(0.1);

  useEffect(() => {
    if (mentorId) {
      fetchMentorData();
    }
  }, [mentorId]);

  const fetchMentorData = async () => {
    try {
      // Fetch mentor profile
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('id', mentorId)
        .single();

      if (mentorError) throw mentorError;

      // Fetch profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', mentorData.user_id)
        .single();

      setMentor({ ...mentorData, profiles: profileData });

      // Fetch session history
      const { data: sessionsData } = await supabase
        .from('session_bookings')
        .select('id, scheduled_at, duration_minutes, status')
        .eq('mentor_id', mentorId)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
        .limit(10);

      setSessions(sessionsData || []);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('session_ratings')
        .select('*, session_bookings!inner(mentor_id)')
        .eq('session_bookings.mentor_id', mentorId)
        .order('created_at', { ascending: false })
        .limit(5);

      setReviews(reviewsData || []);

      // Check if bookmarked
      if (user) {
        const { data: bookmarkData } = await supabase
          .from('mentor_bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('mentor_id', mentorId)
          .single();

        setIsBookmarked(!!bookmarkData);
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
      toast.error("Failed to load mentor profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      toast.error("Please log in to bookmark mentors");
      navigate("/auth");
      return;
    }

    try {
      if (isBookmarked) {
        await supabase
          .from('mentor_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('mentor_id', mentorId);
        
        setIsBookmarked(false);
        toast.success("Removed from favorites");
      } else {
        await supabase
          .from('mentor_bookmarks')
          .insert({
            user_id: user.id,
            mentor_id: mentorId,
          });
        
        setIsBookmarked(true);
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error("Failed to update bookmark");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="text-center p-12">
            <h2 className="text-2xl font-bold mb-4">Mentor Not Found</h2>
            <Button onClick={() => navigate('/mentors')}>Back to Mentors</Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const isOnline = isMentorOnline(mentor.id);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 30 }}
          animate={heroVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={mentor.profiles?.avatar_url} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {mentor.profiles?.full_name?.charAt(0) || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background"></div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold">{mentor.profiles?.full_name}</h1>
                        {mentor.is_verified && (
                          <Badge className="gap-1" variant="secondary">
                            <Award className="w-4 h-4" />
                            Verified
                          </Badge>
                        )}
                        {isOnline && (
                          <Badge className="bg-green-500 text-white">
                            Online Now
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">{mentor.average_rating.toFixed(1)}</span>
                          <span>({reviews.length} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="w-5 h-5" />
                          <span>{mentor.total_sessions} sessions</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={toggleBookmark}>
                        {isBookmarked ? (
                          <BookmarkCheck className="w-5 h-5 text-primary" />
                        ) : (
                          <BookmarkPlus className="w-5 h-5" />
                        )}
                      </Button>
                      <Button onClick={() => setBookingDialogOpen(true)} size="lg">
                        <Calendar className="w-5 h-5 mr-2" />
                        Book Session
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise.map(exp => (
                      <Badge key={exp} variant="secondary">{exp}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <DollarSign className="w-6 h-6" />
                    {mentor.hourly_rate}/hr
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          ref={tabsRef}
          initial={{ opacity: 0, y: 30 }}
          animate={tabsVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="sessions">Session History</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">{mentor.bio}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              {sessions.length > 0 ? (
                sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{new Date(session.scheduled_at).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">{session.duration_minutes} minutes</p>
                            </div>
                          </div>
                          <Badge>{session.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No session history available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.review && <p className="text-muted-foreground">{review.review}</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              Schedule a mentoring session with {mentor.profiles?.full_name}
            </DialogDescription>
          </DialogHeader>
          <MentorBookingCalendar
            mentorId={mentor.id}
            mentorName={mentor.profiles?.full_name || 'Mentor'}
            hourlyRate={mentor.hourly_rate}
            onClose={() => setBookingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MentorProfile;
