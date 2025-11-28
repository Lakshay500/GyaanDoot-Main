import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Medal, Award, TrendingUp, Zap, UserPlus, UserMinus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  xp: number;
  level: number;
  achievements_count: number;
  courses_completed: number;
  is_following?: boolean;
  followers_count?: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardUser[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardUser[]>([]);
  const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      // All-time leaderboard
      const { data: allTime, error: allTimeError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          xp,
          level
        `)
        .order("xp", { ascending: false })
        .limit(50);

      if (allTimeError) throw allTimeError;

      // Fetch achievement counts, completed courses, and social data for all users
      const enrichedData = await Promise.all(
        (allTime || []).map(async (profileUser) => {
          const { data: achievements } = await supabase
            .from("user_achievements")
            .select("id")
            .eq("user_id", profileUser.id);

          const { data: completedCourses } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", profileUser.id)
            .eq("completed", true);

          // Check if current user follows this user
          let is_following = false;
          let followers_count = 0;

          if (user) {
            const { data: followData } = await supabase
              .from("user_follows")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", profileUser.id)
              .single();

            is_following = !!followData;
          }

          // Get followers count
          const { data: followers } = await supabase
            .from("user_follows")
            .select("id")
            .eq("following_id", profileUser.id);

          followers_count = followers?.length || 0;

          return {
            ...profileUser,
            achievements_count: achievements?.length || 0,
            courses_completed: completedCourses?.length || 0,
            is_following,
            followers_count
          };
        })
      );

      setAllTimeLeaders(enrichedData);

      // Weekly leaderboard (users who gained most XP this week)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyData } = await supabase
        .from("enrollments")
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            xp,
            level
          )
        `)
        .gte("updated_at", weekAgo.toISOString())
        .eq("completed", true);

      // Process weekly data
      const weeklyMap = new Map();
      weeklyData?.forEach((enrollment: any) => {
        const profile = enrollment.profiles;
        if (!weeklyMap.has(profile.id)) {
          weeklyMap.set(profile.id, {
            ...profile,
            achievements_count: 0,
            courses_completed: 1
          });
        } else {
          const existing = weeklyMap.get(profile.id);
          existing.courses_completed += 1;
        }
      });
      
      const weeklyArray = Array.from(weeklyMap.values())
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 20);
      
      setWeeklyLeaders(weeklyArray);

      // Monthly leaderboard
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const { data: monthlyData } = await supabase
        .from("enrollments")
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            xp,
            level
          )
        `)
        .gte("updated_at", monthAgo.toISOString())
        .eq("completed", true);

      const monthlyMap = new Map();
      monthlyData?.forEach((enrollment: any) => {
        const profile = enrollment.profiles;
        if (!monthlyMap.has(profile.id)) {
          monthlyMap.set(profile.id, {
            ...profile,
            achievements_count: 0,
            courses_completed: 1
          });
        } else {
          const existing = monthlyMap.get(profile.id);
          existing.courses_completed += 1;
        }
      });
      
      const monthlyArray = Array.from(monthlyMap.values())
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 20);
      
      setMonthlyLeaders(monthlyArray);

    } catch (error) {
      console.error("Error fetching leaderboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank + 1}</span>;
    }
  };

  const getLevelProgress = (xp: number, level: number) => {
    const xpForNextLevel = level * 1000;
    const currentLevelXp = (level - 1) * 1000;
    const progress = ((xp - currentLevelXp) / (xpForNextLevel - currentLevelXp)) * 100;
    return Math.min(progress, 100);
  };

  const toggleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!user) {
      toast.error("Please log in to follow users");
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);
        toast.success("Unfollowed user");
      } else {
        await supabase
          .from("user_follows")
          .insert({
            follower_id: user.id,
            following_id: userId
          });
        toast.success("Following user!");
      }
      fetchLeaderboards();
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const renderLeaderboard = (leaders: LeaderboardUser[]) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (leaders.length === 0) {
      return (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No data available yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {leaders.map((user, index) => (
          <Card key={user.id} className={`border-border/50 ${index < 3 ? "border-primary/20" : ""}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>
                
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">
                    {user.full_name?.charAt(0) || "?"}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{user.full_name}</h3>
                    <Badge variant="outline" className="text-xs">
                      Level {user.level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {user.xp} XP
                    </span>
                    <span>•</span>
                    <span>{user.courses_completed} courses</span>
                    <span>•</span>
                    <span>{user.achievements_count} achievements</span>
                  </div>
                  <Progress value={getLevelProgress(user.xp, user.level)} className="mt-2 h-1" />
                  {user.followers_count !== undefined && (
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-sm text-muted-foreground">
                        {user.followers_count} followers
                      </span>
                      {user.id !== (user as any).currentUserId && (
                        <Button
                          size="sm"
                          variant={user.is_following ? "outline" : "default"}
                          onClick={() => toggleFollow(user.id, user.is_following || false)}
                          className="h-7 text-xs"
                        >
                          {user.is_following ? (
                            <>
                              <UserMinus className="h-3 w-3 mr-1" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Compete with fellow learners and climb to the top
            </p>
          </div>

          <Tabs defaultValue="all-time" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all-time">All Time</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
            </TabsList>

            <TabsContent value="all-time">
              {renderLeaderboard(allTimeLeaders)}
            </TabsContent>

            <TabsContent value="weekly">
              {renderLeaderboard(weeklyLeaders)}
            </TabsContent>

            <TabsContent value="monthly">
              {renderLeaderboard(monthlyLeaders)}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Leaderboard;
