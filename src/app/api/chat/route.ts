import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key do Gemini não encontrada no arquivo .env" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const { prompt, context } = await req.json();

    const fullPrompt = `Você é um assistente inteligente de compras. 
Abaixo estão todas as listas de compras do usuário em formato JSON (indicando qual é a lista atual visualizada no momento):
${JSON.stringify(context, null, 2)}

Responda de forma amigável, concisa e útil à seguinte pergunta do usuário, baseando-se SOMENTE nas listas fornecidas ou em conhecimentos gerais de culinária e economia compatíveis com os itens das listas. Não invente itens que não estão nas listas.
Pergunta do Usuário: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
