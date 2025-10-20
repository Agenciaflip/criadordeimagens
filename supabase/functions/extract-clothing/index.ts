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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GOOGLE_CLOUD_PROJECT_ID = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    if (!GOOGLE_CLOUD_PROJECT_ID) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured');
    }

    console.log('Extraindo peça de roupa da imagem...');

    const prompt = `Extract and isolate the clothing item from this image.
Remove the model, mannequin, or any person wearing it.
Display the clothing item on a hanger against a pure white background.
The clothing should be centered, well-lit with professional studio lighting.
Maintain all details, textures, colors, and characteristics of the original clothing.
The result should look like a professional product photography for e-commerce.
Ultra high resolution, clean, professional.`;

    // Convert image to base64 if needed
    let imageData = imageUrl;
    if (imageUrl.startsWith('http')) {
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const buffer = await imageBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      imageData = base64;
    } else if (imageUrl.startsWith('data:image')) {
      imageData = imageUrl.split(',')[1];
    }

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
            prompt: prompt,
            image: {
              bytesBase64Encoded: imageData
            }
          }],
          parameters: {
            sampleCount: 1,
            mode: "image-generation",
            aspectRatio: "1:1",
            safetyFilterLevel: "block_some"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Vertex AI:', response.status, errorText);
      throw new Error('Failed to extract clothing');
    }

    const data = await response.json();
    const extractedImageData = data.predictions?.[0]?.bytesBase64Encoded;

    if (!extractedImageData) {
      throw new Error('No image generated');
    }

    const extractedImageUrl = `data:image/jpeg;base64,${extractedImageData}`;

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
