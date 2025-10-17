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

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
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
      console.error('Erro na API Gemini:', response.status, errorText);
      throw new Error('Failed to extract clothing');
    }

    const data = await response.json();
    const extractedImageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

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
