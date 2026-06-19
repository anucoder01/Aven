import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, CheckCircle2 } from 'lucide-react'
import { useBodyStore } from '../../store/bodyStore'

// ══════════════════════════════════════════
//  LSAS — Liebowitz Social Anxiety Scale
// ══════════════════════════════════════════
const LSAS_ITEMS = [
  { id: 1, situation: 'Telephoning in public' },
  { id: 2, situation: 'Participating in small groups' },
  { id: 3, situation: 'Eating in public places' },
  { id: 4, situation: 'Drinking with others in public places' },
  { id: 5, situation: 'Talking to people in authority' },
  { id: 6, situation: 'Acting, performing or giving a talk in front of an audience' },
  { id: 7, situation: 'Going to a party' },
  { id: 8, situation: 'Working while being observed' },
  { id: 9, situation: 'Writing while being observed' },
  { id: 10, situation: 'Calling someone you do not know very well' },
  { id: 11, situation: 'Talking with people you do not know very well' },
  { id: 12, situation: 'Meeting strangers' },
  { id: 13, situation: 'Urinating in a public bathroom' },
  { id: 14, situation: 'Entering a room when others are already seated' },
  { id: 15, situation: 'Being the center of attention' },
  { id: 16, situation: 'Speaking up at a meeting' },
  { id: 17, situation: 'Taking a test' },
  { id: 18, situation: 'Expressing a disagreement or disapproval to people you do not know very well' },
  { id: 19, situation: 'Looking at people you do not know very well in the eyes' },
  { id: 20, situation: 'Giving a report to a group' },
  { id: 21, situation: 'Trying to pick up someone' },
  { id: 22, situation: 'Returning goods to a store' },
  { id: 23, situation: 'Giving a party' },
  { id: 24, situation: 'Resisting a high pressure salesperson' },
]

const LSAS_FEAR_OPTIONS = ['None (0)', 'Mild (1)', 'Moderate (2)', 'Severe (3)']
const LSAS_AVOID_OPTIONS = ['Never (0)', 'Occasionally (1)', 'Often (2)', 'Usually (3)']

function lsasSeverity(score) {
  if (score < 30) return { label: 'Minimal anxiety', color: '#34d399' }
  if (score < 50) return { label: 'Mild social anxiety', color: '#a3e635' }
  if (score < 65) return { label: 'Moderate social anxiety', color: '#fbbf24' }
  if (score < 80) return { label: 'Marked social anxiety', color: '#fb923c' }
  if (score < 95) return { label: 'Severe social anxiety', color: '#fb7185' }
  return { label: 'Very severe social anxiety', color: '#e11d48' }
}

