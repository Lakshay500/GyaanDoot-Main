import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token!);
    if (userError || !user) throw new Error('Unauthorized');

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        progress,
        completed,
        courses!inner(category, level, tags)
      `)
      .eq('user_id', user.id);

    const { data: quizResults } = await supabase
      .from('quiz_results')
      .select('percentage, enrollment_id')
      .in('enrollment_id', enrollments?.map(e => e.id) || []);

    // Get all available courses
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, title, description, category, level, tags')
      .eq('is_published', true)
      .not('id', 'in', `(${enrollments?.map(e => e.course_id).join(',') || 'null'})`);

    // Build context for AI
    const completedEnrollments = enrollments?.filter(e => e.completed) || [];
    const firstCourse = enrollments?.[0];
    
    const userContext = {
      completed_categories: completedEnrollments.map(e => (e.courses as any).category),
      preferred_level: firstCourse ? (firstCourse.courses as any).level : 'beginner',
      avg_quiz_score: quizResults && quizResults.length > 0 
        ? quizResults.reduce((sum, r) => sum + r.percentage, 0) / quizResults.length 
        : 0,
      interests: [...new Set(enrollments?.flatMap(e => (e.courses as any).tags || []) || [])]
    };

    // Generate recommendations using AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an educational course recommender. Analyze user learning patterns and recommend relevant courses from the available list.'
          },
          {
            role: 'user',
            content: `User Profile:\n${JSON.stringify(userContext, null, 2)}\n\nAvailable Courses:\n${JSON.stringify(allCourses, null, 2)}\n\nRecommend 5 courses that best match this user's learning pattern, considering their completed categories, skill level, quiz performance, and interests. Return ONLY a JSON array of course IDs in order of relevance.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'recommend_courses',
            description: 'Return recommended course IDs',
            parameters: {
              type: 'object',
              properties: {
                course_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of recommended course IDs in order of relevance'
                }
              },
              required: ['course_ids'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'recommend_courses' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const recommendedIds = toolCall ? JSON.parse(toolCall.function.arguments).course_ids : [];

    // Get full course details
    const { data: recommendedCourses } = await supabase
      .from('courses')
      .select('*')
      .in('id', recommendedIds);

    // Cache recommendations
    await supabase
      .from('course_recommendations_cache')
      .upsert({
        user_id: user.id,
        recommended_courses: recommendedCourses,
        generated_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ recommendations: recommendedCourses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
