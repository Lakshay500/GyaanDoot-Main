import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MentorPresence {
  mentor_id: string;
  is_online: boolean;
  last_seen: string;
}

export const useMentorPresence = () => {
  const { user } = useAuth();
  const [onlineMentors, setOnlineMentors] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to presence channel
    const channel = supabase.channel('mentor-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.mentor_id) {
              online.add(presence.mentor_id);
            }
          });
        });
        
        setOnlineMentors(online);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineMentors(prev => {
          const updated = new Set(prev);
          newPresences.forEach((p: any) => {
            if (p.mentor_id) updated.add(p.mentor_id);
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineMentors(prev => {
          const updated = new Set(prev);
          leftPresences.forEach((p: any) => {
            if (p.mentor_id) updated.delete(p.mentor_id);
          });
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          // Check if user is a mentor
          const { data: mentorProfile } = await supabase
            .from('mentor_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (mentorProfile) {
            // Track mentor presence
            await channel.track({
              mentor_id: mentorProfile.id,
              user_id: user.id,
              online_at: new Date().toISOString(),
            });

            // Update database presence
            await supabase
              .from('mentor_presence')
              .upsert({
                mentor_id: mentorProfile.id,
                user_id: user.id,
                is_online: true,
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          }
        }
      });

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const isMentorOnline = (mentorId: string) => onlineMentors.has(mentorId);

  return { onlineMentors, isMentorOnline };
};
