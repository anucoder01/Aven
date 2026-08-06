import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: {
        id: 'local-user',
        name: 'You',
        totalSessions: 0,
        streak: 0,
        improvementPct: 0,
      },
      completedReports: [],
      customScenarios: [],

      addCustomScenario: (scenario) => set((state) => ({
        customScenarios: [...state.customScenarios, scenario]
      })),

      addReport: (report) => set((state) => {
        const newReports = [...state.completedReports, { ...report, id: Date.now() }];
        
        let improvement = 0;
        if (newReports.length > 1) {
          const firstScore = newReports[0].assertiveness_score || 1;
          const currentScore = report.assertiveness_score || 1;
          improvement = Math.round(((currentScore - firstScore) / firstScore) * 100);
        }

        // Add to streak
        const newStreak = state.user.streak + 1;

        return {
          completedReports: newReports,
          user: { 
            ...state.user, 
            totalSessions: state.user.totalSessions + 1,
            improvementPct: improvement,
            streak: newStreak
          },
        };
      }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'aven-user-storage', // name of the item in the storage (must be unique)
    }
  )
)
