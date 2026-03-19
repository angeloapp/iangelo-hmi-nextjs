"use client"

import { Newspaper, Cpu, Code, Leaf, Bot, Calculator, MapPin, Sparkles } from "lucide-react"
import { useSearchStore } from "@/lib/search-store"

const suggestions = [
  {
    icon: Newspaper,
    text: "Últimas noticias tech",
    gradient: "from-cyan/20 to-cyan/5",
    borderColor: "border-cyan/30",
    iconColor: "text-cyan",
  },
  {
    icon: Cpu,
    text: "¿Cómo funciona la IA?",
    gradient: "from-purple/20 to-purple/5",
    borderColor: "border-purple/30",
    iconColor: "text-purple",
  },
  {
    icon: Code,
    text: "Mejores lenguajes 2026",
    gradient: "from-cyan/20 to-purple/10",
    borderColor: "border-cyan/20",
    iconColor: "text-cyan",
  },
  {
    icon: Leaf,
    text: "Cambio climático México",
    gradient: "from-green-500/20 to-cyan/10",
    borderColor: "border-green-500/20",
    iconColor: "text-green-400",
  },
  {
    icon: MapPin,
    text: "Clima en Los Cabos",
    gradient: "from-blue-500/20 to-cyan/10",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Calculator,
    text: "¿Cuánto es 15% de 2500?",
    gradient: "from-purple/20 to-pink-500/10",
    borderColor: "border-purple/20",
    iconColor: "text-purple",
  },
]

export function QuickChips() {
  const { 
    isLoading, 
    isStreaming,
    mode,
    setLoading, 
    setStreaming,
    setStreamingContent,
    appendStreamingContent,
    setResult, 
    addMessage, 
    incrementQueries,
    addSources,
    addResponseTime,
    addToHistory,
  } = useSearchStore()

  const handleChipClick = async (query: string) => {
    if (isLoading || isStreaming) return
    
    // Add to history
    addToHistory({
      query,
      mode,
      timestamp: new Date(),
    })

    if (mode === "chat") {
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: query,
        timestamp: new Date(),
      })
    }

    setStreaming(true)
    setStreamingContent("")

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode, stream: true }),
      })

      if (!response.ok) throw new Error("API error")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      const decoder = new TextDecoder()
      let fullContent = ""
      let citations: string[] = []
      let images: string[] = []
      let relatedQuestions: string[] = []
      let responseTime = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === "content") {
                fullContent += parsed.content
                appendStreamingContent(parsed.content)
              } else if (parsed.type === "done") {
                citations = parsed.citations || []
                images = parsed.images || []
                relatedQuestions = parsed.relatedQuestions || []
                responseTime = parsed.responseTime || 0
              }
            } catch {
              // Skip
            }
          }
        }
      }

      incrementQueries()
      if (citations.length > 0) addSources(citations.length)
      if (responseTime) addResponseTime(responseTime)

      if (mode === "chat") {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          citations,
          images,
          timestamp: new Date(),
        })
        setStreamingContent("")
      } else {
        setResult({
          answer: fullContent,
          citations,
          images,
          relatedQuestions,
          responseTime,
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      setResult({ answer: "Error de conexión. Intenta de nuevo.", citations: [] })
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => handleChipClick(suggestion.text)}
          disabled={isLoading || isStreaming}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${suggestion.gradient} border ${suggestion.borderColor} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          <suggestion.icon className={`w-4 h-4 ${suggestion.iconColor} transition-transform group-hover:scale-110`} />
          <span className="text-sm text-foreground/90">{suggestion.text}</span>
        </button>
      ))}
    </div>
  )
}
