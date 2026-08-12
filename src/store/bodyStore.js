import { create } from 'zustand'

export const useBodyStore = create((set, get) => ({
  // ─── Pre/Post Session Check-ins ───
  checkIns: [],

  addCheckIn: (checkIn) => set(state => ({
    checkIns: [...state.checkIns, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      sessionId: null,
      phase: 'pre', // pre | during | post
      // Body scan scores 1-7
      heartRate: 4,
      muscleTension: 4,
      breathingEase: 4,
      dizziness: 1,
      nausea: 1,
      temperature: 4,
      trembling: 1,
      suds: 5, // overall distress 1-10
      ...checkIn,
    }]
  })),

  getLatestCheckIn: (phase) => {
    const all = get().checkIns.filter(c => c.phase === phase)
    return all[all.length - 1] || null
  },

  getSessionCheckIns: (sessionId) => get().checkIns.filter(c => c.sessionId === sessionId),

  // ─── Biomarker Baseline ───
  biomarkerBaseline: null, // established after 3 sessions
  biomarkerHistory: [], // { sessionId, avgPitch, pitchSD, avgEnergy, speechRate, timestamp }

  updateBaseline: (data) => set({ biomarkerBaseline: data }),

  // ─── Spike Events ───
  spikeEvents: [],
  addSpike: (spike) => set(state => ({
    spikeEvents: [...state.spikeEvents, { id: Date.now(), timestamp: Date.now(), ...spike }]
  })),

  // ─── Clinical Assessments ───
  assessments: {
    lsas: [],    // Liebowitz Social Anxiety Scale
    phq4: [],   // PHQ-4 brief screener
    suds: [],   // per-session SUDS track
  },

  addAssessment: (type, data) => set(state => ({
    assessments: {
      ...state.assessments,
      [type]: [...state.assessments[type], { id: Date.now(), date: new Date().toISOString(), ...data }]
    }
  })),

  getLatestAssessment: (type) => {
    const list = get().assessments[type]
    return list[list.length - 1] || null
  },

  // ─── Real-world Exposure Log ───
  exposureLog: [],

  addExposure: (entry) => set(state => ({
    exposureLog: [...state.exposureLog, {
      id: Date.now(),
      date: new Date().toISOString(),
      situation: '',
      sudsBefore: 5,
      sudsAfter: 5,
      whatWentWell: '',
      avoidanceUsed: false,
      challengeId: null,
      ...entry,
    }]
  })),

  // Weekly challenges
  activeChallenges: [
    { id: 1, title: 'Strike up a conversation with a cashier', difficulty: 'Easy', domain: 'stranger', suds: 25, completed: false },
    { id: 2, title: 'Ask a colleague for their opinion on something', difficulty: 'Medium', domain: 'workplace', suds: 45, completed: false },
    { id: 3, title: 'Disagree with a friend on a minor topic', difficulty: 'Medium', domain: 'group', suds: 55, completed: false },
  ],

  completeChallenge: (id) => set(state => ({
    activeChallenges: state.activeChallenges.map(c => c.id === id ? { ...c, completed: true, completedAt: new Date().toISOString() } : c)
  })),
}))
