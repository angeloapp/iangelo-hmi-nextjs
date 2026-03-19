"use client"

import { 
  Search, 
  MessageCircle, 
  Trash2, 
  Bot, 
  Moon, 
  Sun, 
  History, 
  Bookmark,
  Image,
  Newspaper,
  MapPin,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchStore, type TabType, type HistoryItem, type Bookmark as BookmarkType } from "@/lib/search-store"
import { useAgentStore } from "@/lib/agent-store"
import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Navbar() {
  const { 
    mode, 
    setMode, 
    activeTab,
    setActiveTab,
    clearMessages, 
    clearResult, 
    messages,
    theme,
    toggleTheme,
    history,
    bookmarks,
    removeBookmark,
    clearHistory,
    setQuery,
    clearAgentSteps,
  } = useSearchStore()

  const { setAgentModeOpen } = useAgentStore()
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark")
      document.documentElement.classList.toggle("light", theme === "light")
    }
  }, [theme, mounted])

  const handleModeChange = (newMode: "search" | "chat" | "agent") => {
    if (newMode === "agent") {
      // Open immersive agent mode
      setAgentModeOpen(true)
      return
    }
    
    if (newMode !== mode) {
      setMode(newMode)
      clearResult()
      clearAgentSteps()
      if (newMode === "search") {
        clearMessages()
      }
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleClearChat = () => {
    clearMessages()
    clearResult()
    clearAgentSteps()
  }

  const handleHistoryClick = (item: HistoryItem) => {
    setQuery(item.query)
    setMode(item.mode)
  }

  const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
    { id: "search", icon: <Search className="w-4 h-4" />, label: "Todo" },
    { id: "images", icon: <Image className="w-4 h-4" />, label: "Imágenes" },
    { id: "news", icon: <Newspaper className="w-4 h-4" />, label: "Noticias" },
    { id: "maps", icon: <MapPin className="w-4 h-4" />, label: "Mapas" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 backdrop-blur-xl bg-background/80 border-b border-border/30">
      <div className="max-w-7xl mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
                <span className="text-navy-dark font-bold text-lg">iA</span>
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-cyan to-purple opacity-30 blur-sm -z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground tracking-tight">
                iAngelo
              </span>
              <span className="text-[10px] text-cyan -mt-1 font-mono">
                V3.0.1 HMI Edition
              </span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModeChange("search")}
              className={`relative px-4 py-2 rounded-lg transition-all duration-300 ${
                mode === "search"
                  ? "bg-gradient-to-r from-cyan/20 to-purple/20 text-cyan"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModeChange("chat")}
              className={`relative px-4 py-2 rounded-lg transition-all duration-300 ${
                mode === "chat"
                  ? "bg-gradient-to-r from-cyan/20 to-purple/20 text-cyan"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModeChange("agent")}
              className={`relative px-4 py-2 rounded-lg transition-all duration-300 ${
                mode === "agent"
                  ? "bg-gradient-to-r from-cyan/20 to-purple/20 text-cyan"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="w-4 h-4 mr-2" />
              Agente
            </Button>
            
            {(mode === "chat" && messages.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="px-3 py-2 rounded-lg text-muted-foreground hover:text-red-400"
                title="Limpiar conversación"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* History Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-muted-foreground hover:text-cyan"
                >
                  <History className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-background border-border">
                <SheetHeader>
                  <SheetTitle className="text-foreground flex items-center justify-between">
                    Historial
                    {history.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="text-muted-foreground hover:text-red-400"
                      >
                        Limpiar
                      </Button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  {history.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Sin historial aún
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleHistoryClick(item)}
                          className="w-full p-3 rounded-xl bg-secondary/50 border border-border/30 text-left hover:border-cyan/30 transition-colors"
                        >
                          <p className="text-sm text-foreground truncate">{item.query}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.timestamp).toLocaleString("es-MX")}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Bookmarks Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-muted-foreground hover:text-cyan"
                >
                  <Bookmark className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-background border-border">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Guardados</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  {bookmarks.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Sin guardados aún
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark: BookmarkType) => (
                        <div
                          key={bookmark.id}
                          className="p-3 rounded-xl bg-secondary/50 border border-border/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground font-medium truncate flex-1">
                              {bookmark.query}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBookmark(bookmark.id)}
                              className="h-6 w-6 text-muted-foreground hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {bookmark.answer.slice(0, 100)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-xl text-muted-foreground hover:text-cyan"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            )}

            {/* Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
              <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span className="text-xs text-muted-foreground">
                Los Cabos BCS
              </span>
            </div>
          </div>
        </div>

        {/* Tab row - only show when in search mode with results */}
        {mode === "search" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? "text-cyan bg-cyan/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span className="ml-1.5">{tab.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
