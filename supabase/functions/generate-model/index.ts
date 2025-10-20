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
    const GOOGLE_CLOUD_PROJECT_ID = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }
    if (!GOOGLE_CLOUD_PROJECT_ID) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID não está configurado');
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

    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{
            prompt: prompt
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "3:4",
            safetyFilterLevel: "block_some",
            personGeneration: "allow_adult"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Vertex AI:', response.status, errorText);
      throw new Error(`Erro ao gerar imagem: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const imageData = data.predictions?.[0]?.bytesBase64Encoded;

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
