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
    const { characteristics } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Gerando peça com características:', characteristics);

    const prompt = `Ultra high resolution professional fashion product photography.
Create a clothing item based on this description: ${characteristics.description}
The clothing should be displayed on a hanger or mannequin against a pure white background.
Professional studio lighting, centered composition.
High quality, detailed, realistic product photography suitable for e-commerce.
Make sure all details from the description are visible and well-represented.`;

    console.log('Prompt gerado:', prompt);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
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
      console.error('Erro na API Gemini:', response.status, errorText);
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!imageData) {
      throw new Error('No image generated');
    }

    const imageUrl = `data:image/jpeg;base64,${imageData}`;

    console.log('Peça gerada com sucesso!');

    return new Response(
      JSON.stringify({ imageUrl }),
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
