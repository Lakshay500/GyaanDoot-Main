import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export const useStreaks = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStreak();
      subscribeToStreaks();
    }
  }, [user]);

  const fetchStreak = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streak:', error);
        return;
      }

      if (data) {
        setStreak(data);
      } else {
        // Initialize streak for new user
        const { data: newStreak, error: insertError } = await supabase
          .from('daily_streaks')
          .insert({
            user_id: user.id,
            current_streak: 0,
            longest_streak: 0,
          })
          .select()
          .single();

        if (!insertError && newStreak) {
          setStreak(newStreak);
        }
      }
    } catch (error) {
      console.error('Error in fetchStreak:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToStreaks = () => {
    if (!user) return;

    const channel = supabase
      .channel('streak-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_streaks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setStreak(payload.new as Streak);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { streak, loading };
};
