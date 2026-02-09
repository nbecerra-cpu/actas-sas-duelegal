// app/api/lucia/route.js
// Backend seguro para llamadas a Claude AI (LucIA)
// La API key nunca se expone al cliente

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY no configurada en el servidor" },
        { status: 500 }
      );
    }

    const { prompt, context } = await request.json();

    if (!prompt || !context) {
      return NextResponse.json(
        { error: "Se requiere prompt y context" },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey });

    const userMessage = `${prompt}\n\n${context}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: AI_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ text, usage: message.usage });
  } catch (error) {
    console.error("LucIA API error:", error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: "API key de Anthropic inválida" },
        { status: 401 }
      );
    }
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Límite de uso excedido. Intente de nuevo en unos segundos." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Error interno al contactar LucIA: " + error.message },
      { status: 500 }
    );
  }
}
