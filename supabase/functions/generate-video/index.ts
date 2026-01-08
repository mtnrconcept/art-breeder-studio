import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoRequest {
  type: 'text-to-video' | 'image-to-video';
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: 'kling' | 'minimax' | 'veo3';
}

// Build hyper-precise prompts for cinematic video generation
function buildTextToVideoPrompt(userPrompt: string, aspectRatio: string): string {
  const orientation = aspectRatio === '9:16' 
    ? 'vertical framing optimized for mobile/social media viewing, subject centered with headroom'
    : aspectRatio === '1:1'
    ? 'square format with balanced composition, subject centered'
    : 'cinematic widescreen horizontal framing with rule of thirds composition';

  return `Create a cinematic, high-production-value video:

SCENE: ${userPrompt}

CINEMATOGRAPHY:
- ${orientation}
- Professional camera work with smooth, deliberate movements
- Rack focus and depth of field for cinematic look
- Golden hour or dramatic studio lighting
- Natural motion blur matching 180-degree shutter rule

VISUAL QUALITY:
- 4K ultra-high definition clarity
- Photorealistic textures and materials
- Rich, film-grade color grading
- Zero noise, artifacts, or digital distortions
- Physically accurate motion and physics

MOTION:
- Fluid, organic movements
- Consistent 24fps cinematic cadence
- Natural acceleration and deceleration
- No stuttering, warping, or morphing artifacts

OUTPUT: Broadcast-quality footage suitable for professional use.`;
}

function buildImageToVideoPrompt(userPrompt: string): string {
  return `Animate this image into cinematic video while preserving its exact visual identity:

MOTION DIRECTIVE: ${userPrompt}

PRESERVATION REQUIREMENTS:
- Maintain exact colors, lighting, and style of source image
- Preserve all facial features and proportions perfectly
- Keep original composition and framing intact
- Match the artistic intent and mood

ANIMATION GUIDELINES:
- Create subtle, organic movements that feel natural
- Add ambient motion: hair sway, fabric movement, atmospheric particles
- Implement realistic physics for all moving elements
- Use gentle depth-of-field shifts for dimensionality
- Include micro-movements for lifelike quality

QUALITY STANDARDS:
- Zero morphing distortions or warping
- No identity drift or feature changes
- Seamless frame-to-frame consistency
- Professional motion blur appropriate to movement speed
- Film-grade temporal coherence

OUTPUT: A living photograph with cinematic motion.`;
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

    const params: VideoRequest = await req.json();
    const { type, prompt, imageUrl, duration = 5, aspectRatio = '16:9', model = 'veo3' } = params;

    console.log(`Generating video: type=${type}, model=${model}, duration=${duration}s`);

    let endpoint: string;
    let body: Record<string, unknown>;

    if (type === 'text-to-video') {
      const enhancedPrompt = buildTextToVideoPrompt(prompt, aspectRatio);
      
      switch (model) {
        case 'minimax':
          endpoint = 'https://queue.fal.run/fal-ai/minimax-video';
          body = {
            prompt: enhancedPrompt,
            prompt_optimizer: true,
          };
          break;
        case 'kling':
          endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/pro/text-to-video';
          body = {
            prompt: enhancedPrompt,
            duration: duration === 5 ? '5' : '10',
            aspect_ratio: aspectRatio,
          };
          break;
        case 'veo3':
        default:
          // Google Veo 3.1 - Latest and best quality
          endpoint = 'https://queue.fal.run/fal-ai/veo3';
          body = {
            prompt: enhancedPrompt,
            aspect_ratio: aspectRatio,
            duration: `${duration}s`,
            resolution: '1080p',
          };
          break;
      }
    } else if (type === 'image-to-video') {
      if (!imageUrl) {
        throw new Error('imageUrl is required for image-to-video');
      }

      const enhancedPrompt = buildImageToVideoPrompt(prompt);

      switch (model) {
        case 'minimax':
          endpoint = 'https://queue.fal.run/fal-ai/minimax-video/image-to-video';
          body = {
            prompt: enhancedPrompt,
            image_url: imageUrl,
            prompt_optimizer: true,
          };
          break;
        case 'kling':
          endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1.6/pro/image-to-video';
          body = {
            prompt: enhancedPrompt,
            image_url: imageUrl,
            duration: duration === 5 ? '5' : '10',
            aspect_ratio: aspectRatio,
          };
          break;
        case 'veo3':
        default:
          // Google Veo 3.1 image-to-video
          endpoint = 'https://queue.fal.run/fal-ai/veo3/image-to-video';
          body = {
            prompt: enhancedPrompt,
            image_url: imageUrl,
            aspect_ratio: aspectRatio,
            resolution: '1080p',
          };
          break;
      }
    } else {
      throw new Error('Invalid video generation type');
    }

    console.log(`Using endpoint: ${endpoint}`);

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
      console.error('FAL API error:', submitResponse.status, errorText);
      throw new Error(`FAL API error: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`Job submitted, request_id: ${requestId}`);

    // Poll for completion
    let result = null;
    const maxAttempts = 180; // 15 minutes max for high-quality renders

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(`${endpoint}/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        
        if (data.video?.url || data.video_url) {
          result = data;
          console.log(`Video generation completed at attempt ${attempts + 1}`);
          break;
        }
        
        if (data.status === 'FAILED') {
          throw new Error('Video generation failed');
        }
      }
    }

    if (!result) {
      throw new Error('Video generation timed out');
    }

    const videoUrl = result.video?.url || result.video_url || result.output?.video_url;

    if (!videoUrl) {
      console.error('Result structure:', JSON.stringify(result));
      throw new Error('No video URL in result');
    }

    return new Response(
      JSON.stringify({ videoUrl, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
