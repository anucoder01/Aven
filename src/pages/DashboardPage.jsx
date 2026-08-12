import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Brain, Target, Calendar, Award, Flame } from 'lucide-react'
import AuroraBackground from '../components/3d/AuroraBackground'
import { useUserStore } from '../store/userStore'
import { DISTORTION_LABELS } from '../data/scenarios'
import { ClinicalTracker, ExposureLogger, InsightEngine } from '../components/progress/ProgressComponents'
import SkillTree from '../components/progress/SkillTree'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-xs border border-white/[0.08]">
      <p className="text-text-muted mb-2">Session {label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="text-text-primary font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subLabel, color, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 flex items-start gap-4"
    >
      <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        <div className="text-xs text-text-secondary mt-0.5">{label}</div>
        {subLabel && <div className="text-xs text-text-muted mt-1">{subLabel}</div>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </motion.div>
  )
}

// Mini weekly heatmap
function StreakCalendar({ streak }) {
  const days = useMemo(() => Array.from({ length: 28 }, (_, i) => {
    // eslint-disable-next-line react-hooks/purity
    const intensity = i > 28 - streak - 2 ? (Math.random() > 0.3 ? 0.8 + Math.random() * 0.2 : 0.3) : Math.random() * 0.15
    return intensity
  }), [streak])

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Calendar size={14} className="text-teal-400" /> Practice Streak
        </h3>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Flame size={14} />
          <span className="text-sm font-bold">{streak} days</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['M','T','W','T','F','S','S'].map(d => (
          <div key={d} className="text-[9px] text-text-muted text-center">{d}</div>
        ))}
        {days.map((intensity, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{
              backgroundColor: intensity > 0.3
                ? `rgba(45,212,191,${intensity})`
                : 'rgba(255,255,255,0.04)',
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-text-muted">Less</span>
        <div className="flex gap-1">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
            <div key={o} className="w-3 h-2 rounded-sm" style={{ backgroundColor: `rgba(45,212,191,${o})` }} />
          ))}
        </div>
        <span className="text-[10px] text-text-muted">More</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, completedReports } = useUserStore()
  const [activeTab, setActiveTab] = useState('overview')

  // Transform raw LLM reports into the format the charts expect
  const sessions = useMemo(() => completedReports.map((report, idx) => {
    // Calculate distortion counts
    let cat = 0; let mr = 0; let aon = 0;
    (report.top_distortions || []).forEach(d => {
      if (d.key === 'catastrophizing') cat = d.count;
      if (d.key === 'mind_reading') mr = d.count;
      if (d.key === 'all_or_nothing') aon = d.count;
    })

    return {
      session: idx + 1,
      // eslint-disable-next-line react-hooks/purity
      date: new Date(report.id || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      difficulty: report.difficulty_level || 1,
      assertiveness: report.assertiveness_score || 0,
      catastrophizing: cat,
      mind_reading: mr,
      all_or_nothing: aon
    }
  }), [completedReports])

  // If no sessions yet, show a placeholder
  if (sessions.length === 0) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ background: '#07071a' }}>
        <AuroraBackground />
        <div className="relative z-10 text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
            <Target className="text-teal-400" size={24} />
          </div>
          <h2 className="text-xl font-display text-text-primary mb-2">No Data Yet</h2>
          <p className="text-sm text-text-secondary mb-6">Complete your first therapy scenario to unlock your personalized progress dashboard.</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full justify-center">
            Start a Session
          </button>
        </div>
      </div>
    )
  }

  const latestSession = sessions[sessions.length - 1]
  const firstSession = sessions[0]

  const assertivenessTrend = firstSession.assertiveness > 0 
    ? Math.round(((latestSession.assertiveness - firstSession.assertiveness) / firstSession.assertiveness) * 100)
    : 0

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'distortions', label: 'Distortions' },
    { id: 'assertiveness', label: 'Assertiveness' },
    { id: 'clinical', label: 'Clinical' },
    { id: 'insights', label: 'Insights' },
    { id: 'exposures', label: 'Real World' },
    { id: 'skill-tree', label: 'Skill Tree' },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: '#07071a' }}>
      <AuroraBackground />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/[0.04]">
        <h1 className="text-xl font-display font-bold text-text-primary">Progress Dashboard</h1>
        <button onClick={() => navigate('/')} className="btn-primary text-sm py-2 px-4">
          New Session
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 page-enter">

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={TrendingUp} label="Assertiveness" value={latestSession.assertiveness.toFixed(1)} subLabel="out of 10" color="#2dd4bf" trend={assertivenessTrend} />
          <StatCard icon={Brain} label="Sessions" value={user.totalSessions} subLabel="total completed" color="#a78bfa" />
          <StatCard icon={Flame} label="Streak" value={`${user.streak}d`} subLabel="consecutive days" color="#fbbf24" />
          <StatCard icon={Award} label="Improvement" value={`+${user.improvementPct}%`} subLabel="vs. baseline" color="#fb7185" trend={user.improvementPct} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass rounded-xl mb-5 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white/[0.08] text-text-primary font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Assertiveness trend */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target size={14} className="text-teal-400" /> Assertiveness Over Time
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={sessions} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="assertGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#5a5a8a' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#5a5a8a' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="assertiveness" name="Assertiveness" stroke="#2dd4bf" strokeWidth={2} fill="url(#assertGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StreakCalendar streak={user.streak} />

              {/* Best scenario */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Award size={14} className="text-amber-400" /> Insights
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Best Scenario', value: 'Workplace Small Talk', color: '#818cf8' },
                    { label: 'Most Improved', value: 'Mind Reading (−60%)', color: '#2dd4bf' },
                    { label: 'Still Challenging', value: 'Catastrophizing', color: '#fb7185' },
                    { label: 'Next Level Ready', value: 'Scenario A → L4', color: '#fbbf24' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">{item.label}</span>
                      <span className="text-xs font-medium" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'distortions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Brain size={14} className="text-rose-400" /> Distortion Frequency Over Sessions
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={sessions} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="catGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="aoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#5a5a8a' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#5a5a8a' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                  <Area type="monotone" dataKey="catastrophizing" name="Catastrophizing" stroke="#fb7185" strokeWidth={2} fill="url(#catGrad)" dot={false} />
                  <Area type="monotone" dataKey="mind_reading" name="Mind Reading" stroke="#a78bfa" strokeWidth={2} fill="url(#mrGrad)" dot={false} />
                  <Area type="monotone" dataKey="all_or_nothing" name="All-or-Nothing" stroke="#fbbf24" strokeWidth={2} fill="url(#aoGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Per-distortion progress bars */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Reduction Progress</h3>
              <div className="space-y-4">
                {[
                  { key: 'catastrophizing', first: 5, last: 1 },
                  { key: 'mind_reading', first: 3, last: 1 },
                  { key: 'all_or_nothing', first: 2, last: 1 },
                ].map(item => {
                  const label = DISTORTION_LABELS.find(d => d.key === item.key)
                  const reduction = Math.round(((item.first - item.last) / item.first) * 100)
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          {label?.emoji} {label?.label}
                        </span>
                        <span className="text-xs text-teal-400 font-medium">−{reduction}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: label?.color }}
                          initial={{ width: '100%' }}
                          animate={{ width: `${(item.last / item.first) * 100}%` }}
                          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-text-muted">Session 1: {item.first}×</span>
                        <span className="text-[9px] text-text-muted">Now: {item.last}×</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'assertiveness' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-teal-400" /> Assertiveness vs. Difficulty
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sessions} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#5a5a8a' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#5a5a8a' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                  <Line type="monotone" dataKey="assertiveness" name="Assertiveness Score" stroke="#2dd4bf" strokeWidth={2.5} dot={{ fill: '#2dd4bf', r: 3 }} />
                  <Line type="monotone" dataKey="difficulty" name="Difficulty Level" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Per-Session Summary</h3>
              <div className="space-y-2">
                {sessions.slice().reverse().map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <span className="text-xs text-text-muted w-16 flex-shrink-0">Session {s.session}</span>
                    <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full bg-teal-400" style={{ width: `${(s.assertiveness / 10) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-teal-400 w-8 text-right">{s.assertiveness}</span>
                    <span className="text-[10px] text-text-muted w-16 flex-shrink-0">{s.date}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400">L{s.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'clinical' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <ClinicalTracker />
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <InsightEngine sessionHistory={[]} />
          </motion.div>
        )}

        {activeTab === 'exposures' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <ExposureLogger />
          </motion.div>
        )}

        {activeTab === 'skill-tree' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <SkillTree />
          </motion.div>
        )}
      </div>
    </div>
  )
}
