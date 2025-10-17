import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const poses = [
  { name: 'frontal', prompt: 'Full frontal view, model facing camera directly, standing straight, full body visible' },
  { name: 'costas', prompt: 'Full back view, model with back to camera, showing rear of clothing, full body visible' },
  { name: 'perfil', prompt: 'Side profile view, model turned 90 degrees showing side of clothing, full body visible' },
  { name: 'macro_detalhe', prompt: 'Extreme close-up macro shot showing fabric texture and clothing details, focus on material quality and craftsmanship' },
  { name: '3_4_angle', prompt: '3/4 angle view, model positioned at 45 degrees, showing both front and side, full body visible' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { creationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar a criação original
    const { data: creation, error: fetchError } = await supabase
      .from('creations')
      .select('image_url')
      .eq('id', creationId)
      .single();

    if (fetchError || !creation) {
      throw new Error('Criação não encontrada');
    }

    const originalImageUrl = creation.image_url;
    console.log('Gerando pack de 5 poses...');

    const poseImages = [];

    for (const pose of poses) {
      const fullPrompt = `Generate a new photo with this exact specification: ${pose.prompt}.
Use the same model and same clothing as shown in the reference image.
Maintain the same clothing design, color, and style.
Maintain the same model appearance.
Professional fashion photography, studio lighting, neutral background.
High quality, detailed, realistic, professional.`;

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
        const errorText = await response.text();
        console.error(`Erro na pose ${pose.name}:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 402) {
          throw new Error('Payment required');
        }
        continue;
      }

      const data = await response.json();
      const poseImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (poseImageUrl) {
        poseImages.push(poseImageUrl);
        console.log(`Pose ${pose.name} gerada com sucesso`);
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
