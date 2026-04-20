import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, description, searchQuery, lang } = await req.json();
    const isEnglish = lang === "en";

    if (!title) {
      return new Response(
        JSON.stringify({ recommendation: "No se pudo generar una recomendación." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userContext = searchQuery
      ? isEnglish
        ? `The user searched: "${searchQuery}".`
        : `El usuario buscó: "${searchQuery}".`
      : isEnglish
      ? "The user is exploring books."
      : "El usuario está explorando libros.";

    const systemPrompt = isEnglish
      ? `You are an expert in YA literature, romance and fantasy. Generate a personalized and UNIQUE recommendation for a specific book.
Explain why this particular book is special: mention plot elements, the author's style, unique themes, and why it connects with what the reader is looking for.
Be enthusiastic but specific - avoid generic phrases. Maximum 3 sentences.
Reply ONLY with the recommendation text, no quotes or extra formatting.`
      : `Eres un experto en literatura juvenil, romance y fantasía. Genera una recomendación personalizada y ÚNICA para un libro específico. 
Explica por qué este libro en particular es especial: menciona elementos de su trama, estilo del autor, temáticas únicas, y por qué conecta con lo que el lector busca.
Sé entusiasta pero específico - no uses frases genéricas. Máximo 3 oraciones.
Responde SOLO con el texto de la recomendación, sin comillas ni formato extra.`;

    const userPrompt = isEnglish
      ? `Book: "${title}" by ${author}.\nSynopsis: ${(description || "Not available").slice(0, 300)}\n${userContext}\n\nGenerate a unique and specific recommendation for THIS book in English.`
      : `Libro: "${title}" de ${author}.\nSinopsis: ${(description || "No disponible").slice(0, 300)}\n${userContext}\n\nGenera una recomendación única y específica para ESTE libro.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ recommendation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("recommend-book error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
