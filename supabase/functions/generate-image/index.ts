import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  prompt: string;
  baseImageUrl?: string;
  baseImages?: string[];
  type?: 'compose' | 'splice' | 'portrait' | 'pattern' | 'outpaint' | 'tune';
  // Composer params
  styleStrength?: number;
  contentStrength?: number;
  // Pattern params  
  patternImageUrl?: string;
  // Outpaint params
  direction?: string;
  expansionAmount?: number;
}

function buildPrompt(params: GenerateRequest): string {
  const { type, prompt } = params;

  switch (type) {
    case 'compose':
      // Composer: Mix images and text with precision - place shapes/images on canvas and describe
      return `Create an artistic image based on this description: ${prompt}. 
The image should blend the visual elements precisely according to the composition described.
Use high-quality artistic rendering with attention to lighting, color harmony, and visual balance.
The result should be a cohesive artwork that matches the creative vision.`;

    case 'splice':
      // Splicer: Mix/crossbreed multiple images together, blending their visual "genes"
      return `Crossbreed and splice these images together to create a hybrid artwork.
Blend the visual DNA of each image: combine their colors, textures, shapes, and features.
Like genetic crossbreeding, merge the distinctive traits from each parent image.
Create a seamless fusion that inherits characteristics from all source images.
${prompt}
The result should look like a natural hybrid, not a collage or overlay.`;

    case 'portrait':
      // Portraits: Generate faces with adjustable genetic sliders (age, expression, features)
      return `Generate a photorealistic portrait with these specifications: ${prompt}.
Create a high-quality face with natural skin texture, realistic lighting, and proper anatomy.
The portrait should have clear facial features, natural eye reflections, and realistic hair.
Use studio-quality lighting that flatters the face. The expression should look natural and genuine.
Avoid any AI artifacts, distortions, or unnatural features.`;

    case 'pattern':
      // Patterns: Combine a pattern/texture with a text description to create styled imagery
      return `Transform this into an image using the provided pattern as a style guide.
Apply the pattern's colors, textures, and visual rhythm to create: ${prompt}.
The pattern should influence the overall aesthetic, color palette, and visual texture.
Create a cohesive artwork where the pattern DNA is visible in every element.
The result should feel like the description was painted using the pattern's visual language.`;

    case 'outpaint':
      // Outpainter: Expand image beyond its borders, continuing the scene naturally
      return `Expand this image beyond its current borders.
${prompt}
Continue the scene naturally in the extended areas:
- Match the exact art style, color palette, and lighting of the original
- Maintain perspective lines and vanishing points
- Extend textures, patterns, and elements seamlessly
- Keep the same level of detail and quality throughout
- The extension should be indistinguishable from the original
- No visible seams or boundaries between original and extended areas`;

    case 'tune':
      // Tuner/Enhancer: Adjust and enhance image qualities (like photo editing on steroids)
      return `Enhance and adjust this image with the following modifications: ${prompt}.
Apply the adjustments while preserving the original subject and composition.
Improve overall quality: sharpen details, optimize contrast, enhance colors naturally.
Remove any noise or artifacts while keeping authentic texture.
The result should look like a professionally retouched version of the original.`;

    default:
      // Default: General text-to-image generation
      return `Create a high-quality artistic image: ${prompt}. 
Style: professional digital art with excellent composition, lighting, and detail.
The image should be visually striking and technically well-executed.`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: GenerateRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const enhancedPrompt = buildPrompt(params);
    console.log(`[generate-image] Type: ${params.type || 'default'}, Prompt length: ${enhancedPrompt.length}`);

    // Build messages array
    const messages: any[] = [];
    
    // Handle different image input scenarios
    if (params.baseImages && params.baseImages.length > 0) {
      // Multiple images (for splicer)
      const content: any[] = [{ type: "text", text: enhancedPrompt }];
      for (const imageUrl of params.baseImages) {
        content.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      messages.push({ role: "user", content });
    } else if (params.baseImageUrl) {
      // Single base image
      const content: any[] = [
        { type: "text", text: enhancedPrompt },
        { type: "image_url", image_url: { url: params.baseImageUrl } }
      ];
      // Add pattern image if provided
      if (params.patternImageUrl) {
        content.push({ type: "image_url", image_url: { url: params.patternImageUrl } });
      }
      messages.push({ role: "user", content });
    } else if (params.patternImageUrl) {
      // Pattern only (no base image)
      messages.push({
        role: "user",
        content: [
          { type: "text", text: enhancedPrompt },
          { type: "image_url", image_url: { url: params.patternImageUrl } }
        ]
      });
    } else {
      // Text only
      messages.push({ role: "user", content: enhancedPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      console.error(`[generate-image] API error: ${response.status}`);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error(`[generate-image] Error response: ${errorText}`);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('[generate-image] No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    console.log(`[generate-image] Success! Generated image URL length: ${imageUrl.length}`);

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
