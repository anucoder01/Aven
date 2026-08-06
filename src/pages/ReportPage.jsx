import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Download, RefreshCw, ArrowRight, Brain, Target, Lightbulb, AlertTriangle, TrendingUp, CheckCircle, FileText, Plus } from 'lucide-react'
import AuroraBackground from '../components/3d/AuroraBackground'
import { useSessionStore } from '../store/sessionStore'
import { useTherapyStore } from '../store/therapyStore'
import { useUserStore } from '../store/userStore'
import { MOCK_CBT_REPORT } from '../data/mockData'
import { DISTORTION_LABELS } from '../data/scenarios'
import { Star } from 'lucide-react'

function AssertivenessMeter({ score }) {
  const [displayed, setDisplayed] = useState(0)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = (displayed / 10) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(prev => {
          if (prev >= score) { clearInterval(interval); return score }
          return prev + 0.1
        })
      }, 30)
      return () => clearInterval(interval)
    }, 600)
    return () => clearTimeout(timer)
  }, [score])

  const color = score >= 7 ? '#2dd4bf' : score >= 5 ? '#fbbf24' : '#fb7185'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg className="progress-ring" width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-text-primary">{displayed.toFixed(1)}</span>
          <span className="text-xs text-text-muted">/ 10</span>
        </div>
      </div>
      <span className="text-sm text-text-secondary font-medium">Assertiveness Score</span>
      <span className="text-xs text-text-muted">
        {score >= 7 ? '🟢 Good' : score >= 5 ? '🟡 Developing' : '🔴 Needs Work'}
      </span>
    </div>
  )
}

function SeverityBar({ severity, color }) {
  const [filled, setFilled] = useState(0)
  useEffect(() => {
    setTimeout(() => setFilled(severity), 400)
  }, [severity])

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <motion.div
            key={i}
            className="w-4 h-1.5 rounded-full"
            animate={{ backgroundColor: i <= filled ? color : 'rgba(255,255,255,0.08)' }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">{severity}/5</span>
    </div>
  )
}

