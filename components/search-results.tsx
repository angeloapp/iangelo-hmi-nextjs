"use client"

import { 
  ExternalLink, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Bookmark,
  BookmarkCheck,
  Volume2,
  ChevronRight,
  Globe,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchStore } from "@/lib/search-store"
import { useState, useCallback, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"

// Citation component with numbered badge
function CitationBadge({ index, url }: { index: number; url: string }) {
  let hostname = ""
  try {
    hostname = new URL(url).hostname.replace("www.", "")
  } catch {
    hostname = url
  }
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-md bg-cyan/10 hover:bg-cyan/20 text-cyan text-xs font-medium transition-colors"
      title={url}
    >
      <span className="w-4 h-4 rounded bg-cyan/20 flex items-center justify-center text-[10px]">
        {index + 1}
      </span>
      <span className="max-w-[100px] truncate">{hostname}</span>
    </a>
  )
}

// Source card component
function SourceCard({ citation, index }: { citation: string; index: number }) {
  let url: URL
  try {
    url = new URL(citation)
  } catch {
    return null
  }
  
  const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`
  
  return (
    <a
      href={citation}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border/20 hover:border-cyan/30 hover:bg-secondary/70 transition-all duration-300"
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan/10 to-purple/10 border border-border/30 flex items-center justify-center overflow-hidden">
          <img 
            src={favicon} 
            alt="" 
            className="w-5 h-5"
            onError={(e) => {
              e.currentTarget.style.display = "none"
              e.currentTarget.nextElementSibling?.classList.remove("hidden")
            }}
          />
          <Globe className="w-5 h-5 text-muted-foreground hidden" />
        </div>
        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-[10px] font-bold text-navy-dark">
          {index + 1}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-cyan transition-colors truncate">
          {url.hostname.replace("www.", "")}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{url.pathname}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan transition-colors flex-shrink-0 mt-1" />
    </a>
  )
}

// Related question chip
function RelatedQuestion({ question, onClick }: { question: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border/30 hover:border-cyan/30 hover:bg-secondary/70 text-sm text-foreground/90 hover:text-cyan transition-all duration-300 text-left"
    >
      <ChevronRight className="w-4 h-4 text-cyan flex-shrink-0" />
      <span className="line-clamp-1">{question}</span>
    </button>
  )
}

export function SearchResults() {
  const { 
    result, 
    isLoading, 
    isStreaming,
    streamingContent,
    mode, 
    clearResult, 
    clearMessages,
    bookmarks,
    addBookmark,
    removeBookmark,
    setQuery,
    setSpeaking,
  } = useSearchStore()
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [streamingContent, isStreaming])

  const displayContent = isStreaming ? streamingContent : result?.answer

  const handleCopy = useCallback(() => {
    if (displayContent) {
      navigator.clipboard.writeText(displayContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [displayContent])

  const handleNewSearch = useCallback(() => {
    clearResult()
    if (mode === "chat") {
      clearMessages()
    }
  }, [clearResult, clearMessages, mode])

  const handleSpeak = useCallback(() => {
    if (displayContent && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      // Strip markdown for speech
      const plainText = displayContent
        .replace(/#+\s/g, "")
        .replace(/\*\*/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/`/g, "")
      const utterance = new SpeechSynthesisUtterance(plainText)
      utterance.lang = "es-MX"
      utterance.rate = 1
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [displayContent, setSpeaking])

  const isBookmarked = result && bookmarks.some(b => b.answer === result.answer)

  const handleBookmark = useCallback(() => {
    if (!result) return
    
    if (isBookmarked) {
      const bookmark = bookmarks.find(b => b.answer === result.answer)
      if (bookmark) removeBookmark(bookmark.id)
    } else {
      addBookmark({
        query: result.answer.slice(0, 50),
        answer: result.answer,
        citations: result.citations,
        timestamp: new Date(),
      })
    }
  }, [result, isBookmarked, bookmarks, addBookmark, removeBookmark])

  const handleRelatedQuestion = useCallback((question: string) => {
    setQuery(question)
  }, [setQuery])

  // Loading skeleton
  if (isLoading && !isStreaming) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8">
        <div className="relative p-6 rounded-2xl bg-secondary/60 border border-border/30 backdrop-blur-xl overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-navy-dark" />
            </div>
            <span className="text-foreground font-medium">iAngelo está procesando...</span>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-border/50 rounded animate-pulse w-full" />
            <div className="h-4 bg-border/50 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-border/50 rounded animate-pulse w-4/6" />
            <div className="h-4 bg-border/50 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (!displayContent && !isStreaming) return null

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 space-y-4">
      {/* Answer Card */}
      <div className="relative p-6 rounded-2xl bg-secondary/60 border border-border/30 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center ${isStreaming ? "animate-pulse" : ""}`}>
              <Sparkles className="w-4 h-4 text-navy-dark" />
            </div>
            <span className="text-foreground font-medium">
              {isStreaming ? "iAngelo está escribiendo..." : "Respuesta de iAngelo"}
            </span>
            {isStreaming && (
              <span className="flex gap-1 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeak}
              className="text-muted-foreground hover:text-purple h-8 w-8 p-0"
              title="Leer en voz alta"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-cyan h-8 w-8 p-0"
              title="Copiar"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            {!isStreaming && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={`h-8 w-8 p-0 ${isBookmarked ? "text-cyan" : "text-muted-foreground hover:text-cyan"}`}
                title={isBookmarked ? "Quitar de guardados" : "Guardar"}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewSearch}
              className="text-muted-foreground hover:text-cyan h-8 w-8 p-0"
              title="Nueva búsqueda"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Answer Content with Streaming */}
        <div 
          ref={contentRef}
          className="prose prose-invert max-w-none prose-p:text-foreground/90 prose-headings:text-foreground prose-strong:text-cyan prose-a:text-cyan prose-li:text-foreground/90 prose-code:text-purple prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded max-h-[60vh] overflow-y-auto"
        >
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                const codeString = String(children).replace(/\n$/, "")
                
                if (match) {
                  return (
                    <div className="relative group">
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(codeString)}
                          className="h-7 px-2 text-xs bg-secondary/80"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-xl !bg-navy-dark !mt-0"
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  )
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {displayContent}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-5 bg-cyan animate-pulse ml-1" />
          )}
        </div>

        {/* Response metadata */}
        {!isStreaming && result && (
          <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {result.model && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan" />
                {result.model}
              </span>
            )}
            {result.responseTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.responseTime}ms
              </span>
            )}
            {result.usage && (
              <span>{result.usage.total_tokens.toLocaleString()} tokens</span>
            )}
          </div>
        )}
      </div>

      {/* Citations/Sources */}
      {!isStreaming && result?.citations && result.citations.length > 0 && (
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/30 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan" />
            Fuentes ({result.citations.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.citations.map((citation, index) => (
              <SourceCard key={index} citation={citation} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Related Questions */}
      {!isStreaming && result?.relatedQuestions && result.relatedQuestions.length > 0 && (
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/30 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple" />
            Preguntas relacionadas
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.relatedQuestions.slice(0, 4).map((question, index) => (
              <RelatedQuestion 
                key={index} 
                question={question} 
                onClick={() => handleRelatedQuestion(question)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {!isStreaming && result?.images && result.images.length > 0 && (
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/30 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple" />
            Imágenes relacionadas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {result.images.slice(0, 6).map((image, index) => (
              <a
                key={index}
                href={image}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-video rounded-xl overflow-hidden bg-secondary border border-border/30 hover:border-cyan/30 transition-colors"
              >
                <img
                  src={image}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
