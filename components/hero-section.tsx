"use client"

import { SearchInput } from "./search-input"
import { QuickChips } from "./quick-chips"
import { SearchResults } from "./search-results"
import { ChatMessages } from "./chat-messages"
import { AgentSteps } from "./agent-steps"
import { ImageResults } from "./image-results"
import { NewsResults } from "./news-results"
import { MapsResults } from "./maps-results"
import { SmartWidgets } from "./smart-widgets"
import { useSearchStore } from "@/lib/search-store"
import { useAgentStore } from "@/lib/agent-store"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const { mode, activeTab, result, messages, isLoading, isStreaming, agentSteps } = useSearchStore()
  const { setAgentModeOpen } = useAgentStore()
  
  const hasSearchContent = result !== null || isLoading || isStreaming
  const hasChatContent = messages.length > 0 || isLoading || isStreaming
  const hasAgentContent = agentSteps.length > 0
  
  const showHeroContent = mode === "search" 
    ? !hasSearchContent 
    : mode === "chat"
    ? !hasChatContent
    : !hasAgentContent

  // Render content based on active tab (only for search mode)
  const renderTabContent = () => {
    if (mode !== "search") return null
    
    switch (activeTab) {
      case "images":
        return <ImageResults />
      case "news":
        return <NewsResults />
      case "maps":
        return <MapsResults />
      default:
        return (
          <>
            <SmartWidgets />
            <SearchResults />
          </>
        )
    }
  }

  return (
    <section className={`relative flex flex-col items-center px-4 pt-28 pb-16 ${showHeroContent ? 'min-h-screen justify-center' : 'min-h-[40vh]'}`}>
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-purple/10 blur-[100px] pointer-events-none" />
      
      {showHeroContent && (
        <>
          {/* Badge */}
          <div className="mb-8 px-4 py-2 rounded-full bg-gradient-to-r from-cyan/10 to-purple/10 border border-cyan/20 backdrop-blur-sm">
            <span className="text-sm text-cyan font-medium">
              {mode === "agent" 
                ? "Agente autónomo con capacidad de navegación web" 
                : mode === "chat"
                ? "Conversación continua con memoria contextual"
                : "Potenciado por IA de última generación • 2026-2036"
              }
            </span>
          </div>
          
          {/* Headline */}
          <div className="text-center mb-12 max-w-4xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-balance">
              <span className="text-foreground">
                {mode === "agent" 
                  ? "Agente Autónomo." 
                  : mode === "chat"
                  ? "Conversa con iAngelo."
                  : "Pregunta cualquier cosa."
                }
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan via-purple to-cyan bg-clip-text text-transparent animate-gradient">
                {mode === "agent" 
                  ? "Tareas complejas, resultados reales." 
                  : mode === "chat"
                  ? "Respuestas inteligentes."
                  : "Obtén respuestas reales."
                }
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              {mode === "agent"
                ? "El agente puede navegar la web, buscar información, analizar datos y ejecutar tareas de forma autónoma."
                : mode === "chat"
                ? "Mantén una conversación fluida con contexto persistente. iAngelo recuerda lo que has preguntado."
                : "Búsqueda inteligente con streaming en tiempo real, fuentes verificadas e imágenes relacionadas."
              }
            </p>
          </div>
        </>
      )}
      
      {/* Mode-specific headers */}
      {mode === "chat" && messages.length > 0 && (
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Conversación con iAngelo</h2>
          <p className="text-sm text-muted-foreground">{messages.length} mensaje{messages.length !== 1 ? "s" : ""} en esta sesión</p>
        </div>
      )}

      {mode === "agent" && (
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Modo Agente</h2>
          <Button
            onClick={() => setAgentModeOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan to-purple text-navy-dark font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            <Bot className="w-5 h-5 mr-2" />
            Abrir Agente Inmersivo
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Abre el navegador del agente para ejecutar tareas en sitios web reales
          </p>
        </div>
      )}
      
      {/* Content based on mode */}
      {mode === "chat" && <ChatMessages />}
      {mode === "agent" && <AgentSteps />}
      {mode === "search" && hasSearchContent && renderTabContent()}
      
      {/* Search Results for agent mode after completion */}
      {mode === "agent" && result && <SearchResults />}
      
      {/* Search Input */}
      <div className={`w-full max-w-3xl ${showHeroContent ? 'mb-10' : 'mt-8 mb-6'}`}>
        <SearchInput />
      </div>
      
      {/* Quick Chips - only show when no results/messages */}
      {showHeroContent && mode === "search" && <QuickChips />}
    </section>
  )
}
