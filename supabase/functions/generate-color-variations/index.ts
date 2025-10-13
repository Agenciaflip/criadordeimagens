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
    const { imageUrl, numberOfVariations = 5 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Gerando variações de cor...');

    const variations = [];
    const colors = ['vermelho', 'azul', 'verde', 'amarelo', 'rosa', 'roxo', 'laranja', 'preto', 'cinza', 'bege'];

    for (let i = 0; i < Math.min(numberOfVariations, colors.length); i++) {
      const prompt = `Create a color variation of this clothing item. 
Change ONLY the color to ${colors[i]}.
Maintain the exact same style, cut, design, fabric texture, and all other characteristics.
Only the color should be different.
Professional product photography, white background.`;

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
        console.error(`Erro na variação ${i + 1}:`, response.status);
        continue;
      }

      const data = await response.json();
      const variationUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (variationUrl) {
        variations.push({
          color: colors[i],
          imageUrl: variationUrl
        });
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
