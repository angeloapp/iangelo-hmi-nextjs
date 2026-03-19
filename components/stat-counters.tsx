"use client"

import { useEffect, useState, useRef } from "react"
import { Database, Globe, Zap, TrendingUp } from "lucide-react"
import { useSearchStore } from "@/lib/search-store"

interface StatCounterProps {
  endValue: number
  suffix: string
  label: string
  icon: React.ElementType
  duration?: number
  decimals?: number
  trend?: number
}

function StatCounter({ endValue, suffix, label, icon: Icon, duration = 2000, decimals = 0, trend }: StatCounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const newValue = easeOutQuart * endValue
      setCount(decimals > 0 ? parseFloat(newValue.toFixed(decimals)) : Math.floor(newValue))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isVisible, endValue, duration, decimals])

  // Update count when endValue changes (for real-time updates)
  useEffect(() => {
    if (isVisible) {
      setCount(endValue)
    }
  }, [endValue, isVisible])

  return (
    <div
      ref={ref}
      className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-b from-secondary/60 to-secondary/20 border border-border/30 backdrop-blur-xl transition-all duration-300 hover:border-cyan/30 hover:shadow-lg hover:shadow-cyan/5"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative mb-4 p-3 rounded-xl bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/20">
        <Icon className="w-6 h-6 text-cyan" />
      </div>
      
      <div className="relative flex items-baseline gap-1">
        <span className="text-4xl font-bold bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent">
          {count.toLocaleString()}
        </span>
        <span className="text-xl font-semibold text-cyan">{suffix}</span>
      </div>
      
      <span className="relative mt-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>

      {trend !== undefined && trend > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
          <TrendingUp className="w-3 h-3" />
          +{trend}
        </div>
      )}
    </div>
  )
}

export function StatCounters() {
  const { totalQueries, totalSources, avgResponseTime } = useSearchStore()
  
  // Base stats + session stats
  const stats = [
    {
      endValue: 2847 + totalQueries,
      suffix: "M+",
      label: "Consultas Procesadas",
      icon: Database,
      decimals: 0,
      trend: totalQueries > 0 ? totalQueries : undefined,
    },
    {
      endValue: 156 + Math.floor(totalSources / 1000),
      suffix: "K+",
      label: "Fuentes Indexadas",
      icon: Globe,
      decimals: 0,
      trend: totalSources > 0 ? totalSources : undefined,
    },
    {
      endValue: avgResponseTime > 0 ? avgResponseTime : 300,
      suffix: "ms",
      label: "Velocidad Promedio",
      icon: Zap,
      decimals: 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {stats.map((stat, index) => (
        <StatCounter
          key={index}
          endValue={stat.endValue}
          suffix={stat.suffix}
          label={stat.label}
          icon={stat.icon}
          duration={2000 + index * 200}
          decimals={stat.decimals}
          trend={stat.trend}
        />
      ))}
    </div>
  )
}
