"use client"

import { MapPin, Navigation, ExternalLink } from "lucide-react"
import { useSearchStore } from "@/lib/search-store"
import { Button } from "@/components/ui/button"

export function MapsResults() {
  const { result, isLoading, isStreaming } = useSearchStore()

  // Default to Los Cabos, BCS coordinates
  const defaultLat = 22.8905
  const defaultLon = -109.9167
  const defaultZoom = 12

  // Extract location from query (simplified - in production use geocoding API)
  const searchQuery = result?.answer ? "Los Cabos BCS Mexico" : ""

  if (isLoading || isStreaming) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="aspect-video rounded-2xl bg-secondary/50 border border-border/30 animate-pulse flex items-center justify-center">
          <MapPin className="w-12 h-12 text-muted-foreground animate-bounce" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-4">
      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-secondary/50">
        {/* OpenStreetMap embed */}
        <iframe
          title="Mapa"
          width="100%"
          height="450"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${defaultLon - 0.1}%2C${defaultLat - 0.1}%2C${defaultLon + 0.1}%2C${defaultLat + 0.1}&layer=mapnik&marker=${defaultLat}%2C${defaultLon}`}
          className="rounded-2xl"
        />
        
        {/* Overlay controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/90 backdrop-blur-xl border border-border/30">
            <MapPin className="w-4 h-4 text-cyan" />
            <span className="text-sm text-foreground">Los Cabos, BCS, México</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery || "Los Cabos BCS")}`, "_blank")}
              className="gap-1 bg-secondary/90 backdrop-blur-xl"
            >
              <ExternalLink className="w-4 h-4" />
              Google Maps
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${defaultLat}&mlon=${defaultLon}#map=${defaultZoom}/${defaultLat}/${defaultLon}`, "_blank")}
              className="gap-1 bg-secondary/90 backdrop-blur-xl"
            >
              <Navigation className="w-4 h-4" />
              OpenStreetMap
            </Button>
          </div>
        </div>
      </div>

      {/* Location info card */}
      <div className="p-4 rounded-2xl bg-secondary/50 border border-border/30">
        <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan" />
          Tecnología Los Cabos BCS
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          iAngelo V3.0.1 - Desarrollado con orgullo en Baja California Sur, México. 
          El futuro de la búsqueda inteligente, desde el paraíso mexicano.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/20">
            <p className="text-muted-foreground text-xs">Latitud</p>
            <p className="text-foreground font-mono">{defaultLat}°</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/20">
            <p className="text-muted-foreground text-xs">Longitud</p>
            <p className="text-foreground font-mono">{defaultLon}°</p>
          </div>
        </div>
      </div>
    </div>
  )
}
