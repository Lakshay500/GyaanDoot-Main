import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  active_date: string;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  challenge: Challenge;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const fetchChallenges = async () => {
    if (!user) return;

    try {
      // Get today's challenges
      const { data: dailyChallenges, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('active_date', new Date().toISOString().split('T')[0]);

      if (challengesError) throw challengesError;

      // Get user's progress on these challenges
      const { data: userChallenges, error: userError } = await supabase
        .from('user_challenges')
        .select('*, challenge:daily_challenges(*)')
        .eq('user_id', user.id)
        .in('challenge_id', dailyChallenges?.map(c => c.id) || []);

      if (userError) throw userError;

      // Create user challenge entries for any missing ones
      const existingChallengeIds = new Set(userChallenges?.map(uc => uc.challenge_id) || []);
      const missingChallenges = dailyChallenges?.filter(c => !existingChallengeIds.has(c.id)) || [];

      if (missingChallenges.length > 0) {
        const { data: newUserChallenges } = await supabase
          .from('user_challenges')
          .insert(
            missingChallenges.map(c => ({
              user_id: user.id,
              challenge_id: c.id,
              progress: 0,
              completed: false,
            }))
          )
          .select('*, challenge:daily_challenges(*)');

        setChallenges([...(userChallenges || []), ...(newUserChallenges || [])] as UserChallenge[]);
      } else {
        setChallenges(userChallenges as UserChallenge[] || []);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (challengeId: string, progress: number) => {
    if (!user) return;

    const challenge = challenges.find(c => c.challenge_id === challengeId);
    if (!challenge) return;

    const isCompleted = progress >= challenge.challenge.target_value;

    const { error } = await supabase
      .from('user_challenges')
      .update({
        progress,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', challenge.id);

    if (error) {
      console.error('Error updating challenge progress:', error);
      return;
    }

    if (isCompleted && !challenge.completed) {
      // Award XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', user.id)
        .single();

      if (profile) {
        const newXP = (profile.xp || 0) + challenge.challenge.xp_reward;
        const newLevel = Math.floor(newXP / 1000) + 1;

        await supabase
          .from('profiles')
          .update({ xp: newXP, level: newLevel })
          .eq('id', user.id);

        toast.success(`Challenge completed! +${challenge.challenge.xp_reward} XP`);
      }
    }

    fetchChallenges();
  };

  return { challenges, loading, updateProgress };
};
