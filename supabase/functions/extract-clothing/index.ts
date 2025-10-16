import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Extraindo peça de roupa da imagem...');

    const prompt = `Extract and isolate the clothing item from this image.
Remove the model, mannequin, or any person wearing it.
Display the clothing item on a hanger against a pure white background.
The clothing should be centered, well-lit with professional studio lighting.
Maintain all details, textures, colors, and characteristics of the original clothing.
The result should look like a professional product photography for e-commerce.
Ultra high resolution, clean, professional.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      throw new Error('Failed to extract clothing');
    }

    const data = await response.json();
    const extractedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!extractedImageUrl) {
      throw new Error('No image generated');
    }

    console.log('Peça extraída com sucesso!');

    return new Response(
      JSON.stringify({ imageUrl: extractedImageUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
