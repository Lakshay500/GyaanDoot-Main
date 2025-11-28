import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Award } from 'lucide-react';
import { triggerAchievementConfetti } from '@/lib/confetti';
import { playSound } from '@/lib/sounds';

export const useAchievements = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user-achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('New achievement unlocked:', payload);
          
          // Fetch achievement details
          const { data: achievement } = await supabase
            .from('achievements')
            .select('*')
            .eq('id', payload.new.achievement_id)
            .single();

          if (achievement) {
            // Play achievement sound
            playSound('achievement');
            triggerAchievementConfetti();
            toast.success(
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Achievement Unlocked!</p>
                  <p className="text-sm text-muted-foreground">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  {achievement.xp_reward && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Award className="h-3 w-3" /> +{achievement.xp_reward} XP
                    </p>
                  )}
                </div>
              </div>,
              {
                duration: 5000,
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkAchievements = async (type: string, data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('check-achievements', {
        body: { type, data }
      });

      if (error) throw error;

      return result?.achievements || [];
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  return { checkAchievements };
};
