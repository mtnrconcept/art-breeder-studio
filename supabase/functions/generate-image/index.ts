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
  styleStrength?: number;
  contentStrength?: number;
  patternImageUrl?: string;
  direction?: string;
  expansionAmount?: number;
}

function buildPrompt(params: GenerateRequest): string {
  const { type, prompt, styleStrength = 50, contentStrength = 50, direction, expansionAmount = 25 } = params;

  switch (type) {
    case 'compose':
      return `ARTISTIC COMPOSITION TASK:

Create a masterful artistic composition based on: "${prompt}"

COMPOSITION GUIDELINES:
- Style influence: ${styleStrength}% (${styleStrength > 70 ? 'dominant stylistic interpretation' : styleStrength > 30 ? 'balanced style blend' : 'subtle style hints'})
- Content fidelity: ${contentStrength}% (${contentStrength > 70 ? 'preserve original elements precisely' : contentStrength > 30 ? 'creative interpretation allowed' : 'abstract transformation'})

TECHNICAL REQUIREMENTS:
- Professional color theory with harmonious palette
- Balanced visual weight and golden ratio composition
- Dynamic lighting with natural shadow gradients
- High-frequency detail in focal areas
- Atmospheric depth and perspective accuracy

OUTPUT: Gallery-worthy artwork with cohesive visual narrative.`;

    case 'splice':
      return `GENETIC IMAGE SPLICING TASK:

Crossbreed these images into a seamless hybrid artwork.

FUSION DIRECTIVE: "${prompt}"

SPLICING PROTOCOL:
- Extract dominant visual "genes" from each parent image
- Blend color DNA: merge palettes into unified scheme
- Combine structural elements: shapes, forms, silhouettes
- Fuse texture patterns: surface qualities and materials
- Inherit stylistic traits from all sources proportionally

QUALITY STANDARDS:
- Result must look naturally bred, not digitally collaged
- Seamless transitions between inherited features
- Coherent lighting across all merged elements
- Unified artistic style throughout
- No visible seams, edges, or overlay artifacts

OUTPUT: A new species of image that couldn't exist without all parents.`;

    case 'portrait':
      return `PHOTOREALISTIC PORTRAIT GENERATION:

Create a stunning portrait with specifications: "${prompt}"

FACIAL REQUIREMENTS:
- Anatomically perfect proportions
- Realistic skin texture with subsurface scattering
- Natural pores, subtle imperfections for authenticity
- Lifelike eyes with proper reflections and catchlights
- Natural hair with individual strand detail

LIGHTING & MOOD:
- Professional studio or cinematic lighting
- Soft key light with subtle fill
- Rim lighting for dimensional separation
- Catchlights positioned at 10 and 2 o'clock
- Natural skin tone rendering

TECHNICAL QUALITY:
- Sharp focus on eyes and facial features
- Shallow depth of field for portrait aesthetic
- No uncanny valley artifacts
- Natural expression, not frozen or artificial
- Professional retouching look without over-processing

OUTPUT: Magazine-cover-quality portrait photography.`;

    case 'pattern':
      return `PATTERN-DRIVEN IMAGE SYNTHESIS:

Transform the concept using pattern as visual DNA: "${prompt}"

PATTERN INTEGRATION:
- Extract color palette from pattern source
- Apply rhythmic repetition subtly throughout
- Use pattern motifs as texture layer
- Match pattern's visual energy and mood
- Integrate without obvious tiling

STYLE TRANSFER:
- Pattern dictates color choices
- Original geometry guides composition
- Blend pattern texture with subject matter
- Maintain recognizable subject while pattern-influenced
- Create harmony between pattern and content

OUTPUT: An image that feels painted with the pattern's brush.`;

    case 'outpaint':
      const directionText = direction ? `extending ${direction}` : 'extending in all directions';
      return `SEAMLESS IMAGE EXTENSION TASK:

Expand this image beyond its borders by ${expansionAmount}%, ${directionText}.

EXTENSION REQUIREMENTS:
- EXACT match of original art style and technique
- Perfect continuation of perspective lines
- Seamless lighting gradient across boundaries
- Natural extension of all textures and materials
- Maintain consistent level of detail
- Zero visible seams or joins

CONTENT CONTINUATION:
- ${prompt || 'Continue the scene naturally based on visual context'}
- Logical spatial extension of environment
- Maintain atmospheric perspective and depth
- Extend any ongoing patterns or rhythms
- Preserve color temperature throughout

QUALITY MANDATE:
- Extended areas must be indistinguishable from original
- Perfect edge blending with source image
- No AI artifacts or inconsistencies in extended zones
- Professional quality matching original exactly

OUTPUT: An expanded image that looks originally created at larger size.`;

    case 'tune':
      return `PROFESSIONAL IMAGE ENHANCEMENT TASK:

Apply these adjustments while preserving image integrity: "${prompt}"

ENHANCEMENT PROTOCOL:
- Apply requested modifications precisely
- Maintain original subject and composition
- Preserve artistic intent and mood
- Non-destructive enhancement approach

QUALITY IMPROVEMENTS:
- Optimal contrast and tonal range
- Color accuracy and saturation balance
- Noise reduction with detail preservation
- Sharpening in focus areas only
- Remove compression artifacts

PROFESSIONAL STANDARDS:
- Match high-end photo editing results
- Natural-looking adjustments
- No over-processing or artificial appearance
- Preserve original image character
- Export-ready quality

OUTPUT: Professionally retouched image ready for publication.`;

    default:
      return `Create a stunning, high-quality image: "${prompt}"

REQUIREMENTS:
- Professional artistic execution
- Excellent composition using golden ratio
- Masterful lighting and color harmony
- High level of detail and clarity
- Visually striking and memorable
- Gallery-quality output`;
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
    console.log(`[generate-image] Type: ${params.type || 'default'}, Prompt: ${enhancedPrompt.substring(0, 100)}...`);

    const messages: any[] = [];
    
    if (params.baseImages && params.baseImages.length > 0) {
      const content: any[] = [{ type: "text", text: enhancedPrompt }];
      for (const imageUrl of params.baseImages) {
        content.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      messages.push({ role: "user", content });
    } else if (params.baseImageUrl) {
      const content: any[] = [
        { type: "text", text: enhancedPrompt },
        { type: "image_url", image_url: { url: params.baseImageUrl } }
      ];
      if (params.patternImageUrl) {
        content.push({ type: "image_url", image_url: { url: params.patternImageUrl } });
      }
      messages.push({ role: "user", content });
    } else if (params.patternImageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: enhancedPrompt },
          { type: "image_url", image_url: { url: params.patternImageUrl } }
        ]
      });
    } else {
      messages.push({ role: "user", content: enhancedPrompt });
    }

    // Use Nano Banana (google/gemini-2.5-flash-image)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages,
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      console.error(`[generate-image] API error: ${response.status}`);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error(`[generate-image] Error: ${errorText}`);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('[generate-image] No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
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
