import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Brain, Target, Compass, Star, Lock } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { useBodyStore } from '../../store/bodyStore'

function calculateXP(completedReports, exposureLog, user) {
  // Assertiveness (Speaker): 10 XP per assertiveness point > 5
  let speakerXP = 0
  completedReports.forEach(r => {
    if (r.assertiveness_score > 5) {
      speakerXP += Math.round((r.assertiveness_score - 5) * 10)
    }
  })

  // Cognitive Flexibility (Observer): 50 XP for every session with <= 1 distortion
  let observerXP = 0
  completedReports.forEach(r => {
    const totalDistortions = r.top_distortions?.reduce((sum, d) => sum + d.count, 0) || 0
    if (totalDistortions <= 1) observerXP += 50
    else if (totalDistortions <= 3) observerXP += 20
  })

  // Exposure Tolerance (Explorer): 50 XP per exposure logged + 10 XP per SUDS drop
  let explorerXP = 0
  exposureLog.forEach(e => {
    explorerXP += 50
    const drop = e.sudsBefore - e.sudsAfter
    if (drop > 0) explorerXP += drop * 10
  })

  // Consistency (Stoic): 20 XP per session + 50 XP per streak day
  let stoicXP = (user.totalSessions * 20) + (user.streak * 50)

  return { speakerXP, observerXP, explorerXP, stoicXP }
}

function getLevel(xp) {
  // Leveling curve: Level = floor(sqrt(xp / 50)) + 1
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1
}

function getProgressToNextLevel(xp) {
  const currentLevel = getLevel(xp)
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 50
  const nextLevelXP = Math.pow(currentLevel, 2) * 50
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  return { progress, nextLevelXP }
}

const SKILLS = [
  {
    id: 'speaker',
    name: 'The Speaker',
    desc: 'Assertiveness & Boundary Setting',
    icon: Target,
    color: '#2dd4bf', // teal
    perks: [
      { lvl: 2, title: 'Foundational Voice', desc: 'Consistently reaching 6+ assertiveness' },
      { lvl: 5, title: 'Boundary Setter', desc: 'Handling hostile NPCs without apologizing' },
      { lvl: 10, title: 'Master of Conflict', desc: 'Unflappable in Level 5 scenarios' }
    ]
  },
  {
    id: 'observer',
    name: 'The Observer',
    desc: 'Cognitive Flexibility & Neutrality',
    icon: Brain,
    color: '#a78bfa', // violet
    perks: [
      { lvl: 2, title: 'Mindful Pause', desc: 'Fewer than 3 distortions per session' },
      { lvl: 5, title: 'Fact Checker', desc: 'Eliminated "Mind Reading" tendencies' },
      { lvl: 10, title: 'Zen State', desc: 'Zero distortions in back-to-back sessions' }
    ]
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    desc: 'Real-World Exposure Tolerance',
    icon: Compass,
    color: '#fb7185', // rose
    perks: [
      { lvl: 2, title: 'Stepping Out', desc: 'Logged 3 real-world exposures' },
      { lvl: 5, title: 'Fear Tamer', desc: 'Average SUDS reduction of -3 points' },
      { lvl: 10, title: 'Comfort Zone Crusher', desc: 'Sought out 10+ high-SUDS situations' }
    ]
  },
  {
    id: 'stoic',
    name: 'The Stoic',
    desc: 'Consistency & Discipline',
    icon: Shield,
    color: '#fbbf24', // amber
    perks: [
      { lvl: 2, title: 'Showing Up', desc: '3-day practice streak' },
      { lvl: 5, title: 'Habit Builder', desc: '14 total sessions completed' },
      { lvl: 10, title: 'Iron Will', desc: '30-day continuous streak' }
    ]
  }
]

export default function SkillTree() {
  const { user, completedReports } = useUserStore()
  const { exposureLog } = useBodyStore()

  const xpStats = calculateXP(completedReports, exposureLog, user)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-text-primary">Clinical Skill Tree</h2>
        <p className="text-xs text-text-muted mt-0.5">Your therapy progress translated into RPG-style growth. Level up by facing your fears.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SKILLS.map((skill, i) => {
          const xp = xpStats[`${skill.id}XP`]
          const level = getLevel(xp)
          const { progress, nextLevelXP } = getProgressToNextLevel(xp)

          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full`} style={{ backgroundColor: skill.color }} />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${skill.color}20`, color: skill.color }}>
                    <skill.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{skill.name}</h3>
                    <p className="text-[10px] text-text-muted">{skill.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black" style={{ color: skill.color }}>Lvl {level}</div>
                  <div className="text-[10px] text-text-muted">{xp} XP</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
                  <span>Progress to Lvl {level + 1}</span>
                  <span>{xp} / {nextLevelXP}</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: skill.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Perks */}
              <div className="space-y-2 mt-4">
                <div className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-semibold">Milestones</div>
                {skill.perks.map((perk, idx) => {
                  const unlocked = level >= perk.lvl
                  return (
                    <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${unlocked ? 'bg-white/[0.04]' : 'opacity-40'}`}>
                      <div className="mt-0.5">
                        {unlocked ? (
                          <Star size={12} style={{ color: skill.color }} />
                        ) : (
                          <Lock size={12} className="text-text-muted" />
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-medium ${unlocked ? 'text-text-secondary' : 'text-text-muted'}`}>
                          {perk.title} <span className="text-[10px] opacity-60 font-normal ml-1">(Lvl {perk.lvl})</span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">{perk.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
