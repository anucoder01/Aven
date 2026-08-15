import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ChevronRight, Check, ExternalLink, Brain, MessageSquare, FlaskConical, Eye, Info, X } from 'lucide-react'
import { useTherapyStore } from '../../store/therapyStore'
import { useSessionStore } from '../../store/sessionStore'
import { DISTORTION_LABELS } from '../../data/scenarios'
import { useNavigate } from 'react-router-dom'

// ══════════════════════════════════════════
//  FEATURE HEADER (WITH INFO TOOLTIP)
// ══════════════════════════════════════════
function FeatureHeader({ title, subtitle, description, steps, children }) {
  const [infoOpen, setInfoOpen] = useState(false)
  return (
    <div className="mb-2">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-text-primary flex items-center">
            {title}
            <button onClick={() => setInfoOpen(!infoOpen)} className="text-text-muted hover:text-teal-400 transition-colors ml-2" title="How to use">
              <Info size={14} />
            </button>
          </h2>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {children && (
          <div className="flex gap-2 flex-shrink-0">
            {children}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-teal rounded-xl p-4 mt-4 text-sm text-teal-100/90 space-y-2 relative border border-teal-400/20">
              <button onClick={() => setInfoOpen(false)} className="absolute top-3 right-3 text-teal-400 hover:text-teal-300">
                <X size={14} />
              </button>
              <h4 className="font-semibold text-teal-400 mb-1 pr-6">How to use {title}</h4>
              <p className="text-xs leading-relaxed">{description}</p>
              {steps && (
                <ol className="list-decimal pl-4 space-y-1 mt-2 text-xs">
                  {steps.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════
//  TAB 1: THOUGHT RECORDS
// ══════════════════════════════════════════
const THOUGHT_RECORD_COLS = [
  { key: 'situation', label: 'Situation', placeholder: 'What happened? Where were you, who was there?', rows: 2 },
  { key: 'automaticThought', label: 'Automatic Thought', placeholder: "What went through your mind? What did it mean about you?", rows: 2 },
  { key: 'emotion', label: 'Emotion & Intensity', placeholder: 'e.g. Shame 70%, Anxiety 80%', rows: 1 },
  { key: 'evidenceFor', label: 'Evidence For', placeholder: 'What facts support this thought? (not feelings, facts)', rows: 3 },
  { key: 'evidenceAgainst', label: 'Evidence Against', placeholder: 'What facts contradict this thought?', rows: 3 },
  { key: 'balancedThought', label: 'Balanced Thought', placeholder: 'A more balanced way of seeing the situation...', rows: 2 },
  { key: 'outcome', label: 'Outcome', placeholder: 'How do you feel now? What will you do?', rows: 2 },
]

function ThoughtRecordEditor({ record, onSave, onClose }) {
  const [data, setData] = useState(record)
  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Brain size={15} className="text-violet-400" /> CBT Thought Record
        </h3>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
          <button onClick={() => onSave(data)} className="btn-primary text-xs py-1.5 px-3">Save</button>
        </div>
      </div>

      {/* Linked distortion badge */}
      {record.distortionsLinked?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-[10px] text-text-muted">Linked from session:</span>
          {record.distortionsLinked.map(d => {
            const label = DISTORTION_LABELS.find(l => l.key === d.key)
            return label ? (
              <span key={d.key} className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: `${label.color}15`, color: label.color, borderColor: `${label.color}30` }}>
                {label.emoji} {label.label}
              </span>
            ) : null
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {THOUGHT_RECORD_COLS.map(col => (
          <div key={col.key}>
            <label className="block text-xs font-medium text-text-secondary mb-1">{col.label}</label>
            <textarea
              value={data[col.key] || ''}
              onChange={e => update(col.key, e.target.value)}
              placeholder={col.placeholder}
              rows={col.rows}
              className="aven-input text-sm resize-none w-full"
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function ThoughtRecordTab() {
  const { thoughtRecords, addThoughtRecord, updateThoughtRecord, deleteThoughtRecord } = useTherapyStore()
  const { distortionEvents } = useSessionStore()
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const createFromSession = () => {
    const lastDistortions = distortionEvents.slice(-3).flatMap(e => e.distortions)
    const newRecord = {
      automaticThought: lastDistortions[0] ? `[From session: detected ${lastDistortions[0].label}]` : '',
      distortionsLinked: lastDistortions,
    }
    setEditing({ ...newRecord, id: null })
    setCreating(true)
  }

  const handleSave = (data) => {
    if (data.id) updateThoughtRecord(data.id, data)
    else addThoughtRecord(data)
    setEditing(null)
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <FeatureHeader 
        title="Thought Records"
        subtitle="The most-assigned CBT homework — digitized and auto-populated from your sessions."
        description="A core CBT technique to identify and challenge irrational thoughts (cognitive distortions)."
        steps={[
          "Notice when you feel a sudden negative emotion or anxiety spike.",
          "Record the situation and your automatic thought.",
          "List objective evidence that supports and contradicts this thought.",
          "Write a more balanced, realistic perspective."
        ]}
      >
        {distortionEvents.length > 0 && (
          <button onClick={createFromSession} className="btn-ghost text-xs py-1.5 px-3">
            <Brain size={11} /> From Session
          </button>
        )}
        <button onClick={() => { setEditing({}); setCreating(true) }} className="btn-primary text-xs py-1.5 px-3">
          <Plus size={11} /> New Record
        </button>
      </FeatureHeader>

      <AnimatePresence>
        {(creating || editing?.id) && (
          <ThoughtRecordEditor
            record={editing || {}}
            onSave={handleSave}
            onClose={() => { setEditing(null); setCreating(false) }}
          />
        )}
      </AnimatePresence>

      {thoughtRecords.length === 0 && !creating ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Brain size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No thought records yet.</p>
          <p className="text-text-muted text-xs mt-1">Create one after a session to document and challenge a distorted thought.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {thoughtRecords.map(record => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4 flex items-start gap-3 hover:border-white/[0.1] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary font-medium truncate">
                  {record.situation || 'Untitled situation'}
                </div>
                <div className="text-xs text-text-muted mt-0.5 truncate italic">
                  "{record.automaticThought || 'No automatic thought recorded'}"
                </div>
                {record.balancedThought && (
                  <div className="text-xs text-teal-400 mt-1 truncate">
                    ✓ {record.balancedThought}
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing(record)} className="btn-ghost text-xs py-1 px-2">Edit</button>
                <button onClick={() => deleteThoughtRecord(record.id)} className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  TAB 2: SOCRATIC COACH
// ══════════════════════════════════════════
const SOCRATIC_QUESTIONS = [
  "What's the evidence that this thought is true?",
  "What's the evidence against this thought?",
  "Is there another way to look at this situation?",
  "What would you tell a close friend who had this thought?",
  "What's the worst that could realistically happen?",
  "How likely is that worst case, really?",
  "Even if it happened, how would you cope?",
  "What does this thought stop you from doing?",
  "Will this matter in 5 years? In 5 months?",
  "What would a more balanced version of this thought look like?",
]

export function SocraticCoachTab() {
  const { socraticSessions, addSocraticSession, updateSocraticSession } = useTherapyStore()
  const { distortionEvents, messages } = useSessionStore()
  const [active, setActive] = useState(null)
  const [answer, setAnswer] = useState('')

  const startSession = (startingThought = '') => {
    addSocraticSession({ startingThought, exchanges: [], phase: 0 })
    const newId = Date.now()
    setTimeout(() => {
      setActive(socraticSessions[socraticSessions.length] || { id: newId, startingThought, exchanges: [], phase: 0 })
    }, 50)
  }

  const askNext = () => {
    if (!active || !answer.trim()) return
    const nextQ = SOCRATIC_QUESTIONS[active.exchanges?.length || 0]
    const updated = {
      ...active,
      exchanges: [...(active.exchanges || []), { question: nextQ || 'What balanced thought does this lead you to?', answer }],
    }
    setActive(updated)
    updateSocraticSession(active.id, updated)
    setAnswer('')
  }

  const currentQuestion = active
    ? SOCRATIC_QUESTIONS[active.exchanges?.length || 0] || "What balanced thought does this lead you to?"
    : null

  // Get last distorted thought from session
  const lastDistortion = distortionEvents.slice(-1)[0]?.distortions[0]
  const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.text || ''

  return (
    <div className="space-y-4">
      <FeatureHeader 
        title="Socratic Questioning Coach"
        subtitle="Not telling you what to think — teaching you to question your own thoughts. The difference is everything."
        description="Instead of just telling you not to worry, this tool asks you targeted questions to help you reach a logical conclusion on your own."
        steps={[
          "Enter a negative thought that's bothering you.",
          "The coach will ask you a series of questions.",
          "Answer them honestly to examine your thought from multiple angles and defuse its emotional power."
        ]}
      />

      {!active ? (
        <div className="space-y-3">
          {lastDistortion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-violet rounded-xl p-4"
            >
              <div className="text-xs text-violet-400 font-medium mb-2 flex items-center gap-1">
                <Brain size={11} /> From your last session
              </div>
              <p className="text-sm text-text-secondary italic">"{lastUserMsg}"</p>
              <p className="text-xs text-text-muted mt-1">Flagged: {lastDistortion?.label}</p>
              <button
                onClick={() => startSession(lastUserMsg)}
                className="btn-primary text-xs py-1.5 px-3 mt-3"
              >
                Explore this thought <ChevronRight size={11} />
              </button>
            </motion.div>
          )}

          <div className="glass rounded-2xl p-6">
            <label className="text-xs font-medium text-text-secondary block mb-2">Start with any thought:</label>
            <textarea
              className="aven-input text-sm resize-none w-full mb-3"
              placeholder="Type a thought you want to examine... e.g. 'I'm going to completely fail this presentation'"
              rows={2}
              id="socratic-start"
            />
            <button
              onClick={() => {
                const el = document.getElementById('socratic-start')
                startSession(el?.value || '')
              }}
              className="btn-primary text-sm"
            >
              Begin Socratic Inquiry <ChevronRight size={14} />
            </button>
          </div>

          {socraticSessions.length > 0 && (
            <div>
              <h3 className="text-xs text-text-muted uppercase tracking-widest mb-2">Past Sessions</h3>
              <div className="space-y-2">
                {socraticSessions.slice().reverse().map(s => (
                  <div key={s.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-secondary truncate italic">"{s.startingThought || 'Untitled'}"</p>
                      <p className="text-xs text-text-muted">{s.exchanges?.length || 0} questions explored</p>
                    </div>
                    <button onClick={() => setActive(s)} className="btn-ghost text-xs py-1 px-2">Continue</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-violet rounded-xl p-4">
            <div className="text-xs text-violet-400 mb-1">Starting thought</div>
            <p className="text-sm text-text-primary italic">"{active.startingThought}"</p>
          </div>

          <div className="space-y-3">
            {active.exchanges?.map((ex, i) => (
              <div key={i} className="glass rounded-xl p-3">
                <p className="text-xs text-teal-400 mb-1">Q{i+1}: {ex.question}</p>
                <p className="text-sm text-text-secondary">{ex.answer}</p>
              </div>
            ))}
          </div>

          {active.exchanges?.length < SOCRATIC_QUESTIONS.length ? (
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <MessageSquare size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-text-primary">{currentQuestion}</p>
              </div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="aven-input text-sm resize-none w-full"
                placeholder="Take your time to answer honestly..."
                rows={3}
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && askNext()}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">
                  Question {(active.exchanges?.length || 0) + 1} of {SOCRATIC_QUESTIONS.length}
                </span>
                <button onClick={askNext} className="btn-primary text-xs py-1.5 px-3">
                  Next Question <ChevronRight size={11} />
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-teal rounded-xl p-4">
              <p className="text-sm text-teal-400 font-medium mb-1">Session Complete</p>
              <p className="text-xs text-text-secondary">You've examined this thought from {SOCRATIC_QUESTIONS.length} angles. Notice how it looks different now?</p>
              <button onClick={() => setActive(null)} className="btn-ghost text-xs py-1.5 px-3 mt-3">
                Start New Session
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  TAB 3: FEAR HIERARCHY
// ══════════════════════════════════════════
function SUDSColor(suds) {
  if (suds <= 30) return '#34d399'
  if (suds <= 55) return '#fbbf24'
  if (suds <= 75) return '#fb923c'
  return '#fb7185'
}

export function FearHierarchyTab() {
  const { fearHierarchy, addFearItem, deleteFearItem, markFearPracticed } = useTherapyStore()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ situation: '', suds: 50 })

  const practicedCount = fearHierarchy.filter(i => i.practiced).length

  return (
    <div className="space-y-4">
      <FeatureHeader 
        title="Fear Hierarchy"
        subtitle="Map every social situation on a 0–100 SUDS scale. Systematically conquer the list."
        description="Systematic desensitization involves gradually facing your fears, starting from the easiest to the hardest."
        steps={[
          "Add situations that make you anxious and rate them from 0 to 100 on the SUDS (Subjective Units of Distress Scale).",
          "Start practicing the easiest situations (lowest SUDS score) first.",
          "Once a situation feels manageable, check it off and move to the next one!"
        ]}
      >
        <button onClick={() => setAdding(true)} className="btn-primary text-xs py-1.5 px-3">
          <Plus size={11} /> Add Situation
        </button>
      </FeatureHeader>

      <div className="glass rounded-xl p-3 flex items-center gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-teal-400">{practicedCount}/{fearHierarchy.length}</div>
          <div className="text-xs text-text-muted">Practiced</div>
        </div>
        <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-teal-400"
            animate={{ width: `${(practicedCount / fearHierarchy.length) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="text-sm text-teal-400 font-semibold">
          {Math.round((practicedCount / fearHierarchy.length) * 100)}%
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass rounded-xl p-4 space-y-3">
            <input
              value={newItem.situation}
              onChange={e => setNewItem(p => ({ ...p, situation: e.target.value }))}
              placeholder="Describe the feared situation..."
              className="aven-input text-sm w-full"
            />
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">SUDS Level (0–100)</span>
                <span className="font-bold" style={{ color: SUDSColor(newItem.suds) }}>{newItem.suds}</span>
              </div>
              <input type="range" min={0} max={100} value={newItem.suds}
                onChange={e => setNewItem(p => ({ ...p, suds: Number(e.target.value) }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: SUDSColor(newItem.suds) }}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="btn-ghost text-xs py-1.5 px-3 flex-1">Cancel</button>
              <button onClick={() => {
                if (newItem.situation) { addFearItem(newItem); setAdding(false); setNewItem({ situation: '', suds: 50 }) }
              }} className="btn-primary text-xs py-1.5 px-3 flex-1">Add to Hierarchy</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {fearHierarchy.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`glass rounded-xl p-3 flex items-center gap-3 transition-all ${item.practiced ? 'opacity-60' : ''}`}
          >
            <div className="flex-shrink-0 w-12 text-center">
              <div className="text-lg font-bold" style={{ color: SUDSColor(item.suds) }}>{item.suds}</div>
              <div className="text-[9px] text-text-muted">SUDS</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${item.practiced ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                {item.situation}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {item.scenarioId && (
                <button
                  onClick={() => navigate(`/session/${item.scenarioId}/1`)}
                  className="btn-ghost text-[10px] py-1 px-2 hidden sm:flex"
                >
                  <ExternalLink size={9} /> Practice
                </button>
              )}
              <button
                onClick={() => markFearPracticed(item.id)}
                className={`p-1.5 rounded-lg transition-colors ${item.practiced ? 'text-teal-400' : 'text-text-muted hover:text-teal-400'}`}
              >
                <Check size={13} />
              </button>
              <button onClick={() => deleteFearItem(item.id)} className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 justify-end text-[10px] text-text-muted">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> 0–30 Low</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> 31–55 Moderate</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /> 56–75 High</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400" /> 76+ Very High</div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
//  TAB 4: BEHAVIORAL EXPERIMENTS
// ══════════════════════════════════════════
export function BehavioralExperimentTab() {
  const { experiments, addExperiment, getPredictionAccuracy } = useTherapyStore()
  const { distortionEvents, messages } = useSessionStore()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ prediction: '', actionPlan: '', outcome: '', analysis: '' })
  // unused selectedId

  const accuracy = getPredictionAccuracy()
  const lastCatastrophe = distortionEvents.flatMap(e => e.distortions).find(d => d.key === 'catastrophizing')
  const lastMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.text || ''

  const handleCreate = () => {
    addExperiment(form)
    setCreating(false)
    setForm({ prediction: '', actionPlan: '', outcome: '', analysis: '' })
  }

  // unused assignment selected removed

  return (
    <div className="space-y-4">
      <FeatureHeader 
        title="Behavioral Experiments"
        subtitle="Test your anxiety predictions against reality. You're almost always wrong about how bad it'll be."
        description="Anxiety tricks you into making catastrophic predictions. Behavioral experiments treat these predictions as hypotheses to test in the real world."
        steps={[
          "Write down exactly what you fear will happen (the prediction).",
          "Do a practice session to actually test it (the action plan).",
          "Record what actually happened and compare it to your prediction! Over time, you'll see your worst fears rarely come true."
        ]}
      >
        <button onClick={() => setCreating(true)} className="btn-primary text-xs py-1.5 px-3">
          <Plus size={11} /> New Experiment
        </button>
      </FeatureHeader>

      {accuracy !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-teal rounded-xl p-4 flex items-center gap-4"
        >
          <div className="text-3xl font-bold text-teal-400">{accuracy}%</div>
          <div>
            <div className="text-sm font-medium text-text-primary">of the time you were wrong</div>
            <div className="text-xs text-text-muted">Outcomes were better than your predictions</div>
          </div>
        </motion.div>
      )}

      {lastCatastrophe && !creating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-rose rounded-xl p-4"
        >
          <div className="text-xs text-rose-400 mb-2">💥 Catastrophizing detected in last session:</div>
          <p className="text-sm text-text-secondary italic mb-3">"{lastMsg}"</p>
          <button
            onClick={() => {
              setForm({ prediction: lastMsg, actionPlan: '', outcome: '', analysis: '' })
              setCreating(true)
            }}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            <FlaskConical size={11} /> Test this prediction
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-5 space-y-4"
          >
            <h3 className="font-medium text-text-primary text-sm">New Behavioral Experiment</h3>
            {[
              { key: 'prediction', label: '1. Prediction', placeholder: "What do you predict will happen? What's the feared outcome? Be specific.", rows: 2 },
              { key: 'actionPlan', label: '2. Action Plan', placeholder: "What will you actually do to test this? When and where?", rows: 2 },
              { key: 'outcome', label: '3. Actual Outcome', placeholder: "What actually happened? Be honest — include any avoidance.", rows: 2 },
              { key: 'analysis', label: '4. Analysis', placeholder: "What does the outcome tell you? How does it compare to your prediction?", rows: 2 },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-text-secondary mb-1">{field.label}</label>
                <textarea
                  value={form[field.key]}
                  onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={field.rows}
                  className="aven-input text-sm resize-none w-full"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setCreating(false)} className="btn-ghost text-xs py-1.5 px-3 flex-1">Cancel</button>
              <button onClick={handleCreate} className="btn-primary text-xs py-1.5 px-3 flex-1">Save Experiment</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {experiments.length === 0 && !creating ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FlaskConical size={32} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No experiments yet.</p>
          <p className="text-text-muted text-xs mt-1">Run a session, detect a catastrophic prediction, then test it against reality.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {experiments.map(exp => (
            <motion.div
              key={exp.id}
              className="glass rounded-xl p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${exp.status === 'completed' ? 'bg-teal-400/10' : 'bg-white/[0.04]'}`}>
                  <FlaskConical size={13} className={exp.status === 'completed' ? 'text-teal-400' : 'text-text-muted'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-secondary italic truncate">"{exp.prediction}"</p>
                  {exp.outcome && (
                    <p className="text-xs text-teal-400 mt-1 truncate">Outcome: {exp.outcome}</p>
                  )}
                  <div className="flex gap-3 mt-2">
                    {/* Record outcome button removed */}
                    <span className="text-[10px] text-text-muted">{new Date(exp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
//  TAB 5: IMAGERY RESCRIPTING
// ══════════════════════════════════════════
export function ImageryRescriptingTab() {
  const { rescriptingSessions, addRescriptingSession, updateRescriptingSession } = useTherapyStore()
  const [phase, setPhase] = useState(0) // 0=gate, 1=write, 2=rescript, 3=reread
  const [sessionId, setSessionId] = useState(null)
  const [distressCheck, setDistressCheck] = useState(5)
  const [memory, setMemory] = useState('')
  const [rescripted, setRescripted] = useState('')

  // unused currentSession removed

  const beginSafely = () => {
    if (distressCheck >= 7) return
    addRescriptingSession({ phase: 1 })
    const id = Date.now()
    setSessionId(id)
    setPhase(1)
  }

  if (phase === 0) return (
    <div className="space-y-4">
      <FeatureHeader 
        title="Imagery Rescripting"
        subtitle="Replay your worst social memory — then rewrite how it ends. Clinically, this rewires the emotional charge. Effect sizes: d=0.9–1.2."
        description="A powerful technique to reduce the emotional pain of past traumatic or embarrassing memories by rewriting how they end."
        steps={[
          "Verify you are in a safe, calm state (distress below 7).",
          "Write out the difficult memory in detail.",
          "Reimagine the scene from the perspective of a compassionate bystander who intervenes or changes the outcome.",
          "Re-read the new, safe ending to rewire the emotional charge of the memory."
        ]}
      />

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-400/[0.06] border border-amber-400/20">
          <Eye size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300 leading-relaxed">
            <strong>Safety check required.</strong> This technique involves revisiting a difficult memory. Only proceed when you're in a calm, safe state. Current distress should be 6 or below.
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-text-secondary">How are you feeling right now? (1–10)</span>
            <span className="font-bold" style={{ color: distressCheck >= 7 ? '#fb7185' : '#2dd4bf' }}>
              {distressCheck}/10
            </span>
          </div>
          <input type="range" min={1} max={10} value={distressCheck}
            onChange={e => setDistressCheck(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: distressCheck >= 7 ? '#fb7185' : '#2dd4bf' }}
          />
        </div>

        {distressCheck >= 7 ? (
          <div className="text-center p-4 rounded-xl bg-rose-400/[0.08] border border-rose-400/20">
            <p className="text-sm text-rose-400">Your distress is too high right now ({distressCheck}/10).</p>
            <p className="text-xs text-text-muted mt-1">Try a grounding exercise first, then return when you're at 6 or below.</p>
          </div>
        ) : (
          <button onClick={beginSafely} className="btn-primary w-full justify-center">
            <Eye size={14} /> Begin Imagery Rescripting
          </button>
        )}
      </div>

      {rescriptingSessions.length > 0 && (
        <div>
          <h3 className="text-xs text-text-muted uppercase tracking-widest mb-2">Past Sessions</h3>
          <div className="space-y-2">
            {rescriptingSessions.slice().reverse().map(s => (
              <div key={s.id} className="glass rounded-xl p-3">
                <p className="text-xs text-text-muted truncate">{new Date(s.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-text-secondary mt-1 line-clamp-2 italic">"{s.originalMemory || 'Memory not recorded'}"</p>
                {s.rescriptedMemory && <p className="text-xs text-teal-400 mt-1">✓ Rescripted</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (phase === 1) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Phase 1: The Memory</h2>
        <span className="text-xs text-text-muted">Step 1 of 3</span>
      </div>
      <div className="glass-violet rounded-xl p-4">
        <p className="text-xs text-violet-400 mb-2">Write the social memory that still carries emotional charge.</p>
        <p className="text-xs text-text-muted">Include: what happened, what you felt, what you told yourself afterward. Write until it feels complete.</p>
      </div>
      <textarea
        value={memory}
        onChange={e => setMemory(e.target.value)}
        placeholder="Describe the memory in as much detail as you're comfortable with..."
        rows={10}
        className="aven-input text-sm resize-none w-full"
      />
      <button
        disabled={memory.length < 50}
        onClick={() => { setPhase(2); updateRescriptingSession(sessionId, { originalMemory: memory }) }}
        className="btn-primary w-full justify-center disabled:opacity-40"
      >
        Continue to Rescripting <ChevronRight size={14} />
      </button>
    </div>
  )

  if (phase === 2) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Phase 2: Rewrite the Ending</h2>
        <span className="text-xs text-text-muted">Step 2 of 3</span>
      </div>
      <div className="glass rounded-xl p-4 border border-white/[0.04]">
        <p className="text-xs text-text-muted uppercase tracking-widest mb-2">Original Memory</p>
        <p className="text-sm text-text-secondary italic line-clamp-4">"{memory}"</p>
      </div>
      <div className="glass-teal rounded-xl p-4">
        <p className="text-xs text-teal-400 mb-1">Now imagine a compassionate bystander watching this scene.</p>
        <p className="text-xs text-text-muted">Rewrite the memory from their perspective — what do they see? How do they respond to you? How does the scene end differently?</p>
      </div>
      <textarea
        value={rescripted}
        onChange={e => setRescripted(e.target.value)}
        placeholder="A compassionate bystander walks over and says... The scene unfolds differently: ..."
        rows={10}
        className="aven-input text-sm resize-none w-full"
      />
      <button
        disabled={rescripted.length < 50}
        onClick={() => { setPhase(3); updateRescriptingSession(sessionId, { rescriptedMemory: rescripted, completedAt: new Date().toISOString() }) }}
        className="btn-primary w-full justify-center disabled:opacity-40"
      >
        Read the New Story <ChevronRight size={14} />
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Phase 3: Absorb the Rewrite</h2>
        <span className="text-xs text-text-muted">Step 3 of 3</span>
      </div>
      <div className="glass-teal rounded-xl p-6 space-y-4">
        <p className="text-xs text-teal-400 font-medium uppercase tracking-widest">Read slowly. Let it land.</p>
        <p className="text-sm text-text-primary leading-relaxed">{rescripted}</p>
      </div>
      <div className="glass rounded-xl p-4 text-center space-y-3">
        <p className="text-sm text-text-secondary">How does this version of the memory feel?</p>
        <p className="text-xs text-text-muted">Research shows that revisiting a rescripted memory repeatedly gradually reduces its emotional charge. You can re-read this at any time.</p>
        <button onClick={() => setPhase(0)} className="btn-ghost text-sm">Complete Session</button>
      </div>
    </div>
  )
}
