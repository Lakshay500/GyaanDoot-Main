import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, courseId, courseContent, conversationHistory } = await req.json();
    console.log("Study assistant request:", { question, courseId });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch course details and sections
    const { data: course } = await supabase
      .from("courses")
      .select("title, description")
      .eq("id", courseId)
      .single();

    const { data: sections } = await supabase
      .from("course_sections")
      .select("title, content, description")
      .eq("course_id", courseId)
      .order("order_index");

    // Build context from course content
    let context = `Course: ${course?.title}\nDescription: ${course?.description}\n\n`;
    
    if (sections && sections.length > 0) {
      context += "Course Sections:\n";
      sections.forEach((section, index) => {
        context += `\n${index + 1}. ${section.title}\n`;
        if (section.description) context += `Description: ${section.description}\n`;
        if (section.content) context += `Content: ${section.content.substring(0, 500)}...\n`;
      });
    }

    if (courseContent) {
      context += `\nAdditional Content: ${courseContent}`;
    }

    // Build messages array
    const messages = [
      {
        role: "system",
        content: `You are an AI study assistant helping students learn about "${course?.title}". 
Use the following course content to answer questions accurately and helpfully.
If you don't know the answer based on the course content, be honest about it and suggest general study strategies.

Course Context:
${context}

Guidelines:
- Be concise but informative
- Use examples from the course material when possible
- Break down complex concepts into simpler terms
- Encourage critical thinking
- If the question is outside the course scope, politely redirect to the course topics`,
      },
      ...(conversationHistory || []),
      { role: "user", content: question },
    ];

    console.log("Calling Lovable AI with context length:", context.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || "I couldn't generate a response.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in study-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
