import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  style?: string;
  baseImageUrl?: string;
  baseImages?: string[];
  maskImageUrl?: string;
  type?: 'text2img' | 'compose' | 'splice' | 'portrait' | 'pattern' | 'outpaint' | 'tune' | 'inpaint' | 'style-transfer' | 'backdrop' | 'relight';
  styleStrength?: number;
  contentStrength?: number;
  patternImageUrl?: string;
  direction?: string;
  expansionAmount?: number;
  userId?: string;
}

// Try API call with fallback
async function callGeminiAPI(endpoint: string, body: object): Promise<Response> {
  const apiKey1 = Deno.env.get('GEMINI_API_KEY');
  const apiKey2 = Deno.env.get('GEMINI_API_KEY_2');

  if (!apiKey1 && !apiKey2) {
    throw new Error('No Gemini API keys configured');
  }

  const keys = [apiKey1, apiKey2].filter(Boolean) as string[];

  const endpoints = [
    endpoint,
    endpoint.replace('aiplatform.googleapis.com/v1/publishers/google', 'generativelanguage.googleapis.com/v1beta')
  ];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    for (const baseEndpoint of endpoints) {
      const url = `${baseEndpoint}?key=${key}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      };

      try {
        console.log(`[callGeminiAPI] Attempt ${i + 1} on ${baseEndpoint.includes('aiplatform') ? 'Vertex' : 'AI Studio'}`);
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (response.ok) {
          return response;
        }

        const errorData = await response.text();
        console.warn(`[callGeminiAPI] Failed (${response.status}) on ${baseEndpoint.split('/')[2]}:`, errorData);

        if (response.status === 429) break; // Quota hit, try next key
        if (response.status === 401 || response.status === 403 || response.status === 404) continue; // Try other endpoint

        return new Response(errorData, { status: response.status });
      } catch (error) {
        console.error(`Network error on ${baseEndpoint}:`, error);
      }
    }
  }

  throw new Error('All API keys failed');
}

function buildPrompt(params: GenerateRequest): string {
  const { type, prompt, style } = params;
  const stylePrefix = style ? `Style: ${style}. ` : '';

  switch (type) {
    case 'compose':
      return `${stylePrefix}Create an artistic image based on this description: ${prompt}. 
The image should blend the visual elements precisely according to the composition described.
Use high-quality artistic rendering with attention to lighting, color harmony, and visual balance.`;

    case 'splice':
      return `Crossbreed and splice these images together to create a hybrid artwork.
Blend the visual DNA of each image: combine their colors, textures, shapes, and features.
${prompt}
The result should look like a natural hybrid, not a collage.`;

    case 'portrait':
      return `${stylePrefix}Generate a photorealistic portrait: ${prompt}.
Create a high-quality face with natural skin texture, realistic lighting, and proper anatomy.
Studio-quality lighting, natural expression, no AI artifacts.`;

    case 'pattern':
      return `Transform using the provided pattern as a style guide.
Apply the pattern's colors, textures, and visual rhythm to create: ${prompt}.
The pattern should influence the overall aesthetic and color palette.`;

    case 'outpaint':
      return `Expand this image beyond its current borders.
${prompt}
Continue the scene naturally:
- Match the exact art style, color palette, and lighting
- Maintain perspective and extend textures seamlessly
- No visible seams between original and extended areas`;

    case 'tune':
      return `Enhance and adjust this image: ${prompt}.
Apply adjustments while preserving the original subject.
Improve quality: sharpen details, optimize contrast, enhance colors naturally.`;

    case 'inpaint':
      return `Replace the masked area with: ${prompt}.
Seamlessly blend with the surrounding image.
Match lighting, perspective, and style perfectly.`;

    case 'style-transfer':
      return `${stylePrefix}Apply this artistic style to the image: ${prompt}.
Transform the content while preserving the structure and composition.
The result should look like it was originally created in this style.`;

    case 'backdrop':
      return `Change the background to: ${prompt}.
Keep the subject perfectly extracted with natural edges.
Blend lighting and shadows to match the new environment.`;

    case 'relight':
      return `Relight this scene: ${prompt}.
Adjust shadows, highlights, and color temperature naturally.
Maintain the subject's appearance while changing the illumination.`;

    default:
      return `${stylePrefix}Create a high-quality artistic image: ${prompt}. 
Professional digital art with excellent composition, lighting, and detail.`;
  }
}

async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  imageData: string,
  userId: string,
  type: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${userId}/${type}/${timestamp}.png`;

  // Convert base64 to Uint8Array
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  const { data, error } = await supabase.storage
    .from('generations')
    .upload(fileName, binaryData, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload image to storage');
  }

  const { data: urlData } = supabase.storage
    .from('generations')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: GenerateRequest = await req.json();
    const enhancedPrompt = buildPrompt(params);

    console.log(`[generate-image] Type: ${params.type || 'default'}, Prompt: ${enhancedPrompt.substring(0, 100)}...`);

    // Build the request for Imagen 4 Ultra
    const requestBody: any = {
      instances: [{ prompt: enhancedPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: params.aspectRatio || "1:1",
        personGeneration: "allow_adult",
        safetyFilterLevel: "block_few",
      }
    };

    // Add negative prompt if provided
    if (params.negativePrompt) {
      requestBody.instances[0].negativePrompt = params.negativePrompt;
    }

    // Add reference image for editing operations
    if (params.baseImageUrl) {
      requestBody.instances[0].image = { bytesBase64Encoded: params.baseImageUrl.split(',')[1] || params.baseImageUrl };
    }

    // Add mask for inpainting
    if (params.maskImageUrl) {
      requestBody.instances[0].mask = { bytesBase64Encoded: params.maskImageUrl.split(',')[1] || params.maskImageUrl };
    }

    // Call Nano Banana Pro (Gemini 3 Image) API via AI Studio endpoint
    const response = await callGeminiAPI(
      'https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro:predict',
      requestBody
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-image] API error ${response.status}:`, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Imagen API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedImage = data.predictions?.[0]?.bytesBase64Encoded;

    if (!generatedImage) {
      console.error('[generate-image] No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    // Upload to Supabase Storage if userId provided
    let imageUrl = `data:image/png;base64,${generatedImage}`;

    if (params.userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      try {
        imageUrl = await uploadToStorage(supabase, imageUrl, params.userId, params.type || 'text2img');
        console.log(`[generate-image] Uploaded to storage: ${imageUrl}`);
      } catch (uploadError) {
        console.error('[generate-image] Storage upload failed, returning base64:', uploadError);
        // Continue with base64 URL if upload fails
      }
    }

    console.log(`[generate-image] Success!`);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[generate-image] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
