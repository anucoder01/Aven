import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Shield, Phone, Heart, AlertCircle, UserCheck, ChevronDown, ChevronUp, X, PauseCircle, ExternalLink } from 'lucide-react'
import AuroraBackground from '../components/3d/AuroraBackground'
import { useSessionStore } from '../store/sessionStore'

const CRISIS_LINES = [
  { name: '988 Suicide & Crisis Lifeline', number: '988', note: 'Call or text, 24/7', country: 'US' },
  { name: 'Crisis Text Line', number: 'Text HOME to 741741', note: 'Free, 24/7', country: 'US' },
  { name: 'NAMI HelpLine', number: '1-800-950-6264', note: 'Mon–Fri 10am–10pm ET', country: 'US' },
  { name: 'International Assoc. for Suicide Prevention', number: 'iasp.info/resources/Crisis_Centres/', note: 'Global directory', country: 'Global' },
]

const GROUNDING_EXERCISES = [
  {
    id: '54321',
    title: '5-4-3-2-1 Grounding',
    time: '2 min',
    steps: [
      'Name 5 things you can SEE right now.',
      'Name 4 things you can TOUCH or feel.',
      'Name 3 things you can HEAR.',
      'Name 2 things you can SMELL.',
      'Name 1 thing you can TASTE.',
    ],
  },
  {
    id: 'breathing',
    title: 'Box Breathing (4-4-4-4)',
    time: '3 min',
    steps: [
      'Breathe IN slowly for 4 counts.',
      'HOLD your breath for 4 counts.',
      'Breathe OUT slowly for 4 counts.',
      'HOLD for 4 counts.',
      'Repeat 4 times.',
    ],
  },
  {
    id: 'selfcompassion',
    title: 'Self-Compassion Pause',
    time: '1 min',
    steps: [
      'Place one hand on your chest.',
      'Say: "This is a moment of difficulty."',
      'Say: "Difficulty is part of being human."',
      'Say: "May I be kind to myself right now."',
      'Take 3 slow breaths.',
    ],
  },
]

