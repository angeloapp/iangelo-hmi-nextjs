"use client"

import { ExternalLink, Calendar, Globe, Newspaper } from "lucide-react"
import { useSearchStore } from "@/lib/search-store"

interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  image?: string
}

function NewsCard({ news }: { news: NewsItem }) {
  const favicon = `https://www.google.com/s2/favicons?domain=${new URL(news.url).hostname}&sz=32`
  
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/30 hover:border-cyan/30 hover:bg-secondary/70 transition-all duration-300"
    >
      {news.image && (
        <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-secondary">
          <img
            src={news.image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground group-hover:text-cyan transition-colors line-clamp-2 mb-1">
          {news.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {news.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <img src={favicon} alt="" className="w-4 h-4" />
            {news.source}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(news.publishedAt).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </span>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan transition-colors flex-shrink-0" />
    </a>
  )
}

export function NewsResults() {
  const { result, isLoading, isStreaming } = useSearchStore()

  // Extract news from citations (in a real app, you'd have a dedicated news API)
  const news: NewsItem[] = result?.citations?.slice(0, 6).map((url, index) => {
    let hostname = ""
    try {
      hostname = new URL(url).hostname.replace("www.", "")
    } catch {
      hostname = "Fuente"
    }
    
    return {
      title: `Artículo relacionado ${index + 1}`,
      description: result?.answer?.slice(index * 100, (index + 1) * 100) || "Sin descripción disponible",
      url,
      source: hostname,
      publishedAt: new Date().toISOString(),
    }
  }) || []

  if (isLoading || isStreaming) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className="flex gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/30"
          >
            <div className="w-24 h-24 rounded-xl bg-border/50 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-border/50 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-border/50 rounded animate-pulse w-full" />
              <div className="h-4 bg-border/50 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
          <Newspaper className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No hay noticias</h3>
        <p className="text-muted-foreground text-sm">
          Realiza una búsqueda para ver noticias relacionadas
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <p className="text-sm text-muted-foreground mb-4">
        {news.length} artículos encontrados
      </p>
      <div className="space-y-3">
        {news.map((item, index) => (
          <NewsCard key={index} news={item} />
        ))}
      </div>
    </div>
  )
}
