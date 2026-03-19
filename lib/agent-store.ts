"use client"

import { create } from "zustand"

export type AgentStatus = "idle" | "planning" | "executing" | "complete" | "error"

export type BrowserActionType = 
  | "navigate" 
  | "click" 
  | "type" 
  | "scroll" 
  | "screenshot" 
  | "extract" 
  | "wait"
  | "complete"
  | "error"
  | "thinking"

export interface BrowserAction {
  id: string
  type: BrowserActionType
  description: string
  target?: string
  value?: string
  url?: string
  screenshot?: string
  status: "pending" | "running" | "done" | "error"
  timestamp: Date
  duration?: number
}

export interface AgentTask {
  id: string
  task: string
  url?: string
  status: AgentStatus
  actions: BrowserAction[]
  result?: string
  startTime: Date
  endTime?: Date
}

interface AgentState {
  // Browser state
  isAgentModeOpen: boolean
  currentUrl: string
  currentTask: AgentTask | null
  status: AgentStatus
  actions: BrowserAction[]
  
  // Voice
  isSpeaking: boolean
  voiceEnabled: boolean
  
  // UI state
  isFullscreen: boolean
  showActionLog: boolean
  
  // Actions
  setAgentModeOpen: (open: boolean) => void
  setCurrentUrl: (url: string) => void
  setStatus: (status: AgentStatus) => void
  startTask: (task: string, url?: string) => void
  addAction: (action: Omit<BrowserAction, "id" | "timestamp">) => void
  updateAction: (id: string, updates: Partial<BrowserAction>) => void
  completeTask: (result?: string) => void
  clearTask: () => void
  setSpeaking: (speaking: boolean) => void
  setVoiceEnabled: (enabled: boolean) => void
  setFullscreen: (fullscreen: boolean) => void
  setShowActionLog: (show: boolean) => void
}

export const useAgentStore = create<AgentState>((set, get) => ({
  // Initial state
  isAgentModeOpen: false,
  currentUrl: "",
  currentTask: null,
  status: "idle",
  actions: [],
  isSpeaking: false,
  voiceEnabled: true,
  isFullscreen: false,
  showActionLog: true,

  // Actions
  setAgentModeOpen: (open) => set({ isAgentModeOpen: open }),
  
  setCurrentUrl: (url) => set({ currentUrl: url }),
  
  setStatus: (status) => set({ status }),
  
  startTask: (task, url) => {
    const newTask: AgentTask = {
      id: crypto.randomUUID(),
      task,
      url,
      status: "planning",
      actions: [],
      startTime: new Date(),
    }
    set({ 
      currentTask: newTask, 
      status: "planning", 
      actions: [],
      currentUrl: url || ""
    })
  },
  
  addAction: (action) => {
    const newAction: BrowserAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    set((state) => ({
      actions: [...state.actions, newAction],
      currentTask: state.currentTask
        ? { ...state.currentTask, actions: [...state.currentTask.actions, newAction] }
        : null,
    }))
    return newAction.id
  },
  
  updateAction: (id, updates) => {
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }))
  },
  
  completeTask: (result) => {
    set((state) => ({
      status: "complete",
      currentTask: state.currentTask
        ? { 
            ...state.currentTask, 
            status: "complete", 
            result, 
            endTime: new Date() 
          }
        : null,
    }))
  },
  
  clearTask: () => {
    set({
      currentTask: null,
      status: "idle",
      actions: [],
      currentUrl: "",
    })
  },
  
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setShowActionLog: (showActionLog) => set({ showActionLog }),
}))

// Voice synthesis helper
export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "es-MX"
  utterance.rate = 1.1
  utterance.pitch = 1.0
  
  if (onEnd) {
    utterance.onend = onEnd
  }
  
  window.speechSynthesis.speak(utterance)
}
