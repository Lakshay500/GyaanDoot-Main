import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Zap, Target, Star, Award, BookOpen, MessageCircle, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  progress: number;
  total: number;
  earned: boolean;
}

export const GamificationBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  useEffect(() => {
    if (user) fetchBadges();
  }, [user]);

  const fetchBadges = async () => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user!.id)
        .single();

      if (profile) {
        setUserXP(profile.xp || 0);
        setUserLevel(profile.level || 1);
      }

      // Fetch user achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, achievements(*)")
        .eq("user_id", user!.id);

      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .order("xp_reward", { ascending: true });

      // Calculate progress for each badge
      const enrichedBadges = await Promise.all(
        (allAchievements || []).map(async (achievement) => {
          const earned = userAchievements?.some(ua => ua.achievement_id === achievement.id);
          let progress = 0;
          let total = 1;

          // Calculate progress based on achievement type
          if (achievement.category === "course_completion") {
            const { data: enrollments } = await supabase
              .from("enrollments")
              .select("id")
              .eq("user_id", user!.id)
              .eq("completed", true);
            progress = enrollments?.length || 0;
            total = 10; // Example: complete 10 courses
          } else if (achievement.category === "quiz_master") {
            const { data: quizResults } = await supabase
              .from("quiz_results")
              .select("percentage")
              .gte("percentage", 90);
            progress = quizResults?.length || 0;
            total = 5;
          } else if (achievement.category === "social") {
            const { data: followers } = await supabase
              .from("user_follows")
              .select("id")
              .eq("following_id", user!.id);
            progress = followers?.length || 0;
            total = 50;
          }

          return {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon || "trophy",
            xp_reward: achievement.xp_reward || 0,
            progress: earned ? total : progress,
            total,
            earned
          };
        })
      );

      setBadges(enrichedBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      trophy: Trophy,
      zap: Zap,
      target: Target,
      star: Star,
      award: Award,
      book: BookOpen,
      message: MessageCircle,
      users: Users
    };
    const Icon = icons[iconName] || Trophy;
    return <Icon className="h-8 w-8" />;
  };

  const xpForNextLevel = userLevel * 1000;
  const levelProgress = (userXP % 1000) / 10;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Level {userLevel} • {userXP} XP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {userLevel}</span>
              <span>Level {userLevel + 1}</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {xpForNextLevel - (userXP % 1000)} XP until next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges & Achievements</CardTitle>
          <CardDescription>
            {badges.filter(b => b.earned).length} of {badges.length} earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${badge.earned ? "border-primary" : "opacity-60"}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={badge.earned ? "text-primary" : "text-muted-foreground"}>
                        {getIcon(badge.icon)}
                      </div>
                      {badge.earned && (
                        <Badge variant="default">Earned</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{badge.name}</CardTitle>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress 
                        value={(badge.progress / badge.total) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {badge.progress} / {badge.total}
                        </span>
                        <span className="text-primary font-semibold">
                          +{badge.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
