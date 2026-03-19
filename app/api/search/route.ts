import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

interface PerplexityResponse {
  id: string
  model: string
  created: number
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  citations?: string[]
  images?: string[]
  related_questions?: string[]
  choices: {
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
    delta?: {
      role: string
      content: string
    }
  }[]
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { query, messages = [], mode = "search", stream = false } = await request.json()

    if (!query && messages.length === 0) {
      return NextResponse.json(
        { error: "Se requiere una pregunta" },
        { status: 400 }
      )
    }

    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key no configurada. Por favor configura PERPLEXITY_API_KEY en las variables de entorno." },
        { status: 500 }
      )
    }

    // Detect language
    const isSpanish = /[áéíóúüñ¿¡]/.test(query) || 
      /\b(qué|cómo|cuál|dónde|cuándo|por qué|para qué)\b/i.test(query)
    
    const systemMessage: Message = {
      role: "system",
      content: mode === "chat" 
        ? `Eres iAngelo, un asistente de IA avanzado creado en Los Cabos, BCS, México. ${isSpanish ? 'Responde en español' : 'Respond in the same language as the user'} de manera conversacional, amigable y precisa. Mantén el contexto de la conversación anterior. Usa formato markdown para mejor legibilidad.`
        : mode === "agent"
        ? `Eres iAngelo en modo agente autónomo. Puedes navegar la web, buscar información, analizar datos y tomar acciones. ${isSpanish ? 'Responde en español' : 'Respond in the same language as the user'}. Explica tu proceso de pensamiento paso a paso. Sé detallado y proactivo.`
        : `Eres iAngelo, un motor de búsqueda inteligente creado en Los Cabos, BCS, México. ${isSpanish ? 'Proporciona respuestas precisas, bien estructuradas y en español' : 'Provide precise, well-structured answers in the same language as the user'}. IMPORTANTE: Cita las fuentes usando números entre corchetes [1], [2], etc. que correspondan a las URLs proporcionadas. Usa formato markdown para mejor legibilidad con headers, bullets, y código cuando sea apropiado.`
    }

    const conversationMessages: Message[] = mode === "chat" && messages.length > 0
      ? [
          systemMessage,
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content
          })),
          { role: "user" as const, content: query }
        ]
      : [
          systemMessage,
          { role: "user" as const, content: query }
        ]

    if (stream) {
      // Streaming response
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: conversationMessages,
          max_tokens: 4096,
          temperature: 0.2,
          top_p: 0.9,
          return_citations: true,
          return_images: true,
          return_related_questions: true,
          search_recency_filter: "month",
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Perplexity API error:", errorData)
        return NextResponse.json(
          { error: `Error de la API: ${response.status}` },
          { status: response.status }
        )
      }

      // Return streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }

          const decoder = new TextDecoder()
          let buffer = ""
          let citations: string[] = []
          let images: string[] = []
          let relatedQuestions: string[] = []

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")
              buffer = lines.pop() || ""

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6)
                  if (data === "[DONE]") {
                    // Send final metadata
                    const endTime = Date.now()
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: "done",
                      citations,
                      images,
                      relatedQuestions,
                      responseTime: endTime - startTime
                    })}\n\n`))
                    continue
                  }

                  try {
                    const parsed = JSON.parse(data)
                    
                    // Extract citations and images from the response
                    if (parsed.citations) citations = parsed.citations
                    if (parsed.images) images = parsed.images
                    if (parsed.related_questions) relatedQuestions = parsed.related_questions

                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: "content",
                        content
                      })}\n\n`))
                    }
                  } catch {
                    // Skip malformed JSON
                  }
                }
              }
            }
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    } else {
      // Non-streaming response
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: conversationMessages,
          max_tokens: 4096,
          temperature: 0.2,
          top_p: 0.9,
          return_citations: true,
          return_images: true,
          return_related_questions: true,
          search_recency_filter: "month",
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Perplexity API error:", errorData)
        return NextResponse.json(
          { error: `Error de la API: ${response.status}` },
          { status: response.status }
        )
      }

      const data: PerplexityResponse = await response.json()
      const endTime = Date.now()
      
      const result = {
        answer: data.choices[0]?.message?.content || "No se encontró respuesta",
        citations: data.citations || [],
        images: data.images || [],
        relatedQuestions: data.related_questions || [],
        usage: data.usage,
        model: data.model,
        responseTime: endTime - startTime,
      }

      return NextResponse.json(result)
    }
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Error al procesar la búsqueda" },
      { status: 500 }
    )
  }
}
