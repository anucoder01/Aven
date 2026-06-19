import { create } from 'zustand'

export const useSessionStore = create((set, get) => ({
  // Session state
  activeSession: null,
  messages: [],
  distortionEvents: [],
  avoidanceEvents: [],
  isCharacterTyping: false,
  voiceMode: false,
  isRecording: false,
  sessionStartTime: null,

  // Live stats
  liveStats: {
    catastrophizing: 0,
    mind_reading: 0,
    all_or_nothing: 0,
    personalization: 0,
    fortune_telling: 0,
    should_statements: 0,
    emotional_reasoning: 0,
    labeling: 0,
    avoidance_count: 0,
  },

  // Actions
  startSession: (scenario, level) => {
    set({
      activeSession: { scenario, level, id: Date.now() },
      messages: [],
      distortionEvents: [],
      avoidanceEvents: [],
      sessionStartTime: Date.now(),
      liveStats: {
        catastrophizing: 0, mind_reading: 0, all_or_nothing: 0,
        personalization: 0, fortune_telling: 0, should_statements: 0,
        emotional_reasoning: 0, labeling: 0, avoidance_count: 0,
      },
    })
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, { ...message, id: Date.now(), timestamp: new Date().toLocaleTimeString() }] }))
  },

  addDistortions: (messageId, distortions) => {
    set((state) => {
      const newStats = { ...state.liveStats }
      distortions.forEach(d => {
        newStats[d.key] = (newStats[d.key] || 0) + 1
      })
      return {
        distortionEvents: [...state.distortionEvents, { messageId, distortions }],
        liveStats: newStats,
        messages: state.messages.map(m => m.id === messageId ? { ...m, distortions } : m),
      }
    })
  },

  addAvoidance: (event) => {
    set((state) => ({
      avoidanceEvents: [...state.avoidanceEvents, event],
      liveStats: { ...state.liveStats, avoidance_count: state.liveStats.avoidance_count + 1 },
    }))
  },

  setCharacterTyping: (val) => set({ isCharacterTyping: val }),
  setVoiceMode: (val) => set({ voiceMode: val }),
  setRecording: (val) => set({ isRecording: val }),
  endSession: () => set({ activeSession: null }),
  clearSession: () => set({ activeSession: null, messages: [], distortionEvents: [], avoidanceEvents: [] }),
}))
