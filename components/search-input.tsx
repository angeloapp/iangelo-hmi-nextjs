"use client"

import { Mic, Send, Sparkles, StopCircle, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchStore } from "@/lib/search-store"

export function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localQuery, setLocalQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  const { 
    mode, 
    query,
    isLoading,
    isStreaming,
    setLoading,
    setStreaming,
    setStreamingContent,
    appendStreamingContent,
    setResult, 
    addMessage, 
    messages,
    incrementQueries,
    addSources,
    addResponseTime,
    addToHistory,
    addAgentStep,
    updateAgentStep,
    setAgentRunning,
    clearAgentSteps,
    isSpeaking,
    setSpeaking,
  } = useSearchStore()

  // Sync external query changes
  useEffect(() => {
    if (query && query !== localQuery) {
      setLocalQuery(query)
    }
  }, [query])

  const speakText = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "es-MX"
      utterance.rate = 1
      utterance.pitch = 1
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [setSpeaking])

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [setSpeaking])

  const runAgentMode = useCallback(async (searchQuery: string) => {
    setAgentRunning(true)
    clearAgentSteps()

    const steps = [
      { type: "thinking" as const, title: "Analizando consulta", description: "Procesando tu pregunta y determinando la mejor estrategia..." },
      { type: "searching" as const, title: "Buscando información", description: "Consultando múltiples fuentes y bases de datos..." },
      { type: "browsing" as const, title: "Navegando resultados", description: "Explorando páginas web relevantes y extrayendo datos..." },
      { type: "analyzing" as const, title: "Analizando datos", description: "Sintetizando información de múltiples fuentes..." },
    ]

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepId = crypto.randomUUID()
      
      addAgentStep({
        id: stepId,
        ...step,
        status: "active",
        timestamp: new Date(),
      })

      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))
      updateAgentStep(stepId, { status: "complete" })
    }

    // Now make the actual search
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          mode: "agent",
          messages: [],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const completeStepId = crypto.randomUUID()
        addAgentStep({
          id: completeStepId,
          type: "complete",
          title: "Tarea completada",
          description: "Se encontró la respuesta solicitada",
          status: "complete",
          timestamp: new Date(),
        })

        incrementQueries()
        if (data.citations) addSources(data.citations.length)
        if (data.responseTime) addResponseTime(data.responseTime)
        
        setResult(data)
        addToHistory({
          query: searchQuery,
          mode: "agent",
          timestamp: new Date(),
          preview: data.answer?.slice(0, 100),
        })
      }
    } catch (error) {
      console.error("Agent error:", error)
    } finally {
      setAgentRunning(false)
    }
  }, [addAgentStep, updateAgentStep, clearAgentSteps, setAgentRunning, setResult, incrementQueries, addSources, addResponseTime, addToHistory])

  const handleSearch = useCallback(async () => {
    if (!localQuery.trim() || isLoading || isStreaming) return

    const searchQuery = localQuery.trim()
    setLocalQuery("")

    if (mode === "agent") {
      await runAgentMode(searchQuery)
      return
    }

    setLoading(true)
    setStreamingContent("")
    
    if (mode === "chat") {
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: searchQuery,
        timestamp: new Date(),
      })
    }

    // Add to history
    addToHistory({
      query: searchQuery,
      mode,
      timestamp: new Date(),
    })

    try {
      // Use streaming for better UX
      setStreaming(true)
      setLoading(false)

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          mode,
          messages: mode === "chat" ? messages.map(m => ({
            role: m.role,
            content: m.content
          })) : [],
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

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
              // Skip malformed JSON
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
      const errorMsg = "Error de conexión. Intenta de nuevo."
      if (mode === "chat") {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: errorMsg,
          timestamp: new Date(),
        })
      } else {
        setResult({ answer: errorMsg, citations: [] })
      }
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }, [localQuery, isLoading, isStreaming, mode, messages, runAgentMode, setLoading, setStreaming, setStreamingContent, appendStreamingContent, setResult, addMessage, incrementQueries, addSources, addResponseTime, addToHistory])

  const handleMicClick = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Tu navegador no soporta reconocimiento de voz")
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    
    recognition.lang = "es-MX"
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }
    recognition.onerror = () => {
      setIsListening(false)
      recognitionRef.current = null
    }
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results)
      const transcript = results
        .map(result => result[0].transcript)
        .join("")
      setLocalQuery(transcript)
    }

    recognition.start()
  }, [isListening])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [mode])

  const placeholders: Record<string, string> = {
    search: "Pregunta cualquier cosa...",
    chat: "Escribe tu mensaje...",
    agent: "Describe la tarea para el agente autónomo...",
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan via-purple to-cyan rounded-2xl opacity-30 blur-lg animate-gradient" />
      
      {/* Input container */}
      <div className="relative flex items-center gap-3 p-2 pl-5 rounded-2xl bg-secondary/80 backdrop-blur-xl border border-border/50 shadow-2xl">
        <Sparkles className={`w-5 h-5 flex-shrink-0 transition-colors ${isStreaming ? "text-purple animate-pulse" : "text-cyan/70"}`} />
        
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholders[mode]}
          disabled={isLoading || isStreaming}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base py-3 disabled:opacity-50"
        />

        {/* Voice output button */}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={isSpeaking ? stopSpeaking : undefined}
          className={`rounded-xl transition-all duration-300 ${
            isSpeaking
              ? "bg-purple/20 text-purple animate-pulse"
              : "text-muted-foreground hover:text-purple hover:bg-purple/10 opacity-50"
          }`}
          disabled={!isSpeaking}
        >
          {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        
        {/* Mic button */}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={handleMicClick}
          disabled={isLoading || isStreaming}
          className={`rounded-xl transition-all duration-300 ${
            isListening
              ? "bg-cyan/20 text-cyan"
              : "text-muted-foreground hover:text-cyan hover:bg-cyan/10"
          }`}
        >
          <Mic className={`w-5 h-5 ${isListening ? "animate-pulse" : ""}`} />
        </Button>
        
        {/* Send/Stop button */}
        <Button
          size="icon"
          type="button"
          onClick={isStreaming ? () => setStreaming(false) : handleSearch}
          disabled={isLoading || (!localQuery.trim() && !isStreaming)}
          className={`rounded-xl transition-all duration-300 text-navy-dark disabled:opacity-50 ${
            isStreaming 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-gradient-to-r from-cyan to-purple hover:opacity-90"
          }`}
        >
          {isStreaming ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-cyan text-sm">
          <span className="flex gap-1">
            <span className="w-1 h-4 bg-cyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-4 bg-cyan rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-4 bg-cyan rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          Escuchando...
        </div>
      )}
    </div>
  )
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
