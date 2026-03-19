"use client"

import { Navbar } from "@/components/navbar"
import { ParticleBackground } from "@/components/particle-background"
import { HeroSection } from "@/components/hero-section"
import { StatCounters } from "@/components/stat-counters"
import { AgentBrowser } from "@/components/agent-browser"
import { useSearchStore } from "@/lib/search-store"

export default function Home() {
  const { mode, result, messages, isLoading, isStreaming, agentSteps } = useSearchStore()
  
  const hasContent = mode === 'search' 
    ? (result !== null || isLoading || isStreaming) 
    : mode === 'chat'
    ? (messages.length > 0 || isLoading || isStreaming)
    : (agentSteps.length > 0)

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-navy-dark via-background to-navy-dark">
      {/* Agent Browser Modal */}
      <AgentBrowser />
      
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        
        {/* Stats Section - Only show when no results */}
        {!hasContent && (
          <section className="relative py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Rendimiento en tiempo real
                </h2>
                <p className="text-muted-foreground">
                  Métricas de nuestro sistema de búsqueda inteligente
                </p>
              </div>
              <StatCounters />
            </div>
          </section>
        )}
        
        {/* Footer */}
        <footer className="relative py-8 px-4 border-t border-border/30">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
                <span className="text-navy-dark font-bold text-sm">iA</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © 2026-2036 iAngelo V3.0.1 HMI Edition — Tecnología Los Cabos BCS
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30">
                The Future of Search is Here
              </span>
              <span className="text-xs text-cyan px-3 py-1.5 rounded-full bg-cyan/10 border border-cyan/30">
                Hecho en Los Cabos, México
              </span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
