import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const poses = [
  { name: 'frontal', prompt: 'Full frontal view, model facing camera directly, standing straight' },
  { name: 'costas', prompt: 'Full back view, model with back to camera, showing rear of clothing' },
  { name: 'perfil', prompt: 'Side profile view, model turned 90 degrees, showing side of clothing' },
  { name: 'detalhe_superior', prompt: 'Close-up detail shot focusing on upper section of clothing, high detail' },
  { name: 'detalhe_inferior', prompt: 'Close-up detail shot focusing on lower section of clothing, high detail' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalImageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Gerando pack de 5 poses...');

    const poseImages = [];

    for (const pose of poses) {
      const fullPrompt = `${pose.prompt}. 
Maintain the same model and clothing as shown in the reference image.
Professional fashion photography, studio lighting, clean background.
High quality, detailed, realistic.`;

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
                { type: 'text', text: fullPrompt },
                { type: 'image_url', image_url: { url: originalImageUrl } }
              ]
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        console.error(`Erro na pose ${pose.name}:`, response.status);
        continue;
      }

      const data = await response.json();
      const poseImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (poseImageUrl) {
        poseImages.push({
          pose: pose.name,
          imageUrl: poseImageUrl
        });
      }
    }

    console.log(`${poseImages.length} poses geradas com sucesso`);

    return new Response(
      JSON.stringify({ poses: poseImages }),
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
