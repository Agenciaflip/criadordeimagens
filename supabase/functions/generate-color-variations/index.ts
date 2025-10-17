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
    const { creationImage, selectedColors } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!selectedColors || selectedColors.length === 0) {
      throw new Error('No colors selected');
    }

    console.log(`Gerando ${selectedColors.length} variações de cor...`);

    const variations = [];

    for (const color of selectedColors) {
      const prompt = `You must maintain the EXACT same image composition and model pose.
ONLY change the color of the clothing item to ${color}.
Keep everything else identical:
- Same model
- Same pose and position
- Same background
- Same lighting
- Same image composition
ONLY the clothing color should change to ${color}.
The result must look like the exact same photo, just with the clothing in ${color} color.`;

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
                { type: 'image_url', image_url: { url: creationImage } }
              ]
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na variação ${color}:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 402) {
          throw new Error('Payment required');
        }
        continue;
      }

      const data = await response.json();
      const variationUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (variationUrl) {
        variations.push(variationUrl);
        console.log(`Variação ${color} gerada com sucesso`);
      }
    }

    console.log(`${variations.length} variações geradas com sucesso`);

    return new Response(
      JSON.stringify({ variations }),
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
