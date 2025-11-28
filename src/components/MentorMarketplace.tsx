import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMentorPresence } from "@/hooks/useMentorPresence";
import { Star, Clock, DollarSign, Video, Award, BookmarkPlus, BookmarkCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MentorBookingCalendar } from "./MentorBookingCalendar";
import { LoadingSpinner } from "./LoadingStates";

interface Mentor {
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

export const MentorMarketplace = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMentorOnline } = useMentorPresence();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [expertiseFilter, setExpertiseFilter] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookmarkedMentors, setBookmarkedMentors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  useEffect(() => {
    filterMentors();
  }, [mentors, expertiseFilter, maxPrice]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('*')
        .order('average_rating', { ascending: false });

      if (error) {
        console.error('Error fetching mentors:', error);
        toast.error('Failed to load mentors');
        return;
      }

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedMentors = data.map(mentor => ({
          ...mentor,
          profiles: profileMap.get(mentor.user_id)
        }));

        setMentors(enrichedMentors as Mentor[]);
      } else {
        setMentors([]);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const filterMentors = () => {
    let filtered = [...mentors];

    if (expertiseFilter) {
      filtered = filtered.filter(m => 
        m.expertise.some(e => e.toLowerCase().includes(expertiseFilter.toLowerCase()))
      );
    }

    filtered = filtered.filter(m => m.hourly_rate <= maxPrice);

    setFilteredMentors(filtered);
  };

  const fetchBookmarks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('mentor_bookmarks')
      .select('mentor_id')
      .eq('user_id', user.id);

    if (data) {
      setBookmarkedMentors(new Set(data.map(b => b.mentor_id)));
    }
  };

  const toggleBookmark = async (mentorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please log in to bookmark mentors");
      return;
    }

    try {
      if (bookmarkedMentors.has(mentorId)) {
        await supabase
          .from('mentor_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('mentor_id', mentorId);
        
        setBookmarkedMentors(prev => {
          const updated = new Set(prev);
          updated.delete(mentorId);
          return updated;
        });
        toast.success("Removed from favorites");
      } else {
        await supabase
          .from('mentor_bookmarks')
          .insert({ user_id: user.id, mentor_id: mentorId });
        
        setBookmarkedMentors(prev => new Set([...prev, mentorId]));
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error("Failed to update bookmark");
    }
  };

  const openBookingDialog = (mentor: Mentor) => {
    if (!user) {
      toast.error("Please log in to book a session");
      return;
    }
    setSelectedMentor(mentor);
    setBookingDialogOpen(true);
  };

  const allExpertise = [...new Set(mentors.flatMap(m => m.expertise))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Expertise</label>
          <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by expertise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {allExpertise.map(exp => (
                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Max Price: ${maxPrice}/hr</label>
          <Input
            type="range"
            min="0"
            max="1000"
            step="50"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor, index) => {
          const isOnline = isMentorOnline(mentor.id);
          const isBookmarked = bookmarkedMentors.has(mentor.id);
          
          return (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/mentor/${mentor.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                          {mentor.profiles?.full_name?.charAt(0) || 'M'}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{mentor.profiles?.full_name || 'Mentor'}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{mentor.average_rating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({mentor.total_sessions})</span>
                          </div>
                          {isOnline && (
                            <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {mentor.is_verified && (
                        <Badge variant="secondary" className="gap-1">
                          <Award className="h-3 w-3" />
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => toggleBookmark(mentor.id, e)}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">{mentor.bio}</CardDescription>
                  
                  <div className="flex flex-wrap gap-1">
                    {mentor.expertise.slice(0, 3).map(exp => (
                      <Badge key={exp} variant="outline" className="text-xs">{exp}</Badge>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{mentor.expertise.length - 3}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>${mentor.hourly_rate}/hr</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/mentor/${mentor.id}`); }}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); openBookingDialog(mentor); }}>
                        <Video className="h-4 w-4 mr-1" />
                        Book
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredMentors.length === 0 && (
        <Card className="text-center p-12">
          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Mentors Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more mentors
          </p>
        </Card>
      )}

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              Schedule a mentoring session with {selectedMentor?.profiles?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedMentor && (
            <MentorBookingCalendar
              mentorId={selectedMentor.id}
              mentorName={selectedMentor.profiles?.full_name || 'Mentor'}
              hourlyRate={selectedMentor.hourly_rate}
              onClose={() => setBookingDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
