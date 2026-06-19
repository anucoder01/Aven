import { create } from 'zustand'

// Persists character memories per scenario across sessions
// Injected into LLM system prompt as [MEMORY_CONTEXT]
export const useCharacterMemoryStore = create((set, get) => ({
  memories: {}, // { [scenarioId]: { sessions: [], lastFumbled: '', avoidanceSignature: '', strongMoments: [] } }

  getMemory: (scenarioId) => {
    return get().memories[scenarioId] || { sessions: 0, lastFumbled: null, avoidanceSignature: null, strongMoments: [] }
  },

  recordSession: (scenarioId, { fumbledTopic, avoidancePattern, strongMoment, assertivenessScore }) => {
    set(state => {
      const existing = state.memories[scenarioId] || { sessions: 0, lastFumbled: null, avoidanceSignature: null, strongMoments: [] }
      return {
        memories: {
          ...state.memories,
          [scenarioId]: {
            sessions: existing.sessions + 1,
            lastFumbled: fumbledTopic || existing.lastFumbled,
            avoidanceSignature: avoidancePattern || existing.avoidanceSignature,
            strongMoments: strongMoment
              ? [...existing.strongMoments.slice(-4), strongMoment]
              : existing.strongMoments,
            lastAssertiveness: assertivenessScore,
          },
        },
      }
    })
  },

  // Builds the [MEMORY_CONTEXT] string injected into system prompt
  buildMemoryContext: (scenarioId) => {
    const mem = get().memories[scenarioId]
    if (!mem || mem.sessions === 0) return ''
    const parts = [`[MEMORY_CONTEXT — ${mem.sessions} previous session(s)]`]
    if (mem.lastFumbled) parts.push(`Last time, the user struggled with: "${mem.lastFumbled}". You can reference this subtly.`)
    if (mem.avoidanceSignature) parts.push(`Their avoidance pattern: ${mem.avoidanceSignature}. Notice if they use it again.`)
    if (mem.strongMoments?.length) parts.push(`Their strongest moment last session: "${mem.strongMoments[mem.strongMoments.length - 1]}". You remember this.`)
    return parts.join('\n')
  },

  clearMemory: (scenarioId) => set(state => ({
    memories: { ...state.memories, [scenarioId]: undefined }
  })),
}))
