import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, lang, preferences } = await req.json();
    const isEnglish = lang === "en";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prefsBlock = preferences
      ? `\nUser preferences (use them as hints, don't repeat them back):\n- Genres: ${(preferences.favorite_genres || []).join(", ") || "n/a"}\n- Tones: ${(preferences.favorite_tones || []).join(", ") || "n/a"}\n- Tropes: ${(preferences.favorite_tropes || []).join(", ") || "n/a"}\n- Pace: ${preferences.preferred_pace || "n/a"}\n- Length: ${preferences.preferred_length || "n/a"}\n- Favorite authors: ${(preferences.favorite_authors || []).join(", ") || "n/a"}\n`
      : "";

    const systemPrompt = isEnglish
      ? `You are Bookflix's friendly book-matchmaker AI. Your goal is to recommend the perfect book for the user (focus on YA, romance, modern fantasy, Wattpad-style).

How to behave:
- Ask ONE short question at a time to discover their mood, favorite tropes, tone (dark/light/spicy), pace, length, and any books they loved or hated.
- Keep replies short (2-4 sentences). Be warm and a bit playful.
- After 3-5 questions (or sooner if you have enough info), recommend 2-3 specific real books with title, author, and a one-line pitch explaining why it fits THEM.
- Format final recommendations as a markdown list: **Title** by Author — short pitch.
- If they ask for more, suggest different titles, don't repeat.${prefsBlock}`
      : `Eres la IA cazadora de libros de Bookflix. Tu objetivo es recomendar el libro perfecto al usuario (enfócate en YA, romance, fantasía moderna, estilo Wattpad).

Cómo actuar:
- Haz UNA pregunta corta a la vez para descubrir su mood, tropos favoritos, tono (oscuro/ligero/picante), ritmo, longitud y libros que amó u odió.
- Respuestas cortas (2-4 frases). Cálida y un poco juguetona.
- Tras 3-5 preguntas (o antes si tienes suficiente info), recomienda 2-3 libros reales concretos con título, autora y una frase explicando por qué encaja con ELLA/ÉL.
- Formato final en lista markdown: **Título** de Autora — pitch corto.
- Si pide más, sugiere títulos distintos, no repitas.${prefsBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("book-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});