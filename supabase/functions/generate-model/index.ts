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
    const { gender, ethnicity, ageRange, bodyType, hairColor, hairStyle, skinTone } = await req.json();
    
    console.log('Gerando modelo com características:', { gender, ethnicity, ageRange, bodyType, hairColor, hairStyle, skinTone });

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }

    // Criar prompt detalhado baseado nas características
    const prompt = `Ultra high resolution professional fashion model photo. 
${gender === 'female' ? 'Female' : 'Male'} model, ${ethnicity} ethnicity, ${ageRange} years old, ${bodyType} body type.
Hair: ${hairColor} ${hairStyle}.
Skin tone: ${skinTone}.
Full body shot, standing pose, neutral background, studio lighting, professional photography.
The model should be wearing simple neutral clothing to showcase the body and features clearly.
High quality, detailed, realistic, professional fashion photography.`;

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
      console.error('Erro da API Gemini:', response.status, errorText);
      throw new Error(`Erro ao gerar imagem: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!imageData) {
      throw new Error('Nenhuma imagem foi gerada pela API');
    }

    const generatedImageUrl = `data:image/jpeg;base64,${imageData}`;

    console.log('Modelo gerado com sucesso!');

    return new Response(
      JSON.stringify({ modelImage: generatedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar modelo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
