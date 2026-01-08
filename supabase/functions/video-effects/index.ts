import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoEffectsRequest {
  videoUrl?: string;
  imageUrl?: string;
  effect: 'style-transfer' | 'slow-motion' | 'loop' | 'reverse' | 'depth' | 'camera-motion';
  prompt?: string;
  cameraMotion?: {
    horizontal?: number;
    vertical?: number;
    zoom?: number;
    tilt?: number;
    pan?: number;
    roll?: number;
  };
}

// Build hyper-precise prompts for each video effect
function buildEffectPrompt(effect: string, userPrompt?: string, cameraMotion?: VideoEffectsRequest['cameraMotion']): string {
  switch (effect) {
    case 'camera-motion':
      const motionDesc = [];
      if (cameraMotion?.horizontal) motionDesc.push(`horizontal ${cameraMotion.horizontal > 0 ? 'right' : 'left'} pan`);
      if (cameraMotion?.vertical) motionDesc.push(`vertical ${cameraMotion.vertical > 0 ? 'up' : 'down'} tilt`);
      if (cameraMotion?.zoom) motionDesc.push(`${cameraMotion.zoom > 0 ? 'zoom in' : 'zoom out'}`);
      if (cameraMotion?.roll) motionDesc.push(`${cameraMotion.roll > 0 ? 'clockwise' : 'counter-clockwise'} roll`);
      
      return `Apply professional camera movement to this image:

CAMERA MOTION: ${motionDesc.length > 0 ? motionDesc.join(', ') : 'smooth dolly movement'}
${userPrompt ? `SCENE DIRECTION: ${userPrompt}` : ''}

CINEMATOGRAPHY REQUIREMENTS:
- Smooth, professional-grade camera movement
- Natural acceleration and deceleration curves
- Parallax depth effect for 3D dimensionality
- Steady, stabilized motion without shake
- Maintain focus throughout movement
- Film-quality motion blur

OUTPUT: Cinematic camera movement like a Hollywood production.`;

    case 'style-transfer':
      return `Transform this image into a cinematic video with artistic style:

STYLE DIRECTION: ${userPrompt || 'cinematic, artistic, visually stunning'}

STYLE TRANSFER REQUIREMENTS:
- Maintain original composition and subject recognition
- Apply style consistently across all frames
- No flickering or temporal inconsistency
- Smooth transitions between stylized elements
- Preserve spatial coherence and depth
- Professional color grading matching style

ANIMATION GUIDELINES:
- Subtle, organic motion that enhances the style
- Ambient movements: atmospheric particles, light shifts
- Gentle camera drift for dynamism
- 5-second runtime with smooth looping potential

OUTPUT: Living artwork with consistent artistic vision.`;

    case 'slow-motion':
      return `Create dramatic slow-motion video from this image:

${userPrompt ? `SCENE: ${userPrompt}` : 'Animate with dramatic slow-motion movement'}

SLOW-MOTION REQUIREMENTS:
- Buttery smooth 120fps interpolated to 24fps
- Preserve motion blur at reduced playback speed
- Zero ghosting or frame duplication artifacts
- Dramatic time-stretching effect
- Maintain sharp detail throughout
- Natural physics at reduced speed

MOTION DIRECTION:
- Flowing, graceful movement
- Emphasize dramatic moments
- Hair, fabric, particles in slow cascade
- Cinematic impact and emotion

OUTPUT: Professional slow-motion footage like high-speed camera capture.`;

    case 'loop':
      return `Create a seamless infinite loop video from this image:

${userPrompt ? `MOTION: ${userPrompt}` : 'Create subtle, mesmerizing looping motion'}

SEAMLESS LOOP REQUIREMENTS:
- Perfect frame 1 to frame last matching
- Invisible transition point
- Continuous flow with no jump cuts
- Forward motion only (no ping-pong)
- Natural rhythm and timing
- Hypnotic, satisfying loop

MOTION STYLE:
- Organic, breathing movement
- Ambient environmental motion
- Subtle subject animation
- Perpetual motion aesthetic

OUTPUT: Cinemagraph-quality seamless loop for infinite playback.`;

    case 'depth':
      return `Generate accurate depth map for 3D parallax animation:

DEPTH ANALYSIS REQUIREMENTS:
- Precise near-to-far depth gradient
- Clear foreground/midground/background separation
- Accurate edge detection on subjects
- Smooth depth transitions
- Handle transparent and reflective surfaces
- Sub-pixel accuracy on depth boundaries

OUTPUT: High-precision depth map for professional 3D effects.`;

    case 'reverse':
      return `Create dramatic reverse-motion video from this image:

${userPrompt ? `SCENE: ${userPrompt}` : 'Animate with motion designed to play beautifully in reverse'}

REVERSE MOTION REQUIREMENTS:
- Design movement that looks intentional when reversed
- Gravity-defying motion effects
- Objects assembling or reforming
- Dramatic revelation moments
- Clean, artifact-free playback
- Natural-looking reverse physics

OUTPUT: Mesmerizing reverse-motion video with surreal quality.`;

    default:
      return userPrompt || 'Create smooth, cinematic animation with professional quality';
  }
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

    const params: VideoEffectsRequest = await req.json();
    const { videoUrl, imageUrl, effect, prompt, cameraMotion } = params;

    if (!videoUrl && !imageUrl) {
      throw new Error('Either videoUrl or imageUrl is required');
    }

    console.log(`Applying effect: ${effect}`);

    let endpoint: string;
    let body: Record<string, unknown>;
    const enhancedPrompt = buildEffectPrompt(effect, prompt, cameraMotion);

    switch (effect) {
      case 'camera-motion':
        if (!imageUrl) throw new Error('imageUrl is required for camera motion');
        
        // Use Kling Pro for best camera motion quality
        endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/pro/image-to-video';
        body = {
          image_url: imageUrl,
          prompt: enhancedPrompt,
          duration: '5',
          camera_control: {
            type: 'custom',
            horizontal: cameraMotion?.horizontal || 0,
            vertical: cameraMotion?.vertical || 0,
            zoom: cameraMotion?.zoom || 0,
            tilt: cameraMotion?.tilt || 0,
            pan: cameraMotion?.pan || 0,
            roll: cameraMotion?.roll || 0,
          },
        };
        break;

      case 'depth':
        if (!imageUrl) throw new Error('imageUrl is required for depth effect');
        endpoint = 'https://fal.run/fal-ai/depth-anything-v2';
        body = {
          image_url: imageUrl,
        };
        break;

      case 'style-transfer':
        if (!imageUrl) throw new Error('imageUrl is required for style transfer');
        // Use Veo 3.1 for highest quality style transfer
        endpoint = 'https://queue.fal.run/fal-ai/veo3/image-to-video';
        body = {
          image_url: imageUrl,
          prompt: enhancedPrompt,
          resolution: '1080p',
        };
        break;

      case 'slow-motion':
      case 'loop':
      case 'reverse':
      default:
        if (!imageUrl) throw new Error('imageUrl is required');
        // Use Veo 3.1 for these effects
        endpoint = 'https://queue.fal.run/fal-ai/veo3/image-to-video';
        body = {
          image_url: imageUrl,
          prompt: enhancedPrompt,
          resolution: '1080p',
        };
        break;
    }

    console.log(`Using endpoint: ${endpoint}`);

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
      console.error('Video effects API error:', response.status, errorText);
      throw new Error(`Video effects API error: ${response.status}`);
    }

    const responseData = await response.json();

    // Handle depth map response (non-queue)
    if (effect === 'depth') {
      const depthImageUrl = responseData.image?.url || responseData.depth?.url;
      return new Response(
        JSON.stringify({ imageUrl: depthImageUrl, type: 'depth-map' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle queue-based responses
    if (responseData.request_id) {
      const requestId = responseData.request_id;
      console.log(`Effect job submitted, request_id: ${requestId}`);

      let result = null;
      for (let i = 0; i < 180; i++) {
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
            console.log(`Effect completed at attempt ${i + 1}`);
            break;
          }
        }
      }

      if (!result) {
        throw new Error('Video effect generation timed out');
      }

      const videoResultUrl = result.video?.url || result.video_url;

      return new Response(
        JSON.stringify({ videoUrl: videoResultUrl, requestId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ videoUrl: responseData.video?.url || responseData.video_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error applying video effect:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
