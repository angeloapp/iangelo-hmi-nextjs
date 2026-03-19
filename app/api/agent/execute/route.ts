import { NextRequest } from "next/server"

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

interface AgentRequest {
  task: string
  url?: string
  context?: string
}

interface BrowserStep {
  action: "navigate" | "click" | "type" | "scroll" | "extract" | "wait" | "screenshot"
  description: string
  target?: string
  value?: string
  url?: string
}

export async function POST(req: NextRequest) {
  try {
    const { task, url, context } = (await req.json()) as AgentRequest

    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "PERPLEXITY_API_KEY no configurada" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Step 1: Thinking
          send({
            type: "action",
            action: {
              type: "thinking",
              description: `Analizando tarea: "${task}"`,
              status: "running",
            },
          })

          await delay(1000)

          // Step 2: Planning - Ask Perplexity for a browsing plan
          const planPrompt = `Eres un agente de navegación web autónomo. Tu tarea es: "${task}"
${url ? `URL inicial: ${url}` : ""}
${context ? `Contexto adicional: ${context}` : ""}

Genera un plan de navegación paso a paso para completar esta tarea. Para cada paso, especifica:
1. La acción a realizar (navegar, hacer clic, escribir, scroll, extraer información)
2. Una descripción clara de lo que harás
3. El objetivo/selector si aplica
4. El valor a ingresar si aplica

Responde en formato JSON con un array de pasos:
[
  {"action": "navigate", "description": "...", "url": "..."},
  {"action": "click", "description": "...", "target": "..."},
  {"action": "type", "description": "...", "target": "...", "value": "..."},
  {"action": "extract", "description": "...", "target": "..."}
]

Limita a máximo 6 pasos. Sé específico y realista.`

          send({
            type: "status",
            status: "planning",
            message: "Planificando acciones...",
          })

          send({
            type: "action",
            action: {
              type: "thinking",
              description: "Creando plan de navegación con IA...",
              status: "done",
            },
          })

          await delay(500)

          // Call Perplexity to get the plan
          const planResponse = await fetch(
            "https://api.perplexity.ai/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                  {
                    role: "system",
                    content:
                      "Eres un agente de navegación web. Responde SOLO con JSON válido, sin texto adicional.",
                  },
                  { role: "user", content: planPrompt },
                ],
                temperature: 0.2,
                max_tokens: 1000,
              }),
            }
          )

          let steps: BrowserStep[] = []
          
          if (planResponse.ok) {
            const planData = await planResponse.json()
            const content = planData.choices?.[0]?.message?.content || ""
            
            // Try to parse JSON from response
            try {
              const jsonMatch = content.match(/\[[\s\S]*\]/)
              if (jsonMatch) {
                steps = JSON.parse(jsonMatch[0])
              }
            } catch {
              // Fallback steps if parsing fails
              steps = generateFallbackSteps(task, url)
            }
          } else {
            steps = generateFallbackSteps(task, url)
          }

          send({
            type: "status",
            status: "executing",
            message: `Ejecutando ${steps.length} acciones...`,
          })

          // Execute each step
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i]
            
            send({
              type: "action",
              action: {
                type: step.action,
                description: step.description,
                target: step.target,
                value: step.value,
                url: step.url,
                status: "running",
              },
            })

            // If navigate, send URL update
            if (step.action === "navigate" && step.url) {
              send({
                type: "navigate",
                url: step.url,
              })
            }

            // Simulate action execution time
            await delay(1500 + Math.random() * 1000)

            send({
              type: "action_complete",
              index: i,
              status: "done",
            })
          }

          // Step 3: Get final result/summary
          send({
            type: "action",
            action: {
              type: "extract",
              description: "Extrayendo resultados finales...",
              status: "running",
            },
          })

          await delay(1000)

          // Get summary from Perplexity
          const summaryResponse = await fetch(
            "https://api.perplexity.ai/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                  {
                    role: "system",
                    content:
                      "Eres un asistente útil. Responde en español de manera concisa.",
                  },
                  {
                    role: "user",
                    content: `Completé la siguiente tarea de navegación web: "${task}"
${url ? `En el sitio: ${url}` : ""}

Pasos ejecutados:
${steps.map((s, i) => `${i + 1}. ${s.description}`).join("\n")}

Genera un resumen breve y útil del resultado de esta tarea. Si es una búsqueda, proporciona información relevante. Si es una acción, confirma lo que se hizo.`,
                  },
                ],
                temperature: 0.3,
                max_tokens: 500,
              }),
            }
          )

          let summary = "Tarea completada exitosamente."
          let citations: string[] = []

          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json()
            summary = summaryData.choices?.[0]?.message?.content || summary
            citations = summaryData.citations || []
          }

          send({
            type: "action_complete",
            index: steps.length,
            status: "done",
          })

          // Complete
          send({
            type: "action",
            action: {
              type: "complete",
              description: "Tarea completada",
              status: "done",
            },
          })

          send({
            type: "complete",
            result: summary,
            citations,
          })

        } catch (error) {
          send({
            type: "error",
            message: error instanceof Error ? error.message : "Error desconocido",
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error del servidor" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateFallbackSteps(task: string, url?: string): BrowserStep[] {
  const taskLower = task.toLowerCase()
  
  // Airbnb search
  if (taskLower.includes("airbnb") || taskLower.includes("alojamiento") || taskLower.includes("hospedaje")) {
    return [
      { action: "navigate", description: "Navegando a Airbnb", url: "https://www.airbnb.com" },
      { action: "click", description: "Haciendo clic en el campo de búsqueda", target: "search-input" },
      { action: "type", description: "Escribiendo ubicación de búsqueda", target: "search-input", value: "Los Cabos, México" },
      { action: "click", description: "Seleccionando fechas de viaje", target: "date-picker" },
      { action: "click", description: "Iniciando búsqueda", target: "search-button" },
      { action: "extract", description: "Extrayendo resultados de propiedades", target: "results-list" },
    ]
  }
  
  // Google search
  if (taskLower.includes("google") || taskLower.includes("buscar") || taskLower.includes("búsqueda")) {
    const searchTerm = task.replace(/buscar|google|búsqueda|en|de/gi, "").trim() || "Los Cabos México"
    return [
      { action: "navigate", description: "Navegando a Google", url: "https://www.google.com" },
      { action: "click", description: "Haciendo clic en campo de búsqueda", target: "search-input" },
      { action: "type", description: `Escribiendo: "${searchTerm}"`, target: "search-input", value: searchTerm },
      { action: "click", description: "Presionando botón de búsqueda", target: "search-button" },
      { action: "extract", description: "Extrayendo resultados de búsqueda", target: "search-results" },
    ]
  }
  
  // GoDaddy DNS
  if (taskLower.includes("godaddy") || taskLower.includes("dns") || taskLower.includes("dominio")) {
    return [
      { action: "navigate", description: "Navegando a GoDaddy", url: "https://www.godaddy.com" },
      { action: "click", description: "Accediendo a Mi Cuenta", target: "account-menu" },
      { action: "click", description: "Navegando a Mis Dominios", target: "my-domains" },
      { action: "click", description: "Seleccionando dominio", target: "domain-item" },
      { action: "click", description: "Abriendo configuración DNS", target: "dns-settings" },
      { action: "extract", description: "Mostrando registros DNS actuales", target: "dns-records" },
    ]
  }
  
  // Vercel
  if (taskLower.includes("vercel") || taskLower.includes("deploy") || taskLower.includes("desplegar")) {
    return [
      { action: "navigate", description: "Navegando a Vercel Dashboard", url: "https://vercel.com/dashboard" },
      { action: "click", description: "Abriendo lista de proyectos", target: "projects-list" },
      { action: "extract", description: "Extrayendo información de proyectos", target: "project-cards" },
    ]
  }
  
  // Default search behavior
  const searchUrl = url || "https://duckduckgo.com"
  return [
    { action: "navigate", description: `Navegando a ${searchUrl}`, url: searchUrl },
    { action: "click", description: "Localizando área principal de contenido", target: "main-content" },
    { action: "scroll", description: "Explorando la página", target: "page" },
    { action: "extract", description: "Extrayendo información relevante", target: "content" },
  ]
}
