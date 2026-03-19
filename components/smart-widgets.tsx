"use client"

import { Calculator, Cloud, Code, Equal, Thermometer, Droplets, Wind } from "lucide-react"
import { useSearchStore } from "@/lib/search-store"
import { useMemo } from "react"

// Calculator widget - detects math expressions
function CalculatorWidget({ expression, result }: { expression: string; result: number }) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan/10 to-purple/10 border border-cyan/30 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
          <Calculator className="w-4 h-4 text-navy-dark" />
        </div>
        <span className="text-sm font-medium text-foreground">Calculadora</span>
      </div>
      <div className="space-y-2">
        <p className="text-lg text-muted-foreground font-mono">{expression}</p>
        <div className="flex items-center gap-2">
          <Equal className="w-4 h-4 text-cyan" />
          <p className="text-3xl font-bold bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent">
            {result.toLocaleString("es-MX", { maximumFractionDigits: 6 })}
          </p>
        </div>
      </div>
    </div>
  )
}

// Weather widget - shows current weather
function WeatherWidget({ location }: { location: string }) {
  // Mock weather data (in production, use a weather API)
  const weather = {
    temp: 28,
    condition: "Soleado",
    humidity: 65,
    wind: 12,
    icon: "☀️",
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan/10 border border-blue-500/30 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan flex items-center justify-center">
          <Cloud className="w-4 h-4 text-navy-dark" />
        </div>
        <span className="text-sm font-medium text-foreground">{location}</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">{weather.temp}</span>
            <span className="text-xl text-muted-foreground">°C</span>
          </div>
          <p className="text-muted-foreground">{weather.condition}</p>
        </div>
        <span className="text-5xl">{weather.icon}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wind className="w-4 h-4 text-cyan" />
          <span>{weather.wind} km/h</span>
        </div>
      </div>
    </div>
  )
}

// Code snippet widget
function CodeWidget({ code, language }: { code: string; language: string }) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple/10 to-pink-500/10 border border-purple/30 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-pink-500 flex items-center justify-center">
          <Code className="w-4 h-4 text-navy-dark" />
        </div>
        <span className="text-sm font-medium text-foreground">Código {language}</span>
      </div>
      <pre className="p-3 rounded-xl bg-navy-dark text-sm overflow-x-auto">
        <code className="text-cyan">{code}</code>
      </pre>
    </div>
  )
}

// Smart widget detector
export function SmartWidgets() {
  const { result, mode } = useSearchStore()
  
  const widgets = useMemo(() => {
    if (!result?.answer || mode !== "search") return []
    
    const query = result.answer.toLowerCase()
    const detectedWidgets: JSX.Element[] = []
    
    // Detect math expressions
    const mathMatch = query.match(/(\d+[\s]*[+\-*/^][\s]*\d+[\s]*([+\-*/^][\s]*\d+)*)/g)
    if (mathMatch) {
      try {
        const expression = mathMatch[0].replace(/\^/g, "**")
        // Safe eval for simple math
        const sanitized = expression.replace(/[^0-9+\-*/.()\s]/g, "")
        const calcResult = Function(`"use strict"; return (${sanitized})`)()
        if (typeof calcResult === "number" && !isNaN(calcResult)) {
          detectedWidgets.push(
            <CalculatorWidget 
              key="calc" 
              expression={mathMatch[0]} 
              result={calcResult} 
            />
          )
        }
      } catch {
        // Invalid expression, skip
      }
    }
    
    // Detect weather queries
    const weatherKeywords = ["clima", "weather", "temperatura", "pronóstico", "lluvia", "sol"]
    const locationKeywords = ["los cabos", "cabo san lucas", "san josé del cabo", "la paz", "bcs"]
    
    if (weatherKeywords.some(w => query.includes(w)) || locationKeywords.some(l => query.includes(l))) {
      detectedWidgets.push(
        <WeatherWidget 
          key="weather" 
          location="Los Cabos, BCS" 
        />
      )
    }
    
    // Detect code blocks in response
    const codeMatch = result.answer.match(/```(\w+)?\n([\s\S]*?)```/)
    if (codeMatch) {
      detectedWidgets.push(
        <CodeWidget 
          key="code" 
          code={codeMatch[2].trim().slice(0, 200)} 
          language={codeMatch[1] || "text"} 
        />
      )
    }
    
    return detectedWidgets
  }, [result, mode])
  
  if (widgets.length === 0) return null
  
  return (
    <div className="w-full max-w-3xl mx-auto mb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {widgets}
      </div>
    </div>
  )
}
