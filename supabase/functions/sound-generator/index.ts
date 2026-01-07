import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SoundGeneratorRequest {
  prompt: string;
  duration?: number;
  type?: 'sound-effect' | 'music' | 'speech';
  text?: string;
  voicePreset?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const params: SoundGeneratorRequest = await req.json();
    const { prompt, duration = 10, type = 'sound-effect', text, voicePreset } = params;

    console.log(`Generating sound: type=${type}, prompt=${prompt}`);

    let endpoint: string;
    let body: Record<string, unknown>;

    switch (type) {
      case 'music':
        // Use MusicGen for music generation
        endpoint = 'https://fal.run/fal-ai/musicgen';
        body = {
          prompt,
          duration,
          model_version: 'stereo-melody-large',
        };
        break;
      case 'speech':
        // Use F5-TTS for speech generation
        endpoint = 'https://queue.fal.run/fal-ai/f5-tts';
        body = {
          gen_text: text || prompt,
          model_type: 'F5-TTS',
        };
        break;
      case 'sound-effect':
      default:
        // Use Stable Audio for sound effects
        endpoint = 'https://fal.run/fal-ai/stable-audio';
        body = {
          prompt,
          seconds_total: Math.min(duration, 47),
          seconds_start: 0,
        };
        break;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sound generation API error:', response.status, errorText);
      throw new Error(`Sound generation API error: ${response.status}`);
    }

    let result;
    const responseData = await response.json();

    // Handle queue-based requests
    if (responseData.request_id) {
      const requestId = responseData.request_id;
      console.log(`Sound generation job submitted, request_id: ${requestId}`);

      // Poll for completion
      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const resultResponse = await fetch(`${endpoint}/requests/${requestId}`, {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`,
          },
        });

        if (resultResponse.ok) {
          const data = await resultResponse.json();
          if (data.audio_url || data.audio?.url || data.audio_file?.url) {
            result = data;
            break;
          }
        }
      }

      if (!result) {
        throw new Error('Sound generation timed out');
      }
    } else {
      result = responseData;
    }

    const audioUrl = result.audio_url?.url || result.audio_url || 
                     result.audio?.url || result.audio_file?.url ||
                     result.output?.url;

    if (!audioUrl) {
      console.error('Result structure:', JSON.stringify(result));
      throw new Error('No audio URL in result');
    }

    return new Response(
      JSON.stringify({ audioUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating sound:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});