import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookInput {
  title: string;
  author: string;
  description: string;
  first_publish_year?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userQuery, books } = (await req.json()) as {
      userQuery: string;
      books: BookInput[];
    };

    if (!userQuery || !books?.length) {
      return new Response(JSON.stringify({ ranked: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build a compact list for the AI
    const bookList = books
      .map(
        (b, i) =>
          `${i}. "${b.title}" by ${b.author}${b.first_publish_year ? ` (${b.first_publish_year})` : ""} — ${(b.description || "").slice(0, 150)}`
      )
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Eres un experto en literatura juvenil, romance y fantasía. El usuario busca libros que coincidan con una descripción. Analiza la lista de libros y devuelve los índices ordenados por relevancia. Prioriza libros más recientes y que mejor se ajusten a la descripción del usuario. Usa la herramienta proporcionada para devolver los resultados.`,
            },
            {
              role: "user",
              content: `El usuario busca: "${userQuery}"\n\nLibros disponibles:\n${bookList}\n\nOrdena los libros del más relevante al menos relevante. Prioriza los más recientes y los que mejor coincidan con la descripción.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "rank_books",
                description:
                  "Return the book indices ordered by relevance to the user query, most relevant first.",
                parameters: {
                  type: "object",
                  properties: {
                    ranked_indices: {
                      type: "array",
                      items: { type: "number" },
                      description:
                        "Array of book indices (0-based) sorted by relevance, most relevant first.",
                    },
                  },
                  required: ["ranked_indices"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "rank_books" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      // Fallback: return original order
      return new Response(
        JSON.stringify({ ranked: books.map((_, i) => i) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let rankedIndices: number[] = [];

    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      rankedIndices = args.ranked_indices || [];
    }

    // Ensure all indices are valid
    rankedIndices = rankedIndices.filter(
      (i: number) => typeof i === "number" && i >= 0 && i < books.length
    );

    // Add any missing indices at the end
    for (let i = 0; i < books.length; i++) {
      if (!rankedIndices.includes(i)) rankedIndices.push(i);
    }

    return new Response(JSON.stringify({ ranked: rankedIndices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rank-books error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
