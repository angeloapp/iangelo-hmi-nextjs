"use client"

import { ExternalLink, Download, ZoomIn } from "lucide-react"
import { useSearchStore } from "@/lib/search-store"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ImageItem {
  url: string
  title?: string
  source?: string
}

function ImageCard({ image, onClick }: { image: ImageItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden bg-secondary border border-border/30 hover:border-cyan/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan/10"
    >
      <img
        src={image.url}
        alt={image.title || "Imagen de búsqueda"}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-xs text-foreground truncate">{image.title || "Ver imagen"}</p>
          {image.source && (
            <p className="text-[10px] text-muted-foreground truncate">{image.source}</p>
          )}
        </div>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-secondary/90 backdrop-blur flex items-center justify-center">
          <ZoomIn className="w-4 h-4 text-cyan" />
        </div>
      </div>
    </button>
  )
}

export function ImageResults() {
  const { result, isLoading, isStreaming } = useSearchStore()
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)

  // Mock images for demo (in production, these would come from the API)
  const images: ImageItem[] = result?.images?.map(url => ({
    url,
    title: "Imagen relacionada",
    source: new URL(url).hostname,
  })) || []

  if (isLoading || isStreaming) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="aspect-square rounded-xl bg-secondary/50 border border-border/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
          <ZoomIn className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No hay imágenes</h3>
        <p className="text-muted-foreground text-sm">
          Realiza una búsqueda para ver imágenes relacionadas
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-5xl mx-auto mt-8">
        <p className="text-sm text-muted-foreground mb-4">
          {images.length} imágenes encontradas
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <ImageCard 
              key={index} 
              image={image} 
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
      </div>

      {/* Image lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-navy-dark border-border/30 p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Vista de imagen</DialogTitle>
          </VisuallyHidden>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.title || "Imagen"}
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-navy-dark to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{selectedImage.title}</p>
                    {selectedImage.source && (
                      <p className="text-xs text-muted-foreground">{selectedImage.source}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(selectedImage.url, "_blank")}
                      className="gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      asChild
                      className="gap-1"
                    >
                      <a href={selectedImage.url} download>
                        <Download className="w-4 h-4" />
                        Descargar
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
