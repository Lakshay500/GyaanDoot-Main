import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

interface AchievementCheck {
  id: string;
  condition: (data: any) => boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { type, data } = await req.json();
    console.log('Checking achievements for:', type, data);

    const newAchievements = [];

    // Get user's existing achievements
    const { data: existingAchievements } = await supabaseClient
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const existingIds = new Set(existingAchievements?.map(a => a.achievement_id) || []);

    // Achievement checks based on type
    if (type === 'quiz_completed') {
      const { percentage } = data;
      
      // Perfect Score achievement
      if (percentage === 100 && !existingIds.has('first-perfect-score')) {
        const { data: achievement } = await supabaseClient
          .from('achievements')
          .select('*')
          .eq('category', 'quiz')
          .eq('name', 'Perfect Score')
          .single();
        
        if (achievement) {
          await supabaseClient.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id
          });
          newAchievements.push(achievement);
        }
      }

      // Quiz Master achievement (5 quizzes with >80%)
      if (percentage >= 80) {
        const { count } = await supabaseClient
          .from('quiz_results')
          .select('*', { count: 'exact', head: true })
          .eq('enrollment_id', data.enrollment_id)
          .gte('percentage', 80);

        if (count && count >= 5 && !existingIds.has('quiz-master')) {
          const { data: achievement } = await supabaseClient
            .from('achievements')
            .select('*')
            .eq('category', 'quiz')
            .eq('name', 'Quiz Master')
            .single();
          
          if (achievement) {
            await supabaseClient.from('user_achievements').insert({
              user_id: user.id,
              achievement_id: achievement.id
            });
            newAchievements.push(achievement);
          }
        }
      }
    }

    if (type === 'course_completed') {
      // First Course achievement
      const { count: completedCount } = await supabaseClient
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      if (completedCount === 1 && !existingIds.has('first-course')) {
        const { data: achievement } = await supabaseClient
          .from('achievements')
          .select('*')
          .eq('category', 'course')
          .eq('name', 'First Course')
          .single();
        
        if (achievement) {
          await supabaseClient.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id
          });
          newAchievements.push(achievement);
        }
      }

      // Course Collector (10 courses)
      if (completedCount && completedCount >= 10 && !existingIds.has('course-collector')) {
        const { data: achievement } = await supabaseClient
          .from('achievements')
          .select('*')
          .eq('category', 'course')
          .eq('name', 'Course Collector')
          .single();
        
        if (achievement) {
          await supabaseClient.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id
          });
          newAchievements.push(achievement);
        }
      }

      // Update user XP
      const totalXP = newAchievements.reduce((sum, a) => sum + (a.xp_reward || 0), 0);
      if (totalXP > 0) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('xp, level')
          .eq('id', user.id)
          .single();

        const newXP = (profile?.xp || 0) + totalXP;
        const newLevel = Math.floor(newXP / 1000) + 1;

        await supabaseClient
          .from('profiles')
          .update({ xp: newXP, level: newLevel })
          .eq('id', user.id);
      }
    }

    if (type === 'streak_check') {
      // Early Bird achievement (login before 8am)
      const hour = new Date().getHours();
      if (hour < 8 && !existingIds.has('early-bird')) {
        const { data: achievement } = await supabaseClient
          .from('achievements')
          .select('*')
          .eq('category', 'engagement')
          .eq('name', 'Early Bird')
          .single();
        
        if (achievement) {
          await supabaseClient.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id
          });
          newAchievements.push(achievement);
        }
      }
    }

    return new Response(
      JSON.stringify({ achievements: newAchievements }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking achievements:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
