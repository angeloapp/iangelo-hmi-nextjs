"use client"

import { 
  Brain, 
  Search, 
  Globe, 
  BarChart3, 
  CheckCircle2,
  Loader2,
  Circle
} from "lucide-react"
import { useSearchStore, type AgentStep } from "@/lib/search-store"
import { useEffect, useRef } from "react"

const stepIcons: Record<AgentStep["type"], React.ReactNode> = {
  thinking: <Brain className="w-4 h-4" />,
  searching: <Search className="w-4 h-4" />,
  browsing: <Globe className="w-4 h-4" />,
  analyzing: <BarChart3 className="w-4 h-4" />,
  complete: <CheckCircle2 className="w-4 h-4" />,
}

const stepColors: Record<AgentStep["type"], string> = {
  thinking: "from-blue-500 to-cyan",
  searching: "from-cyan to-teal-500",
  browsing: "from-teal-500 to-green-500",
  analyzing: "from-purple to-pink-500",
  complete: "from-green-500 to-emerald-500",
}

function AgentStepItem({ step, isLast }: { step: AgentStep; isLast: boolean }) {
  const isActive = step.status === "active"
  const isComplete = step.status === "complete"
  
  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-5 top-10 w-0.5 h-full bg-gradient-to-b from-border to-transparent" />
      )}
      
      {/* Step icon */}
      <div 
        className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
          isActive 
            ? `bg-gradient-to-br ${stepColors[step.type]} animate-pulse shadow-lg shadow-cyan/30` 
            : isComplete
            ? `bg-gradient-to-br ${stepColors[step.type]} opacity-80`
            : "bg-secondary border border-border/50"
        }`}
      >
        {isActive ? (
          <Loader2 className="w-4 h-4 text-navy-dark animate-spin" />
        ) : isComplete ? (
          <span className="text-navy-dark">{stepIcons[step.type]}</span>
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      {/* Step content */}
      <div className={`flex-1 pb-6 transition-all duration-500 ${isActive ? "opacity-100" : isComplete ? "opacity-70" : "opacity-40"}`}>
        <div className="flex items-center gap-2">
          <h4 className={`font-medium ${isActive ? "text-cyan" : "text-foreground"}`}>
            {step.title}
          </h4>
          {isActive && (
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
        {isActive && (
          <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan to-purple animate-[progress_2s_ease-in-out_infinite] w-full origin-left" />
          </div>
        )}
      </div>
    </div>
  )
}

export function AgentSteps() {
  const { agentSteps, isAgentRunning } = useSearchStore()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to active step
  useEffect(() => {
    if (containerRef.current && agentSteps.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [agentSteps])

  if (agentSteps.length === 0 && !isAgentRunning) return null

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <div className="relative p-6 rounded-2xl bg-secondary/60 border border-border/30 backdrop-blur-xl overflow-hidden">
        {/* Animated background */}
        {isAgentRunning && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-purple/5 animate-pulse" />
        )}
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center ${isAgentRunning ? "animate-pulse" : ""}`}>
            <Brain className="w-5 h-5 text-navy-dark" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Modo Agente Autónomo</h3>
            <p className="text-xs text-muted-foreground">
              {isAgentRunning ? "Ejecutando tareas..." : "Proceso completado"}
            </p>
          </div>
        </div>
        
        {/* Steps */}
        <div ref={containerRef} className="relative max-h-[400px] overflow-y-auto">
          {agentSteps.map((step, index) => (
            <AgentStepItem 
              key={step.id} 
              step={step} 
              isLast={index === agentSteps.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
