import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LipSyncRequest {
  imageUrl: string;
  audioUrl?: string;
  text?: string;
  voiceId?: string;
  model?: 'sync-lipsync' | 'kling-lipsync';
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

    const params: LipSyncRequest = await req.json();
    const { imageUrl, audioUrl, text, voiceId, model = 'sync-lipsync' } = params;

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    if (!audioUrl && !text) {
      throw new Error('Either audioUrl or text is required');
    }

    console.log(`Generating lip sync: model=${model}, hasAudio=${!!audioUrl}, hasText=${!!text}`);

    let endpoint: string;
    let body: Record<string, unknown>;

    // If text is provided but no audio, we need to generate audio first
    let finalAudioUrl = audioUrl;

    if (text && !audioUrl) {
      // Use fal.ai TTS to generate audio
      console.log('Generating TTS audio...');
      const ttsResponse = await fetch('https://queue.fal.run/fal-ai/f5-tts', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gen_text: text,
          model_type: 'F5-TTS',
        }),
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error('TTS error:', errorText);
        throw new Error('Failed to generate TTS audio');
      }

      const ttsData = await ttsResponse.json();
      const ttsRequestId = ttsData.request_id;

      // Poll for TTS completion
      let ttsResult = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusRes = await fetch(`https://queue.fal.run/fal-ai/f5-tts/requests/${ttsRequestId}`, {
          headers: { 'Authorization': `Key ${FAL_API_KEY}` },
        });
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.audio_url) {
            ttsResult = data;
            break;
          }
        }
      }

      if (!ttsResult?.audio_url) {
        throw new Error('TTS generation timed out');
      }

      finalAudioUrl = ttsResult.audio_url.url || ttsResult.audio_url;
      console.log('TTS audio generated:', finalAudioUrl);
    }

    // Now do lip sync
    switch (model) {
      case 'kling-lipsync':
        endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1/lipsync';
        body = {
          face_image_url: imageUrl,
          audio_url: finalAudioUrl,
        };
        break;
      case 'sync-lipsync':
      default:
        endpoint = 'https://queue.fal.run/fal-ai/sync-lipsync';
        body = {
          image_url: imageUrl,
          audio_url: finalAudioUrl,
          sync_mode: 'smooth',
        };
        break;
    }

    // Submit lip sync job
    const submitResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Lip sync API error:', submitResponse.status, errorText);
      throw new Error(`Lip sync API error: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`Lip sync job submitted, request_id: ${requestId}`);

    // Poll for completion
    let result = null;
    for (let i = 0; i < 120; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const resultResponse = await fetch(`${endpoint}/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (resultResponse.ok) {
        const data = await resultResponse.json();
        if (data.video?.url || data.video_url) {
          result = data;
          break;
        }
      }
    }

    if (!result) {
      throw new Error('Lip sync generation timed out');
    }

    const videoUrl = result.video?.url || result.video_url;

    return new Response(
      JSON.stringify({ videoUrl, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating lip sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});