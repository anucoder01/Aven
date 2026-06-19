import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, Activity, Mic, Brain } from 'lucide-react'
import { useBodyStore } from '../../store/bodyStore'
import AvenOrb from '../3d/AvenOrb'

// ══════════════════════════════════════════
//  BREATHING HUB — 4 techniques with orb
// ══════════════════════════════════════════
const BREATHING_MODES = [
  {
    id: 'box',
    label: 'Box Breathing',
    subtitle: '4–4–4–4',
    description: 'Pre-scenario calm. Regulates the nervous system within 3 cycles.',
    color: '#2dd4bf',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Exhale', duration: 4 },
      { label: 'Hold', duration: 4 },
    ],
    cycles: 4,
  },
  {
    id: '478',
    label: '4-7-8 Breathing',
    subtitle: '4–7–8',
    description: 'Mid-panic rescue. The extended exhale activates the parasympathetic system.',
    color: '#a78bfa',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 7 },
      { label: 'Exhale', duration: 8 },
    ],
    cycles: 4,
  },
  {
    id: 'physsigh',
    label: 'Physiological Sigh',
    subtitle: 'Double inhale + long exhale',
    description: 'Post-session reset. The fastest known way to reduce stress. Used by Navy SEALs.',
    color: '#34d399',
    phases: [
      { label: 'Inhale', duration: 2 },
      { label: 'Top-up inhale', duration: 1 },
      { label: 'Long exhale', duration: 6 },
    ],
    cycles: 5,
  },
  {
    id: 'coherent',
    label: 'Coherent Breathing',
    subtitle: '5.5–5.5',
    description: 'Resting state maintenance. Maximizes heart rate variability. 5.5 breaths/min.',
    color: '#60a5fa',
    phases: [
      { label: 'Inhale', duration: 5.5 },
      { label: 'Exhale', duration: 5.5 },
    ],
    cycles: 6,
  },
]

