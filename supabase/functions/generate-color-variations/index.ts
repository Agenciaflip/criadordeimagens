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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    if (!selectedColors || selectedColors.length === 0) {
      throw new Error('No colors selected');
    }

    console.log(`Gerando ${selectedColors.length} variações de cor...`);

    // Convert image to base64 once
    let imageData = creationImage;
    if (creationImage.startsWith('http')) {
      const imageResponse = await fetch(creationImage);
      const imageBlob = await imageResponse.blob();
      const buffer = await imageBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      imageData = base64;
    } else if (creationImage.startsWith('data:image')) {
      imageData = creationImage.split(',')[1];
    }

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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "image/jpeg"
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na variação ${color}:`, response.status, errorText);
        continue;
      }

      const data = await response.json();
      const variationData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (variationData) {
        const variationUrl = `data:image/jpeg;base64,${variationData}`;
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