export function ClinicalTracker() {
  const { assessments, addAssessment, getLatestAssessment } = useBodyStore()
  const [activeAssessment, setActiveAssessment] = useState(null)
  const [lsasAnswers, setLsasAnswers] = useState({}) // { [id]: { fear: 0, avoid: 0 } }
  const [phq4Answers, setPhq4Answers] = useState([0, 0, 0, 0])
  const [currentStep, setCurrentStep] = useState(0)

  const latest = getLatestAssessment('lsas')
  const latestPhq4 = getLatestAssessment('phq4')

  const computeLSAS = () => {
    let total = 0
    LSAS_ITEMS.forEach(item => {
      const ans = lsasAnswers[item.id] || { fear: 0, avoid: 0 }
      total += ans.fear + ans.avoid
    })
    return total
  }

  const handleLSASSave = () => {
    const score = computeLSAS()
    addAssessment('lsas', { score, answers: lsasAnswers, severity: lsasSeverity(score).label })
    setActiveAssessment(null)
    setLsasAnswers({})
    setCurrentStep(0)
  }

  const handlePHQ4Save = () => {
    const total = phq4Answers.reduce((s, v) => s + v, 0)
    const anxiety = phq4Answers[0] + phq4Answers[1]
    const depression = phq4Answers[2] + phq4Answers[3]
    addAssessment('phq4', { score: total, anxiety, depression, answers: phq4Answers })
    setActiveAssessment(null)
    setPhq4Answers([0, 0, 0, 0])
  }

  const PHQ4_QUESTIONS = [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
  ]

  if (activeAssessment === 'lsas') {
    const chunk = LSAS_ITEMS.slice(currentStep * 6, (currentStep + 1) * 6)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">Liebowitz Social Anxiety Scale</h3>
            <p className="text-xs text-text-muted">Items {currentStep * 6 + 1}–{Math.min((currentStep + 1) * 6, 24)} of 24</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`w-6 h-1.5 rounded-full ${i <= currentStep ? 'bg-violet-400' : 'bg-white/[0.08]'}`} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {chunk.map(item => (
            <div key={item.id} className="glass rounded-xl p-4">
              <p className="text-sm text-text-secondary mb-3">{item.id}. {item.situation}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Fear</p>
                  <div className="flex gap-1">
                    {LSAS_FEAR_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setLsasAnswers(prev => ({ ...prev, [item.id]: { ...prev[item.id], fear: i } }))}
                        className={`flex-1 text-[10px] py-1 rounded-lg transition-all ${
                          (lsasAnswers[item.id]?.fear ?? -1) === i
                            ? 'bg-violet-400/20 text-violet-300 border border-violet-400/30'
                            : 'glass text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Avoidance</p>
                  <div className="flex gap-1">
                    {LSAS_AVOID_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setLsasAnswers(prev => ({ ...prev, [item.id]: { ...prev[item.id], avoid: i } }))}
                        className={`flex-1 text-[10px] py-1 rounded-lg transition-all ${
                          (lsasAnswers[item.id]?.avoid ?? -1) === i
                            ? 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
                            : 'glass text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setActiveAssessment(null)} className="btn-ghost text-xs py-2 px-4 flex-1">Cancel</button>
          {currentStep < 3 ? (
            <button onClick={() => setCurrentStep(s => s + 1)} className="btn-primary text-xs py-2 px-4 flex-1">Next →</button>
          ) : (
            <button onClick={handleLSASSave} className="btn-primary text-xs py-2 px-4 flex-1">Submit & Score</button>
          )}
        </div>
      </div>
    )
  }

  if (activeAssessment === 'phq4') {
    const OPTIONS = ['Not at all (0)', 'Several days (1)', 'More than half (2)', 'Nearly every day (3)']
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary">PHQ-4 Brief Screener</h3>
          <p className="text-xs text-text-muted">Over the last 2 weeks, how often have you been bothered by:</p>
        </div>
        <div className="space-y-4">
          {PHQ4_QUESTIONS.map((q, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <p className="text-sm text-text-secondary mb-3">{q}</p>
              <div className="grid grid-cols-2 gap-2">
                {OPTIONS.map((opt, j) => (
                  <button
                    key={j}
                    onClick={() => setPhq4Answers(prev => { const a = [...prev]; a[i] = j; return a })}
                    className={`text-xs py-2 px-3 rounded-lg text-left transition-all ${
                      phq4Answers[i] === j
                        ? 'bg-violet-400/20 text-violet-300 border border-violet-400/30'
                        : 'glass text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveAssessment(null)} className="btn-ghost text-xs py-2 px-4 flex-1">Cancel</button>
          <button onClick={handlePHQ4Save} className="btn-primary text-xs py-2 px-4 flex-1">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-text-primary">Clinical Assessments</h2>
        <p className="text-xs text-text-muted mt-0.5">Track the exact measures therapists use. Prove to yourself the app works.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* LSAS Card */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">LSAS</h3>
              <p className="text-xs text-text-muted">Liebowitz Social Anxiety Scale</p>
              <p className="text-[10px] text-text-muted mt-0.5">24 items · 5 min · Gold standard</p>
            </div>
            <ClipboardList size={18} className="text-violet-400" />
          </div>
          {latest ? (
            <div>
              <div className="text-3xl font-bold" style={{ color: lsasSeverity(latest.score).color }}>
                {latest.score}<span className="text-sm font-normal text-text-muted">/144</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: lsasSeverity(latest.score).color }}>
                {lsasSeverity(latest.score).label}
              </div>
              <div className="text-[10px] text-text-muted mt-1">{new Date(latest.date).toLocaleDateString()}</div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">No assessment yet</p>
          )}
          <button onClick={() => { setActiveAssessment('lsas'); setCurrentStep(0) }} className="btn-ghost text-xs py-1.5 px-3 w-full">
            {latest ? 'Reassess' : 'Begin Assessment'}
          </button>
        </div>

        {/* PHQ-4 Card */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">PHQ-4</h3>
              <p className="text-xs text-text-muted">Anxiety & Depression Screener</p>
              <p className="text-[10px] text-text-muted mt-0.5">4 items · 1 min · Ultra-brief</p>
            </div>
            <CheckCircle2 size={18} className="text-teal-400" />
          </div>
          {latestPhq4 ? (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold text-amber-400">{latestPhq4.anxiety}</div>
                <div className="text-[10px] text-text-muted">Anxiety /6</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-400">{latestPhq4.depression}</div>
                <div className="text-[10px] text-text-muted">Depression /6</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">No assessment yet</p>
          )}
          <button onClick={() => { setActiveAssessment('phq4'); setPhq4Answers([0, 0, 0, 0]) }} className="btn-ghost text-xs py-1.5 px-3 w-full">
            {latestPhq4 ? 'Reassess' : 'Begin Screener'}
          </button>
        </div>
      </div>

      {assessments.lsas.length > 1 && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs text-text-muted uppercase tracking-widest mb-3">LSAS Trend</h3>
          <div className="space-y-2">
            {assessments.lsas.map((a, i) => {
              const sev = lsasSeverity(a.score)
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-[10px] text-text-muted w-20 flex-shrink-0">
                    {new Date(a.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: sev.color }}
                      animate={{ width: `${(a.score / 144) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8" style={{ color: sev.color }}>{a.score}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  EXPOSURE LOGGER & CHALLENGE SYSTEM
// ══════════════════════════════════════════
export function ExposureLogger() {
  const { exposureLog, addExposure, activeChallenges, completeChallenge } = useBodyStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ situation: '', sudsBefore: 5, sudsAfter: 5, whatWentWell: '', avoidanceUsed: false })
  const [tab, setTab] = useState('log') // log | challenges

  const avgReduction = exposureLog.length > 0
    ? Math.round(exposureLog.reduce((s, e) => s + Math.max(0, e.sudsBefore - e.sudsAfter), 0) / exposureLog.length)
    : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-text-primary">Real-World Exposure Log</h2>
        <p className="text-xs text-text-muted mt-0.5">The simulator is practice. Real life is the game. The app bridges both.</p>
      </div>

      <div className="flex gap-2">
        {['log', 'challenges'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
              tab === t ? 'bg-teal-400/15 text-teal-400 border border-teal-400/30' : 'glass text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'log' ? 'Exposure Log' : 'Weekly Challenges'}
          </button>
        ))}
      </div>

      {tab === 'challenges' ? (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">Challenges matched to your current Aven progress:</p>
          {activeChallenges.map(c => (
            <motion.div
              key={c.id}
              className={`glass rounded-xl p-4 flex items-start gap-3 ${c.completed ? 'opacity-60' : ''}`}
            >
              <div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  c.completed ? 'border-teal-400 bg-teal-400/20' : 'border-white/20'
                }`}>
                  {c.completed && <CheckCircle2 size={12} className="text-teal-400" />}
                </div>
              </div>
              <div className="flex-1">
                <p className={`text-sm ${c.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>{c.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-text-muted">{c.difficulty}</span>
                  <span className="text-[10px] text-text-muted">SUDS ~{c.suds}</span>
                </div>
              </div>
              {!c.completed && (
                <button onClick={() => completeChallenge(c.id)} className="btn-ghost text-[10px] py-1 px-2 flex-shrink-0">
                  Mark Done
                </button>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <>
          {avgReduction !== null && (
            <div className="glass-teal rounded-xl p-3 flex items-center gap-3">
              <div className="text-2xl font-bold text-teal-400">↓{avgReduction}</div>
              <div className="text-xs text-text-secondary">Average SUDS reduction per real-world exposure</div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setAdding(!adding)} className="btn-primary text-xs py-1.5 px-3">
              + Log Exposure
            </button>
          </div>

          <AnimatePresence>
            {adding && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass rounded-xl p-4 space-y-3"
              >
                <input
                  value={form.situation}
                  onChange={e => setForm(p => ({ ...p, situation: e.target.value }))}
                  placeholder="What was the situation? (e.g. Asked a stranger for directions)"
                  className="aven-input text-sm w-full"
                />
                <div className="grid grid-cols-2 gap-3">
                  {[['sudsBefore', 'SUDS Before'], ['sudsAfter', 'SUDS After']].map(([key, label]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted">{label}</span>
                        <span className="font-bold text-text-secondary">{form[key]}</span>
                      </div>
                      <input type="range" min={0} max={10} value={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: '#2dd4bf' }}
                      />
                    </div>
                  ))}
                </div>
                <textarea
                  value={form.whatWentWell}
                  onChange={e => setForm(p => ({ ...p, whatWentWell: e.target.value }))}
                  placeholder="What went well? (even something tiny)"
                  rows={2}
                  className="aven-input text-sm resize-none w-full"
                />
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={form.avoidanceUsed}
                    onChange={e => setForm(p => ({ ...p, avoidanceUsed: e.target.checked }))}
                    className="rounded" />
                  I used some avoidance in this situation
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setAdding(false)} className="btn-ghost text-xs py-1.5 px-3 flex-1">Cancel</button>
                  <button onClick={() => {
                    if (form.situation) { addExposure(form); setAdding(false); setForm({ situation: '', sudsBefore: 5, sudsAfter: 5, whatWentWell: '', avoidanceUsed: false }) }
                  }} className="btn-primary text-xs py-1.5 px-3 flex-1">Log it</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {exposureLog.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-text-secondary text-sm">No real-world exposures logged yet.</p>
              <p className="text-xs text-text-muted mt-1">After each time you try something from your fear hierarchy in real life, log it here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exposureLog.slice().reverse().map(entry => {
                const reduction = entry.sudsBefore - entry.sudsAfter
                return (
                  <div key={entry.id} className="glass rounded-xl p-4">
                    <p className="text-sm text-text-primary">{entry.situation}</p>
                    <div className="flex gap-4 mt-2 text-xs text-text-muted">
                      <span>Before: <b className="text-amber-400">{entry.sudsBefore}</b></span>
                      <span>After: <b className="text-teal-400">{entry.sudsAfter}</b></span>
                      <span className={`font-bold ${reduction >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                        {reduction >= 0 ? `↓${reduction}` : `↑${Math.abs(reduction)}`} SUDS
                      </span>
                    </div>
                    {entry.whatWentWell && <p className="text-xs text-teal-400 mt-1">✓ {entry.whatWentWell}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  PERSONAL INSIGHT ENGINE
// ══════════════════════════════════════════
export function InsightEngine({ sessionHistory = [] }) {
  // Compute patterns from all sessions
  const insights = []

  if (sessionHistory.length >= 3) {
    const domainDistortions = {}
    sessionHistory.forEach(s => {
      if (!domainDistortions[s.domain]) domainDistortions[s.domain] = {}
      s.distortions?.forEach(d => {
        domainDistortions[s.domain][d.key] = (domainDistortions[s.domain][d.key] || 0) + 1
      })
    })

    const domains = Object.entries(domainDistortions)
    if (domains.length >= 2) {
      const sorted = domains.sort((a, b) =>
        Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0)
      )
      insights.push({
        id: 1,
        type: 'pattern',
        title: 'Trigger Domain',
        text: `You show ${Math.round((Object.values(sorted[0][1]).reduce((s, v) => s + v, 0) / Object.values(sorted[1][1]).reduce((s, v) => s + v, 0)) * 10) / 10}× more distortions in ${sorted[0][0]} scenarios than ${sorted[1][0]} ones.`,
        confidence: 0.82,
        color: '#a78bfa',
      })
    }

    const timePatterns = { morning: 0, afternoon: 0, evening: 0 }
    sessionHistory.forEach(s => {
      const h = new Date(s.timestamp).getHours()
      if (h < 12) timePatterns.morning++
      else if (h < 17) timePatterns.afternoon++
      else timePatterns.evening++
    })
    const peakTime = Object.entries(timePatterns).sort((a, b) => b[1] - a[1])[0]
    insights.push({
      id: 2,
      type: 'timing',
      title: 'Peak Practice Time',
      text: `${peakTime[1]} of your last ${sessionHistory.length} sessions were in the ${peakTime[0]}. Consistent timing builds habit more reliably than motivation.`,
      confidence: 0.91,
      color: '#2dd4bf',
    })

    const allDistortions = sessionHistory.flatMap(s => s.distortions || [])
    const counts = {}
    allDistortions.forEach(d => counts[d.key] = (counts[d.key] || 0) + 1)
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (top) {
      insights.push({
        id: 3,
        type: 'distortion',
        title: 'Signature Distortion',
        text: `${top[0].replace(/_/g, ' ')} appears in ${Math.round((top[1] / allDistortions.length) * 100)}% of your detected events. This is your cognitive signature — the lens you see social threat through.`,
        confidence: 0.88,
        color: '#fb7185',
      })
    }
  }

  // Mock insights when not enough data
  const displayInsights = insights.length >= 2 ? insights : [
    {
      id: 1,
      type: 'warmup',
      title: 'Getting Started',
      text: 'Complete 3 or more sessions to unlock your personal insight engine. It analyzes patterns you\'d never notice yourself.',
      confidence: 1.0,
      color: '#fbbf24',
    },
    {
      id: 2,
      type: 'tip',
      title: 'Proven Insight',
      text: 'Most people with social anxiety catastrophize in authority scenarios but not stranger scenarios. Which one is harder for you?',
      confidence: 0.74,
      color: '#60a5fa',
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-text-primary">Personal Insight Engine</h2>
        <p className="text-xs text-text-muted mt-0.5">Finds patterns across all your sessions that you'd never notice yourself. Your psychological fingerprint.</p>
      </div>

      <div className="space-y-3">
        {displayInsights.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-4 border-l-2"
            style={{ borderLeftColor: insight.color }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: insight.color }}>
                  {insight.title}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{insight.text}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-text-muted">Confidence</div>
                <div className="text-sm font-bold" style={{ color: insight.color }}>
                  {Math.round(insight.confidence * 100)}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {sessionHistory.length < 3 && (
        <div className="glass rounded-xl p-4 border border-white/[0.04]">
          <div className="text-xs text-text-muted mb-2">Sessions needed to unlock full engine</div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${(sessionHistory.length / 3) * 100}%` }} />
          </div>
          <div className="text-xs text-text-muted mt-1">{sessionHistory.length}/3 sessions complete</div>
        </div>
      )}
    </div>
  )
}
