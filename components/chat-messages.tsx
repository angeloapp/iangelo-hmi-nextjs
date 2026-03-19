"use client"

import { Sparkles, User, Volume2, Copy, Check, ExternalLink } from "lucide-react"
import { useSearchStore, type Message } from "@/lib/search-store"
import ReactMarkdown from "react-markdown"
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)
  const { setSpeaking } = useSearchStore()

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  const handleSpeak = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const plainText = message.content
        .replace(/#+\s/g, "")
        .replace(/\*\*/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/`/g, "")
      const utterance = new SpeechSynthesisUtterance(plainText)
      utterance.lang = "es-MX"
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [message.content, setSpeaking])

  return (
    <div className={`group flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-navy-dark" />
        </div>
      )}
      
      <div className="max-w-[85%] space-y-2">
        <div
          className={`relative p-4 rounded-2xl ${
            isUser
              ? "bg-gradient-to-r from-cyan/20 to-purple/20 border border-cyan/30"
              : "bg-secondary/60 border border-border/30"
          }`}
        >
          {isUser ? (
            <p className="text-foreground">{message.content}</p>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:text-foreground/90 prose-headings:text-foreground prose-strong:text-cyan prose-a:text-cyan prose-li:text-foreground/90 prose-sm">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "")
                    const codeString = String(children).replace(/\n$/, "")
                    
                    if (match) {
                      return (
                        <div className="relative group/code">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(codeString)}
                            className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 h-6 px-2 text-xs bg-secondary/80"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <pre className="rounded-xl bg-navy-dark p-4 overflow-x-auto text-sm">
                            <code className={`language-${match[1]} text-foreground/90`}>
                              {codeString}
                            </code>
                          </pre>
                        </div>
                      )
                    }
                    return (
                      <code className={`${className} bg-secondary px-1.5 py-0.5 rounded text-purple text-sm`} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {/* Actions - only for assistant messages */}
          {!isUser && (
            <div className="absolute -bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSpeak}
                className="h-7 w-7 p-0 rounded-lg bg-secondary border border-border/50"
              >
                <Volume2 className="w-3 h-3" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0 rounded-lg bg-secondary border border-border/50"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </div>
        
        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2">
            {message.citations.slice(0, 4).map((citation, idx) => {
              let hostname = ""
              try {
                hostname = new URL(citation).hostname.replace("www.", "")
              } catch {
                hostname = citation
              }
              return (
                <a
                  key={idx}
                  href={citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-secondary/50 text-cyan hover:bg-cyan/10 transition-colors"
                >
                  <span className="w-4 h-4 rounded bg-cyan/20 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="max-w-[80px] truncate">{hostname}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )
            })}
            {message.citations.length > 4 && (
              <span className="text-xs px-2 py-1 text-muted-foreground">
                +{message.citations.length - 4} más
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-muted-foreground px-2 ${isUser ? "text-right" : "text-left"}`}>
          {new Date(message.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary border border-border/50 flex items-center justify-center">
          <User className="w-4 h-4 text-foreground" />
        </div>
      )}
    </div>
  )
}

export function ChatMessages() {
  const { messages, isLoading, isStreaming, streamingContent } = useSearchStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  if (messages.length === 0 && !isLoading && !isStreaming) return null

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-3xl mx-auto space-y-6 max-h-[60vh] overflow-y-auto px-2"
    >
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      
      {/* Streaming message */}
      {isStreaming && streamingContent && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-navy-dark" />
          </div>
          <div className="max-w-[85%] p-4 rounded-2xl bg-secondary/60 border border-border/30">
            <div className="prose prose-invert max-w-none prose-p:text-foreground/90 prose-sm">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
              <span className="inline-block w-2 h-4 bg-cyan animate-pulse ml-0.5" />
            </div>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && !isStreaming && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-navy-dark" />
          </div>
          <div className="max-w-[80%] p-4 rounded-2xl bg-secondary/60 border border-border/30">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
