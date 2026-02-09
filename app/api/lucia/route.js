// app/api/lucia/route.js
// Backend seguro para LucIA - Edge Runtime (25s timeout en Vercel Hobby)

export const runtime = "edge";

const AI_SYSTEM = `Eres LucIA, la asistente jurídica de inteligencia artificial de Due Legal, un despacho de abogados colombiano especializado en derecho societario. Tu función es redactar puntos de actas de asamblea de accionistas de sociedades S.A.S. colombianas.

REGLAS DE REDACCIÓN:
1. Escribe en español jurídico colombiano formal, en tercera persona, con lenguaje propio de actas de asamblea.
2. Siempre incluye las citas normativas relevantes (Ley 1258 de 2008, Código de Comercio, Ley 222 de 1995, etc.).
3. Los números siempre van en letras seguidos del número entre paréntesis: "treinta y cinco (35) acciones".
4. Incluye la estructura de votación: "La propuesta fue sometida a votación y aprobada con el voto favorable de [X] acciones suscritas y pagadas, [Y] votos en contra, y [Z] votos en blanco."
5. Usa conectores jurídicos formales: "Acto seguido", "Seguidamente", "A renglón seguido", "En uso de la palabra", etc.
6. Redacta de forma completa pero concisa — párrafos de 3-5 líneas máximo.
7. NO incluyas títulos, encabezados ni numeración — solo el texto del punto.
8. Responde ÚNICAMENTE con el texto redactado, sin explicaciones ni comentarios adicionales.
9. Los votos deben expresarse en número de acciones suscritas y pagadas, NO en número de personas.`;

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY no configurada en el servidor" },
        { status: 500 }
      );
    }

    const { prompt, context } = await request.json();

    if (!prompt || !context) {
      return Response.json(
        { error: "Se requiere prompt y context" },
        { status: 400 }
      );
    }

    // Llamada directa a la API de Anthropic (sin SDK, compatible con Edge)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: AI_SYSTEM,
        messages: [{ role: "user", content: `${prompt}\n\n${context}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic API error:", response.status, err);

      if (response.status === 401) {
        return Response.json({ error: "API key de Anthropic inválida" }, { status: 401 });
      }
      if (response.status === 429) {
        return Response.json({ error: "Límite de uso excedido. Intente en unos segundos." }, { status: 429 });
      }
      return Response.json(
        { error: "Error de Anthropic: " + (err?.error?.message || `Status ${response.status}`) },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return Response.json({ text, usage: data.usage });
  } catch (error) {
    console.error("LucIA error:", error);
    return Response.json(
      { error: "Error al contactar LucIA: " + (error?.message || "Error desconocido") },
      { status: 500 }
    );
  }
}
