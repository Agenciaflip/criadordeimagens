import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('Starting image merge process...');
    
    const { modelImage, productImage, prompt, sceneSettings } = await req.json();
    
    if (!modelImage || !productImage) {
      console.error('Missing required images');
      return new Response(
        JSON.stringify({ error: 'Both model and product images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GOOGLE_CLOUD_PROJECT_ID = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!GOOGLE_CLOUD_PROJECT_ID) {
      console.error('GOOGLE_CLOUD_PROJECT_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Google Cloud not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build dynamic prompt based on scene settings
    let mergePrompt = 'Professional fashion photography showing a model wearing the clothing item. ';
    
    if (sceneSettings) {
      const { pose, scenario, lighting, style } = sceneSettings;
      
      if (pose) {
        const poseDescriptions: Record<string, string> = {
          'frontal': 'full frontal view',
          'lateral': 'side profile view',
          '3-4': '3/4 angle view',
          'costas': 'back view',
          'sentado': 'seated pose',
          'caminhando': 'walking pose'
        };
        mergePrompt += `Model in ${poseDescriptions[pose] || pose} pose. `;
      }
      
      if (scenario) {
        const scenarioDescriptions: Record<string, string> = {
          'studio': 'professional studio setting',
          'rua': 'urban street environment',
          'praia': 'beach setting with sand',
          'parque': 'outdoor park environment',
          'indoor': 'indoor home setting',
          'white-background': 'clean white background'
        };
        mergePrompt += `Shot in ${scenarioDescriptions[scenario] || scenario}. `;
      }
      
      if (lighting) {
        const lightingDescriptions: Record<string, string> = {
          'studio': 'professional studio lighting',
          'natural': 'natural daylight',
          'dramatica': 'dramatic high-contrast lighting',
          'golden-hour': 'warm golden hour lighting',
          'soft': 'soft diffused lighting'
        };
        mergePrompt += `With ${lightingDescriptions[lighting] || lighting}. `;
      }
      
      if (style) {
        const styleDescriptions: Record<string, string> = {
          'editorial': 'editorial magazine style',
          'comercial': 'commercial catalog style',
          'casual': 'casual lifestyle style',
          'lifestyle': 'natural lifestyle photography',
          'high-fashion': 'high fashion runway style'
        };
        mergePrompt += `${styleDescriptions[style] || style} photography. `;
      }
    }
    
    mergePrompt += prompt || 'The model should be wearing the clothing item naturally. Ensure realistic fit, proper lighting, shadows, and perspective. The result should look natural and professional. High quality, detailed, realistic.';
    
    console.log('Generated prompt:', mergePrompt);

    console.log('Calling Vertex AI Imagen for image editing...');

    // Convert images to base64 if needed
    const getImageBase64 = async (imgUrl: string) => {
      if (imgUrl.startsWith('data:image')) {
        return imgUrl.split(',')[1];
      }
      const imgResponse = await fetch(imgUrl);
      const imgBlob = await imgResponse.blob();
      const buffer = await imgBlob.arrayBuffer();
      return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    };

    const modelImageData = await getImageBase64(modelImage);
    
    // For Vertex AI Imagen edit, we use the model as base image and describe the product in prompt
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1/publishers/google/models/imagegeneration@006:predict`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{
            prompt: mergePrompt,
            image: {
              bytesBase64Encoded: modelImageData
            }
          }],
          parameters: {
            sampleCount: 1,
            mode: "image-generation",
            aspectRatio: "3:4",
            safetyFilterLevel: "block_some",
            personGeneration: "allow_adult"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate merged image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Vertex AI response received');
    
    const imageData = data.predictions?.[0]?.bytesBase64Encoded;
    
    if (!imageData) {
      console.error('No image in Vertex AI response');
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mergedImageUrl = `data:image/jpeg;base64,${imageData}`;

    console.log('Image merge completed successfully');
    
    return new Response(
      JSON.stringify({ mergedImage: mergedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in merge-images function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