function DistortionCard({ distortion, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const label = DISTORTION_LABELS.find(d => d.key === distortion.key)
  const color = label?.color || '#a78bfa'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15 + 0.5 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-start gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <span className="text-xl">{label?.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-text-primary">{distortion.label}</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${color}20`, color }}>
              ×{distortion.count} detected
            </span>
          </div>
          <div className="mt-1.5">
            <SeverityBar severity={Math.round(distortion.avg_severity)} color={color} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {(distortion.quotes || []).map((quote, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}25` }}>
                  {/* Quoted text */}
                  <div className="p-4" style={{ backgroundColor: `${color}08` }}>
                    <div className="flex items-start gap-2">
                      <span className="text-2xl font-serif" style={{ color: `${color}60` }}>"</span>
                      <p className="text-sm text-text-primary italic leading-relaxed pt-1">
                        {quote.text}
                      </p>
                    </div>
                    <div className="mt-2 ml-6">
                      <SeverityBar severity={quote.severity || 1} color={color} />
                    </div>
                  </div>
                  {/* Reframe & Export */}
                  <div className="p-4 border-t border-white/[0.04] bg-white/[0.01]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lightbulb size={11} className="text-teal-400" />
                          <span className="text-[10px] uppercase tracking-widest text-teal-400 font-medium">Reframe</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {quote.reframe}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          // The parent component isn't passing down the parent state, so we'll just handle it by 
                          // finding the right store action or dispatching an event, but for now we'll rely on the 
                          // outer ReportPage passing down a callback if we refactor, or we can use the store directly here.
                          // Wait, DistortionCard doesn't have access to addThoughtRecord directly since we put it in ReportPage.
                          // Let's import the store here.
                          useTherapyStore.getState().addThoughtRecord({
                            situation: 'Session Simulation',
                            emotion: 'Anxious',
                            automaticThought: quote.text,
                            distortion: distortion.label,
                            evidenceFor: '',
                            evidenceAgainst: '',
                            alternativeThought: quote.reframe,
                            date: new Date().toISOString()
                          })
                          alert('Saved to Thought Records')
                        }}
                        className="btn-ghost text-xs py-1.5 px-3 whitespace-nowrap"
                      >
                        <Plus size={11} /> Thought Record
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ReportPage() {
  const navigate = useNavigate()
  const { messages, liveStats, distortionEvents } = useSessionStore()
  const { addReport } = useUserStore()
  const { addThoughtRecord } = useTherapyStore()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const reportSavedRef = useRef(false)

  const handleExportToThoughtRecord = (quote, d) => {
    addThoughtRecord({
      situation: 'Session Simulation',
      emotion: 'Anxious',
      automaticThought: quote.text,
      distortion: d.label,
      evidenceFor: '',
      evidenceAgainst: '',
      alternativeThought: quote.reframe,
      date: new Date().toISOString()
    })
    // Could show a toast here
  }

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const payload = {
          transcript: messages.map(m => ({ 
            role: m.role === 'ai' ? 'assistant' : 'user', 
            content: m.text 
          })),
          distortion_events: distortionEvents || [],
          avoidance_events: [], // add from stats if available
          scenario_id: 'current_session',
          difficulty_level: 1
        }
        
        const res = await fetch('http://localhost:8000/llm/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        const data = await res.json()
        setReport(data)
        
        if (!reportSavedRef.current) {
          addReport(data)
          reportSavedRef.current = true
        }
      } catch (err) {
        console.error(err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchReport()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ background: '#07071a' }}>
        <AuroraBackground />
        <div className="relative z-10 text-center text-text-secondary">
          <RefreshCw className="animate-spin mb-4 mx-auto" size={24} />
          <p>Analyzing session and generating CBT report...</p>
        </div>
      </div>
    )
  }

  if (!report || error) {
    return (
      <div className="min-h-screen relative flex items-center justify-center" style={{ background: '#07071a' }}>
        <AuroraBackground />
        <div className="relative z-10 text-center text-rose-400">
          <AlertTriangle className="mb-4 mx-auto" size={24} />
          <p>Failed to generate report.</p>
          <button onClick={() => navigate('/')} className="btn-ghost mt-4">Go Back</button>
        </div>
      </div>
    )
  }

  // Calculate XP gained from this session
  const totalDistortions = report.top_distortions?.reduce((sum, d) => sum + (d.count || 0), 0) || 0
  let earnedXP = 20 // Base consistency XP for finishing session
  
  if (report.assertiveness_score > 5) {
    earnedXP += Math.round((report.assertiveness_score - 5) * 10)
  }
  if (totalDistortions <= 1) earnedXP += 50
  else if (totalDistortions <= 3) earnedXP += 20
  
  // +10 for each severity level if difficulty was high
  earnedXP += (report.difficulty_level || 1) * 10

  return (
    <div className="min-h-screen relative" style={{ background: '#07071a' }}>
      <AuroraBackground />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost text-sm">
            <ChevronLeft size={14} /> Back
          </button>
          <div className="h-4 w-px bg-white/[0.06]" />
          <span className="text-sm text-text-secondary">Session Report</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs py-1.5 px-3">
            <Download size={12} /> Export PDF
          </button>
          <button onClick={() => navigate('/')} className="btn-ghost text-xs py-1.5 px-3">
            <RefreshCw size={12} /> New Session
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 page-enter">

        {/* Score header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center gap-6"
        >
          <AssertivenessMeter score={report.assertiveness_score || 0} />
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display text-2xl text-text-primary mb-2">Session Complete</h1>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {report.session_insights}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="glass rounded-xl px-3 py-2 text-center">
                <div className="text-lg font-bold text-rose-400">{report.total_distortions || (report.top_distortions ? report.top_distortions.reduce((acc, curr) => acc + (curr.count || 0), 0) : 0)}</div>
                <div className="text-[10px] text-text-muted">Distortions</div>
              </div>
              <div className="glass rounded-xl px-3 py-2 text-center">
                <div className="text-lg font-bold text-amber-400">{report.avoidance_events ? report.avoidance_events.length : 0}</div>
                <div className="text-[10px] text-text-muted">Avoidances</div>
              </div>
              <div className="glass rounded-xl px-3 py-2 text-center">
                <div className="text-lg font-bold text-teal-400">{report.session_duration_minutes || 5}m</div>
                <div className="text-[10px] text-text-muted">Duration</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gamification panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="glass rounded-xl p-5 mb-6 bg-gradient-to-r from-violet-500/10 to-teal-400/10 border border-white/[0.08]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-400/20 flex items-center justify-center">
                <Star size={20} className="text-teal-400" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">XP Earned</h3>
                <p className="text-xs text-text-muted">+{earnedXP} points towards your next level!</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-teal-400">+{earnedXP}</div>
            </div>
          </div>
        </motion.div>

        {/* Growth note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-teal rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <TrendingUp size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-teal-300 leading-relaxed">{report.growth_note}</p>
        </motion.div>

        {/* Top distortions */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Brain size={11} /> Top Distortions — Annotated
          </h2>
          <div className="space-y-3">
            {(report.top_distortions || []).map((d, i) => (
              <DistortionCard key={d.key || i} distortion={d} index={i} />
            ))}
          </div>
        </div>

        {/* Avoidance events */}
        {(report.avoidance_events || []).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-2xl p-5 mb-6"
          >
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-amber-400" /> Avoidance Signals
            </h2>
            <div className="space-y-2">
              {(report.avoidance_events || []).map((ev, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-400/[0.04] border border-amber-400/10">
                  <span className="text-amber-400 text-[10px] font-mono mt-0.5 flex-shrink-0">{ev.timestamp}</span>
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase tracking-wide">{ev.type ? ev.type.replace('_', ' ') : 'AVOIDANCE'}</span>
                    <p className="text-sm text-text-secondary italic">"{ev.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Full Annotated Transcript */}
        {messages && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-8"
          >
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <FileText size={11} /> Annotated Transcript
            </h2>
            <div className="glass rounded-2xl p-5 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] ${m.role === 'user' ? 'bg-white/[0.04]' : 'bg-transparent'} rounded-xl p-3`}>
                    <div className="flex items-center justify-between mb-1 gap-4">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        {m.role === 'user' ? 'You' : m.characterName || 'Character'}
                      </span>
                      {m.timestamp && <span className="text-[9px] text-text-muted">{m.timestamp}</span>}
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed">{m.text}</p>
                    
                    {/* Inline Distortions/Avoidance annotations */}
                    {m.role === 'user' && (m.distortions?.length > 0 || m.avoidance?.length > 0) && (
                      <div className="mt-2 pt-2 border-t border-white/[0.04] flex flex-wrap gap-1.5">
                        {m.distortions?.map((d, idx) => {
                          const lbl = DISTORTION_LABELS.find(l => l.key === d.key)
                          return (
                            <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: `${lbl?.color}20`, color: lbl?.color || '#a78bfa' }}>
                              {lbl?.emoji} {d.label} {d.severity && `(L${d.severity})`}
                            </span>
                          )
                        })}
                        {m.avoidance?.map((a, idx) => (
                          <span key={`a-${idx}`} className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 bg-amber-400/20 text-amber-400">
                            <AlertTriangle size={9} /> {a.type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button onClick={() => navigate('/dashboard')} className="btn-ghost flex-1 justify-center py-3">
            <Target size={14} /> View Progress Dashboard
          </button>
          <button onClick={() => navigate('/')} className="btn-primary flex-1 justify-center py-3">
            Next Session <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