export function BreathingHub() {
  const [selectedMode, setSelectedMode] = useState(null)
  const [active, setActive] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [orbState, setOrbState] = useState('idle')
  const timerRef = useRef(null)

  const mode = BREATHING_MODES.find(m => m.id === selectedMode)

  const startBreathing = (modeId) => {
    setSelectedMode(modeId)
    setActive(true)
    setPhaseIndex(0)
    setCycleCount(0)
    const m = BREATHING_MODES.find(x => x.id === modeId)
    setSecondsLeft(m.phases[0].duration)
    setOrbState('listening')
  }

  useEffect(() => {
    if (!active || !mode) return
    const phase = mode.phases[phaseIndex]

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          const nextPhase = (phaseIndex + 1) % mode.phases.length
          if (nextPhase === 0) {
            const nextCycle = cycleCount + 1
            if (nextCycle >= mode.cycles) {
              setActive(false)
              setOrbState('idle')
              return 0
            }
            setCycleCount(nextCycle)
          }
          setPhaseIndex(nextPhase)
          setSecondsLeft(mode.phases[nextPhase].duration)
          return mode.phases[nextPhase].duration
        }
        return prev - 1
      })
    }, 1000)

    const label = mode.phases[phaseIndex].label.toLowerCase()
    setOrbState(label.includes('exhale') ? 'idle' : label.includes('hold') ? 'distortion' : 'listening')

    return () => clearInterval(timerRef.current)
  }, [active, phaseIndex, mode, cycleCount])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-text-primary">Breathing Regulation Hub</h2>
        <p className="text-xs text-text-muted mt-0.5">Four clinically-grounded techniques. Each serves a different window: pre-, mid-, and post-session.</p>
      </div>

      {!active ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BREATHING_MODES.map(bm => (
            <motion.button
              key={bm.id}
              onClick={() => startBreathing(bm.id)}
              className="glass rounded-2xl p-5 text-left transition-all hover:border-white/[0.12]"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderColor: `${bm.color}20` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bm.color }} />
                <span className="text-sm font-semibold text-text-primary">{bm.label}</span>
                <span className="text-xs font-mono text-text-muted ml-auto">{bm.subtitle}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{bm.description}</p>
              <div className="flex gap-1 mt-3">
                {bm.phases.map((p, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: `${bm.color}30` }}>
                    <div className="h-full rounded-full" style={{ backgroundColor: bm.color, width: `${(p.duration / (bm.id === '478' ? 19 : bm.id === 'physsigh' ? 9 : bm.phases.reduce((s,x)=>s+x.duration,0))) * 100}%` }} />
                  </div>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="glass rounded-2xl p-8 text-center w-full max-w-sm">
            <div className="mb-4">
              <AvenOrb state={orbState} size={120} />
            </div>
            <motion.div
              key={`${phaseIndex}-${mode.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-2xl font-display font-bold mb-1"
              style={{ color: mode.color }}
            >
              {mode.phases[phaseIndex].label}
            </motion.div>
            <div className="text-4xl font-mono font-bold text-text-primary my-2">
              {Math.ceil(secondsLeft)}
            </div>
            <div className="text-xs text-text-muted">
              Cycle {cycleCount + 1} of {mode.cycles}
            </div>

            <div className="flex gap-1 mt-4">
              {mode.phases.map((p, i) => (
                <div key={i}
                  className="flex-1 h-1.5 rounded-full transition-all duration-500"
                  style={{ backgroundColor: i === phaseIndex ? mode.color : `${mode.color}20` }}
                />
              ))}
            </div>

            <button
              onClick={() => { setActive(false); setOrbState('idle'); clearInterval(timerRef.current) }}
              className="btn-ghost text-xs py-1.5 px-3 mt-4"
            >
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  BODY CHECK-IN — 7-dimension body scan
// ══════════════════════════════════════════
const BODY_DIMENSIONS = [
  { key: 'heartRate',     label: 'Heart rate feeling', low: 'Calm', high: 'Racing', icon: '💓' },
  { key: 'muscleTension', label: 'Muscle tension',     low: 'Relaxed', high: 'Tight', icon: '💪' },
  { key: 'breathingEase', label: 'Breathing ease',     low: 'Easy', high: 'Shallow', icon: '🌬️' },
  { key: 'dizziness',     label: 'Dizziness',          low: 'None', high: 'Strong', icon: '😵' },
  { key: 'nausea',        label: 'Nausea',             low: 'None', high: 'Strong', icon: '🤢' },
  { key: 'temperature',   label: 'Temperature',        low: 'Cool', high: 'Hot', icon: '🌡️' },
  { key: 'trembling',     label: 'Trembling',          low: 'None', high: 'Strong', icon: '🫨' },
]

export function BodyCheckIn() {
  const { addCheckIn, getLatestCheckIn, checkIns } = useBodyStore()
  const [phase, setPhase] = useState('pre')
  const [values, setValues] = useState({
    heartRate: 4, muscleTension: 4, breathingEase: 4,
    dizziness: 1, nausea: 1, temperature: 4, trembling: 1, suds: 5,
  })
  const [saved, setSaved] = useState(false)

  const dimColor = (val) => {
    if (val <= 2) return '#34d399'
    if (val <= 4) return '#fbbf24'
    if (val <= 6) return '#fb923c'
    return '#fb7185'
  }

  const handleSave = () => {
    addCheckIn({ ...values, phase })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const pre = getLatestCheckIn('pre')
  const post = getLatestCheckIn('post')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-text-primary">Physiological Check-in</h2>
        <p className="text-xs text-text-muted mt-0.5">Anxiety isn't just in your head. Track your body before, during, and after each session.</p>
      </div>

      <div className="flex gap-2">
        {['pre', 'during', 'post'].map(p => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
              phase === p ? 'bg-teal-400/15 text-teal-400 border border-teal-400/30' : 'glass text-text-muted hover:text-text-secondary'
            }`}
          >
            {p}-Session
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-text-secondary font-medium">Overall Distress (SUDS)</span>
            <span className="font-bold text-lg" style={{ color: dimColor(values.suds) }}>{values.suds}/10</span>
          </div>
          <input type="range" min={1} max={10} value={values.suds}
            onChange={e => setValues(p => ({ ...p, suds: Number(e.target.value) }))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: dimColor(values.suds) }}
          />
        </div>

        {BODY_DIMENSIONS.map(dim => (
          <div key={dim.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">{dim.icon} {dim.label}</span>
              <div className="flex gap-2 text-text-muted">
                <span>{dim.low}</span>
                <span className="font-bold" style={{ color: dimColor(values[dim.key]) }}>{values[dim.key]}</span>
                <span>{dim.high}</span>
              </div>
            </div>
            <input type="range" min={1} max={7} value={values[dim.key]}
              onChange={e => setValues(prev => ({ ...prev, [dim.key]: Number(e.target.value) }))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: dimColor(values[dim.key]) }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className={`btn-primary w-full justify-center transition-all ${saved ? 'bg-teal-400/20 border-teal-400/40 text-teal-400' : ''}`}
      >
        {saved ? '✓ Saved' : `Save ${phase.charAt(0).toUpperCase() + phase.slice(1)}-Session Check-in`}
      </button>

      {pre && post && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs text-text-muted uppercase tracking-widest mb-3">Pre vs. Post Comparison</h3>
          <div className="space-y-2">
            {BODY_DIMENSIONS.map(dim => {
              const delta = (post[dim.key] || 4) - (pre[dim.key] || 4)
              return (
                <div key={dim.key} className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted w-28 truncate">{dim.label}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-violet-400/50" style={{ width: `${(pre[dim.key] / 7) * 100}%` }} />
                  </div>
                  <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal-400/70" style={{ width: `${(post[dim.key] / 7) * 100}%` }} />
                  </div>
                  <span className={`w-6 text-right font-bold ${delta < 0 ? 'text-teal-400' : delta > 0 ? 'text-rose-400' : 'text-text-muted'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 mt-3 text-[10px] text-text-muted">
            <div className="flex items-center gap-1"><div className="w-2 h-1.5 rounded bg-violet-400/50" /> Pre</div>
            <div className="flex items-center gap-1"><div className="w-2 h-1.5 rounded bg-teal-400/70" /> Post</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  VOCAL BIOMARKER PANEL
// ══════════════════════════════════════════
export function VocalBiomarkerPanel() {
  const { biomarkerBaseline, spikeEvents } = useBodyStore()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-text-primary">Vocal Biomarkers</h2>
        <p className="text-xs text-text-muted mt-0.5">Your voice tells the truth even when your words don't. Only available during voice mode sessions.</p>
      </div>

      {!biomarkerBaseline ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Mic size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Baseline not established yet</p>
          <p className="text-xs text-text-muted mt-1">Complete 3 voice mode sessions to establish your personal baseline. After that, pitch deviations, speech rate changes, and tremor will be tracked in real time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-teal rounded-xl p-4">
            <p className="text-xs text-teal-400 mb-2">Baseline established — {biomarkerBaseline.sampleCount} sessions</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-text-primary">{biomarkerBaseline.avgPitch?.toFixed(0)} Hz</div>
                <div className="text-xs text-text-muted">Avg Pitch</div>
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">{biomarkerBaseline.avgRate?.toFixed(1)}</div>
                <div className="text-xs text-text-muted">Words/sec</div>
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">{biomarkerBaseline.avgEnergy?.toFixed(2)}</div>
                <div className="text-xs text-text-muted">Energy RMS</div>
              </div>
            </div>
          </div>

          {spikeEvents.length > 0 && (
            <div>
              <h3 className="text-xs text-text-muted uppercase tracking-widest mb-2">Spike Events</h3>
              <div className="space-y-2">
                {spikeEvents.slice(-5).reverse().map(spike => (
                  <div key={spike.id} className="glass rounded-xl p-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="text-xs text-text-secondary">
                      Pitch +{spike.pitchDelta?.toFixed(0)}% above baseline
                    </div>
                    <div className="ml-auto text-[10px] text-text-muted">
                      {new Date(spike.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
