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

      addReport: (report) => set((state) => {
        const newReports = [...state.completedReports, { ...report, id: Date.now() }];
        
        // Calculate dynamic improvement vs first session if we have >1 sessions
        let improvement = 0;
        if (newReports.length > 1) {
          const firstScore = newReports[0].assertiveness_score || 1;
          const currentScore = report.assertiveness_score || 1;
          improvement = Math.round(((currentScore - firstScore) / firstScore) * 100);
        }

        // Simple streak calc (just adds 1 if within 24h, simplified here)
        return {
          completedReports: newReports,
          user: { 
            ...state.user, 
            totalSessions: state.user.totalSessions + 1,
            improvementPct: improvement,
            streak: state.user.streak === 0 ? 1 : state.user.streak // mock streak
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
