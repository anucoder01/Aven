import { create } from 'zustand'

export const useTherapyStore = create((set, get) => ({
  // ─── Thought Records ───
  thoughtRecords: [],

  addThoughtRecord: (record) => set(state => ({
    thoughtRecords: [...state.thoughtRecords, {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      situation: '', automaticThought: '', emotion: '', emotionIntensity: 5,
      evidenceFor: '', evidenceAgainst: '', balancedThought: '', outcome: '',
      sessionId: null, distortionsLinked: [],
      ...record,
    }]
  })),

  updateThoughtRecord: (id, updates) => set(state => ({
    thoughtRecords: state.thoughtRecords.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  deleteThoughtRecord: (id) => set(state => ({
    thoughtRecords: state.thoughtRecords.filter(r => r.id !== id)
  })),

  // ─── Fear Hierarchy ───
  fearHierarchy: [
    { id: 1, situation: 'Making eye contact with a stranger', suds: 20, practiced: false, scenarioId: 'B1' },
    { id: 2, situation: 'Asking for directions from a stranger', suds: 35, practiced: false, scenarioId: 'B1' },
    { id: 3, situation: 'Making a complaint at a restaurant', suds: 40, practiced: false, scenarioId: 'D3' },
    { id: 4, situation: 'Disagreeing with a friend\'s opinion', suds: 50, practiced: false, scenarioId: 'C1' },
    { id: 5, situation: 'Returning a defective item to a store', suds: 55, practiced: false, scenarioId: 'D1' },
    { id: 6, situation: 'Making small talk with a colleague', suds: 60, practiced: false, scenarioId: 'E1' },
    { id: 7, situation: 'Disagreeing in a group meeting', suds: 70, practiced: false, scenarioId: 'C1' },
    { id: 8, situation: 'Asking a friend for emotional support', suds: 75, practiced: false, scenarioId: 'F1' },
    { id: 9, situation: 'Defending my work to a senior person', suds: 80, practiced: false, scenarioId: 'A1' },
    { id: 10, situation: 'Setting a boundary with a parent', suds: 90, practiced: false, scenarioId: 'A5' },
  ],

  addFearItem: (item) => set(state => ({
    fearHierarchy: [...state.fearHierarchy, { id: Date.now(), practiced: false, suds: 50, ...item }]
      .sort((a, b) => a.suds - b.suds)
  })),

  updateFearItem: (id, updates) => set(state => ({
    fearHierarchy: state.fearHierarchy.map(i => i.id === id ? { ...i, ...updates } : i)
      .sort((a, b) => a.suds - b.suds)
  })),

  deleteFearItem: (id) => set(state => ({
    fearHierarchy: state.fearHierarchy.filter(i => i.id !== id)
  })),

  markFearPracticed: (id) => set(state => ({
    fearHierarchy: state.fearHierarchy.map(i => i.id === id ? { ...i, practiced: true, practicedAt: new Date().toISOString() } : i)
  })),

  // ─── Behavioral Experiments ───
  experiments: [],

  addExperiment: (exp) => set(state => ({
    experiments: [...state.experiments, {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      prediction: '', actionPlan: '', outcome: '', analysis: '',
      predictionScore: null, // 0-100: how bad did they predict vs. reality
      status: 'planned', // planned | completed
      sessionId: null, distortionLinked: null,
      ...exp,
    }]
  })),

  updateExperiment: (id, updates) => set(state => ({
    experiments: state.experiments.map(e => e.id === id ? { ...e, ...updates } : e)
  })),

  // Calculates prediction accuracy across completed experiments
  getPredictionAccuracy: () => {
    const completed = get().experiments.filter(e => e.status === 'completed' && e.predictionScore !== null)
    if (!completed.length) return null
    const avgScore = completed.reduce((s, e) => s + e.predictionScore, 0) / completed.length
    return Math.round(100 - avgScore) // higher = you were more wrong = good (outcomes were better than feared)
  },

  // ─── Imagery Rescripting ───
  rescriptingSessions: [],

  addRescriptingSession: (session) => set(state => ({
    rescriptingSessions: [...state.rescriptingSessions, {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      originalMemory: '', rescriptedMemory: '', phase: 1,
      completedAt: null, ...session,
    }]
  })),

  updateRescriptingSession: (id, updates) => set(state => ({
    rescriptingSessions: state.rescriptingSessions.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  // ─── Socratic Sessions ───
  socraticSessions: [],

  addSocraticSession: (session) => set(state => ({
    socraticSessions: [...state.socraticSessions, {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      startingThought: '',
      exchanges: [], // { question, answer }
      conclusionThought: '',
      ...session,
    }]
  })),

  updateSocraticSession: (id, updates) => set(state => ({
    socraticSessions: state.socraticSessions.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
}))
