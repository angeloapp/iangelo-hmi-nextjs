"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: string[]
  images?: string[]
  timestamp: Date
}

export interface SearchResult {
  answer: string
  citations: string[]
  images?: string[]
  relatedQuestions?: string[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model?: string
  responseTime?: number
}

export interface HistoryItem {
  id: string
  query: string
  mode: "search" | "chat" | "agent"
  timestamp: Date
  preview?: string
}

export interface Bookmark {
  id: string
  query: string
  answer: string
  citations: string[]
  timestamp: Date
}

export type TabType = "search" | "images" | "news" | "maps"

interface SearchState {
  // Core
  mode: "search" | "chat" | "agent"
  activeTab: TabType
  query: string
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  result: SearchResult | null
  messages: Message[]
  
  // Agent mode
  agentSteps: AgentStep[]
  isAgentRunning: boolean
  
  // Stats
  totalQueries: number
  totalSources: number
  avgResponseTime: number
  responseTimes: number[]
  
  // History & Bookmarks (persisted)
  history: HistoryItem[]
  bookmarks: Bookmark[]
  
  // Theme
  theme: "dark" | "light"
  
  // Voice
  isSpeaking: boolean
  
  // Actions
  setMode: (mode: "search" | "chat" | "agent") => void
  setActiveTab: (tab: TabType) => void
  setQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (content: string) => void
  setResult: (result: SearchResult | null) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  clearResult: () => void
  
  // Agent
  addAgentStep: (step: AgentStep) => void
  updateAgentStep: (id: string, updates: Partial<AgentStep>) => void
  clearAgentSteps: () => void
  setAgentRunning: (running: boolean) => void
  
  // Stats
  incrementQueries: () => void
  addSources: (count: number) => void
  addResponseTime: (time: number) => void
  
  // History & Bookmarks
  addToHistory: (item: Omit<HistoryItem, "id">) => void
  clearHistory: () => void
  addBookmark: (bookmark: Omit<Bookmark, "id">) => void
  removeBookmark: (id: string) => void
  
  // Theme
  toggleTheme: () => void
  setTheme: (theme: "dark" | "light") => void
  
  // Voice
  setSpeaking: (speaking: boolean) => void
}

export interface AgentStep {
  id: string
  type: "thinking" | "searching" | "browsing" | "analyzing" | "complete"
  title: string
  description: string
  status: "pending" | "active" | "complete" | "error"
  timestamp: Date
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: "search",
      activeTab: "search",
      query: "",
      isLoading: false,
      isStreaming: false,
      streamingContent: "",
      result: null,
      messages: [],
      agentSteps: [],
      isAgentRunning: false,
      totalQueries: 0,
      totalSources: 0,
      avgResponseTime: 0,
      responseTimes: [],
      history: [],
      bookmarks: [],
      theme: "dark",
      isSpeaking: false,

      // Actions
      setMode: (mode) => set({ mode, result: null, streamingContent: "", agentSteps: [] }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setQuery: (query) => set({ query }),
      setLoading: (isLoading) => set({ isLoading }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setStreamingContent: (streamingContent) => set({ streamingContent }),
      appendStreamingContent: (content) => set((state) => ({ 
        streamingContent: state.streamingContent + content 
      })),
      setResult: (result) => set({ result }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearMessages: () => set({ messages: [], result: null, streamingContent: "" }),
      clearResult: () => set({ result: null, streamingContent: "" }),
      
      // Agent
      addAgentStep: (step) => set((state) => ({ 
        agentSteps: [...state.agentSteps, step] 
      })),
      updateAgentStep: (id, updates) => set((state) => ({
        agentSteps: state.agentSteps.map((step) =>
          step.id === id ? { ...step, ...updates } : step
        ),
      })),
      clearAgentSteps: () => set({ agentSteps: [] }),
      setAgentRunning: (isAgentRunning) => set({ isAgentRunning }),

      // Stats
      incrementQueries: () =>
        set((state) => ({ totalQueries: state.totalQueries + 1 })),
      addSources: (count) =>
        set((state) => ({ totalSources: state.totalSources + count })),
      addResponseTime: (time) =>
        set((state) => {
          const newTimes = [...state.responseTimes, time].slice(-100)
          const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length
          return { responseTimes: newTimes, avgResponseTime: Math.round(avg) }
        }),

      // History & Bookmarks
      addToHistory: (item) =>
        set((state) => ({
          history: [
            { ...item, id: crypto.randomUUID() },
            ...state.history,
          ].slice(0, 100),
        })),
      clearHistory: () => set({ history: [] }),
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [
            { ...bookmark, id: crypto.randomUUID() },
            ...state.bookmarks,
          ],
        })),
      removeBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        })),

      // Theme
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),
      
      // Voice
      setSpeaking: (isSpeaking) => set({ isSpeaking }),
    }),
    {
      name: "iangelo-storage",
      partialize: (state) => ({
        history: state.history,
        bookmarks: state.bookmarks,
        theme: state.theme,
        totalQueries: state.totalQueries,
        totalSources: state.totalSources,
        avgResponseTime: state.avgResponseTime,
        responseTimes: state.responseTimes,
      }),
    }
  )
)
