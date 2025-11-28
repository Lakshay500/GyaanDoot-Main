import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { essay, checkType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    
    switch (checkType) {
      case 'grammar':
        systemPrompt = 'You are an expert grammar checker. Analyze the essay for grammatical errors, punctuation mistakes, and spelling issues. Provide specific corrections with line numbers and explanations.';
        break;
      case 'plagiarism':
        systemPrompt = 'You are a plagiarism detection assistant. Analyze the essay for potential plagiarism indicators, unoriginal content patterns, and provide suggestions for proper citations. Note: This is a preliminary check, not a full plagiarism scan.';
        break;
      case 'structure':
        systemPrompt = 'You are an essay structure expert. Analyze the essay\'s organization, thesis clarity, paragraph coherence, transitions, and overall flow. Provide actionable feedback on improving structure.';
        break;
      case 'style':
        systemPrompt = 'You are a writing style coach. Analyze the essay\'s tone, voice, word choice, sentence variety, and clarity. Provide suggestions to enhance writing style and engagement.';
        break;
      default:
        systemPrompt = 'You are a comprehensive essay reviewer. Analyze grammar, structure, style, and coherence. Provide detailed, constructive feedback with specific examples and suggestions for improvement.';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze this essay:\n\n${essay}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in essay-checker:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
