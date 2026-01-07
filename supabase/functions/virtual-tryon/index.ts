import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VirtualTryOnRequest {
  personImageUrl: string;
  garmentImageUrl: string;
  category?: 'upper_body' | 'lower_body' | 'dresses';
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

    const params: VirtualTryOnRequest = await req.json();
    const { personImageUrl, garmentImageUrl, category = 'upper_body' } = params;

    if (!personImageUrl || !garmentImageUrl) {
      throw new Error('personImageUrl and garmentImageUrl are required');
    }

    console.log(`Virtual try-on: category=${category}`);

    // Use IDM-VTON for virtual try-on
    const response = await fetch('https://queue.fal.run/fal-ai/idm-vton', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        human_image_url: personImageUrl,
        garment_image_url: garmentImageUrl,
        category,
        adjust_hands: true,
        auto_mask: true,
        auto_crop: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Virtual try-on API error:', response.status, errorText);
      throw new Error(`Virtual try-on API error: ${response.status}`);
    }

    const submitData = await response.json();
    const requestId = submitData.request_id;

    console.log(`Virtual try-on job submitted, request_id: ${requestId}`);

    // Poll for completion
    let result = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/idm-vton/requests/${requestId}`, {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
        },
      });

      if (resultResponse.ok) {
        const data = await resultResponse.json();
        if (data.image?.url || data.images?.[0]?.url) {
          result = data;
          break;
        }
      }
    }

    if (!result) {
      throw new Error('Virtual try-on generation timed out');
    }

    const resultImageUrl = result.image?.url || result.images?.[0]?.url;

    return new Response(
      JSON.stringify({ imageUrl: resultImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in virtual try-on:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});