import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  user_id: string;
  username: string;
  cursor?: { x: number; y: number };
  color: string;
}

export const usePresence = (roomId: string) => {
  const [presenceStates, setPresenceStates] = useState<Record<string, PresenceState>>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const userColors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#06b6d4',
    ];

    const randomColor = userColors[Math.floor(Math.random() * userColors.length)];

    const presenceChannel = supabase.channel(`presence:${roomId}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setPresenceStates(state as any);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single();

          await presenceChannel.track({
            user_id: user?.id || 'anonymous',
            username: profile?.full_name || 'Anonymous',
            color: randomColor,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [roomId]);

  const updateCursor = async (x: number, y: number) => {
    if (channel) {
      const currentState = channel.presenceState();
      const userId = await supabase.auth.getSession().then(({ data }) => data.session?.user?.id);
      const userState = currentState[userId || ''];

      if (userState) {
        await channel.track({
          ...userState,
          cursor: { x, y },
        });
      }
    }
  };

  return { presenceStates, updateCursor };
};
