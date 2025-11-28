import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, sessionName } = await req.json();
    
    // Daily.co API endpoint
    const dailyApiKey = Deno.env.get('DAILY_API_KEY');
    
    if (!dailyApiKey) {
      throw new Error('DAILY_API_KEY not configured');
    }

    // Create a Daily.co room
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dailyApiKey}`
      },
      body: JSON.stringify({
        name: `session-${sessionId}`,
        privacy: 'private',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_recording: 'cloud',
          start_video_off: false,
          start_audio_off: false,
          max_participants: 10,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 3) // 3 hours from now
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Daily API error: ${error}`);
    }

    const room = await response.json();

    return new Response(
      JSON.stringify({ 
        roomUrl: room.url,
        roomName: room.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating Daily room:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: 'Failed to create video room. Please ensure DAILY_API_KEY is configured.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
