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
    const { clothingName, clothingType, clothingStyle, clothingColor } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Você é um especialista em copywriting para e-commerce de moda. 
Crie um título e uma descrição otimizada para marketplace para o seguinte produto:

Nome: ${clothingName}
Tipo: ${clothingType}
Estilo: ${clothingStyle}
Cor: ${clothingColor}

INSTRUÇÕES:
1. Título: Entre 50-80 caracteres, atrativo, com palavras-chave relevantes
2. Descrição: Entre 200-500 palavras, vendedora, com benefícios e características
3. Inclua 5-8 tags/keywords relevantes para SEO

Retorne no formato JSON:
{
  "title": "título aqui",
  "description": "descrição completa aqui",
  "tags": ["tag1", "tag2", ...]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: "", description: "", tags: [] };

    return new Response(
      JSON.stringify(parsedContent),
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