function BreathingOrb() {
  const [phase, setPhase] = useState('in')
  const [active, setActive] = useState(false)
  const [count, setCount] = useState(0)

  const phaseConfig = {
    in: { label: 'Breathe In', scale: 1.4, color: '#2dd4bf', duration: 4000, next: 'hold1' },
    hold1: { label: 'Hold', scale: 1.4, color: '#a78bfa', duration: 4000, next: 'out' },
    out: { label: 'Breathe Out', scale: 0.7, color: '#818cf8', duration: 4000, next: 'hold2' },
    hold2: { label: 'Hold', scale: 0.7, color: '#a78bfa', duration: 4000, next: 'in' },
  }

  const start = () => {
    setActive(true)
    setPhase('in')
    let currentPhase = 'in'
    let cycleCount = 0

    const step = () => {
      const config = phaseConfig[currentPhase]
      currentPhase = config.next
      if (currentPhase === 'in') cycleCount++
      setPhase(currentPhase)
      setCount(cycleCount)
      if (cycleCount < 4) {
        setTimeout(step, phaseConfig[currentPhase].duration)
      } else {
        setActive(false)
        setPhase('in')
        setCount(0)
      }
    }

    setTimeout(step, phaseConfig[currentPhase].duration)
  }

  const current = phaseConfig[phase]

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <motion.div
          animate={{ scale: active ? current.scale : 1 }}
          transition={{ duration: 4, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${current.color}40, ${current.color}10)`,
            border: `2px solid ${current.color}40`,
            boxShadow: `0 0 ${active ? '40px' : '20px'} ${current.color}30`,
          }}
        >
          <div className="text-center">
            <div className="text-sm font-medium text-text-primary">{active ? current.label : 'Ready'}</div>
            {active && <div className="text-xs text-text-muted mt-1">Cycle {count + 1}/4</div>}
          </div>
        </motion.div>
      </div>
      {!active ? (
        <button onClick={start} className="btn-primary text-sm">
          <Heart size={14} /> Start Breathing
        </button>
      ) : (
        <button onClick={() => setActive(false)} className="btn-ghost text-sm">
          <X size={14} /> Stop
        </button>
      )}
    </div>
  )
}

function AccordionItem({ title, children, defaultOpen = false, icon: Icon, color }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
              <Icon size={14} style={{ color }} />
            </div>
          )}
          <span className="font-medium text-sm text-text-primary">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/[0.04]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SafetyPage() {
  const navigate = useNavigate()
  const { clearSession } = useSessionStore()
  const [distressLevel, setDistressLevel] = useState(3)

  const handlePauseSession = () => {
    clearSession()
    navigate('/')
  }

  const distressColors = ['', '#2dd4bf', '#a78bfa', '#fbbf24', '#fb923c', '#fb7185', '#fb7185', '#fb7185', '#fb7185', '#fb7185', '#fb7185']
  const distressLabels = ['', 'Minimal', 'Mild', 'Moderate', 'Significant', 'High', 'High', 'Severe', 'Severe', 'Critical', 'Crisis']

  return (
    <div className="min-h-screen relative" style={{ background: '#07071a' }}>
      <AuroraBackground />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm">
            <ChevronLeft size={14} /> Back
          </button>
          <div className="h-4 w-px bg-white/[0.06]" />
          <h1 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Shield size={14} className="text-teal-400" /> Safety & Wellbeing
          </h1>
        </div>
        <button onClick={handlePauseSession} className="btn-danger text-sm py-2">
          <PauseCircle size={13} /> Pause Session
        </button>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4 page-enter">

        {/* Distress check */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
            <AlertCircle size={15} style={{ color: distressColors[distressLevel] }} />
            How are you feeling right now?
          </h2>
          <p className="text-text-muted text-xs mb-5">Move the slider to indicate your current distress level. If you're at 7 or above, please stop the session and use the resources below.</p>

          <div className="mb-3">
            <input
              type="range"
              min={1}
              max={10}
              value={distressLevel}
              onChange={e => setDistressLevel(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2dd4bf, #fbbf24, #fb7185)`,
                accentColor: distressColors[distressLevel],
              }}
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
              <span>1 — Calm</span>
              <span>5 — Moderate</span>
              <span>10 — Crisis</span>
            </div>
          </div>

          <motion.div
            key={distressLevel}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3 rounded-xl mt-3"
            style={{ backgroundColor: `${distressColors[distressLevel]}10`, border: `1px solid ${distressColors[distressLevel]}25` }}
          >
            <span className="text-2xl font-bold" style={{ color: distressColors[distressLevel] }}>{distressLevel}</span>
            <div>
              <div className="text-sm font-medium" style={{ color: distressColors[distressLevel] }}>{distressLabels[distressLevel]}</div>
              {distressLevel >= 7 && (
                <div className="text-xs text-rose-400 mt-0.5">⚠️ Please pause the session and use the crisis resources below.</div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Breathing exercise */}
        <AccordionItem title="Box Breathing Exercise" icon={Heart} color="#2dd4bf" defaultOpen>
          <div className="pt-4">
            <BreathingOrb />
          </div>
        </AccordionItem>

        {/* Grounding exercises */}
        <AccordionItem title="Grounding Exercises" icon={Shield} color="#a78bfa">
          <div className="space-y-4 pt-4">
            {GROUNDING_EXERCISES.map(ex => (
              <div key={ex.id} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-text-primary">{ex.title}</h3>
                  <span className="text-xs text-text-muted">{ex.time}</span>
                </div>
                <ol className="space-y-2">
                  {ex.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-text-secondary">
                      <span className="text-teal-400 font-mono flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* Crisis resources */}
        <AccordionItem title="Crisis Resources" icon={Phone} color="#fb7185">
          <div className="space-y-3 pt-4">
            <p className="text-xs text-text-muted leading-relaxed">
              Aven is a <strong className="text-text-secondary">training tool, not a replacement for professional care.</strong> If you're in distress, please reach out to a professional.
            </p>
            {CRISIS_LINES.map(line => (
              <div key={line.name} className="flex items-start gap-3 p-3 rounded-xl glass">
                <Phone size={13} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{line.name}</div>
                  <div className="text-sm text-rose-400 font-mono">{line.number}</div>
                  <div className="text-xs text-text-muted">{line.note} · {line.country}</div>
                </div>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* Therapist mode */}
        <AccordionItem title="Therapist Collaboration Mode" icon={UserCheck} color="#a78bfa">
          <div className="pt-4 space-y-3">
            <p className="text-xs text-text-secondary leading-relaxed">
              Share your session data and distortion reports with a licensed therapist to complement in-person CBT. Your therapist can review trends and annotate specific sessions.
            </p>
            <div className="glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-primary">Share Progress Report</div>
                <div className="text-xs text-text-muted">PDF summary of last 10 sessions</div>
              </div>
              <button className="btn-ghost text-xs py-1.5 px-3">
                <ExternalLink size={11} /> Export
              </button>
            </div>
            <div className="text-xs text-text-muted bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
              ℹ️ Session data is stored locally only. Nothing is shared without your explicit action.
            </div>
          </div>
        </AccordionItem>

      </div>
    </div>
  )
}
