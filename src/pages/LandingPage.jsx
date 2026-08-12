import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Mic, BarChart3, ChevronRight, Sparkles, Star, Lock, Plus, Loader2 } from 'lucide-react'
import AvenOrb from '../components/3d/AvenOrb'
import AuroraBackground from '../components/3d/AuroraBackground'
import { characters as SCENARIOS, CHARACTER_DOMAINS as DOMAINS } from '../data/characterLibrary'
import { useUserStore } from '../store/userStore'
import { getMaxUnlockedLevel } from '../lib/adaptiveDifficulty'

const DIFFICULTY_LABELS = ['', 'Cooperative', 'Skeptical', 'Dismissive', 'Critical', 'Hostile']
const DIFFICULTY_COLORS = ['', '#2dd4bf', '#a78bfa', '#fbbf24', '#fb923c', '#fb7185']

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <div className="text-xs text-text-muted">{label}</div>
        <div className="text-sm font-semibold text-text-primary">{value}</div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(1)
  const { user, completedReports, customScenarios, addCustomScenario } = useUserStore()
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isReversal, setIsReversal] = useState(false)

  const scenariosInDomain = selectedDomain
    ? (selectedDomain === 'custom' ? customScenarios || [] : SCENARIOS.filter(s => s.domain === selectedDomain))
    : []

  const domain = DOMAINS.find(d => d.id === selectedDomain)

  const maxLevel = selectedScenario ? getMaxUnlockedLevel(selectedScenario.id, completedReports) : 1

  const handleGenerateScenario = async () => {
    if (!customPrompt.trim() || isGenerating) return
    setIsGenerating(true)
    try {
      const res = await fetch('http://localhost:8000/llm/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt })
      })
      const data = await res.json()
      if (data && data.id) {
        addCustomScenario(data)
        setCustomPrompt('')
        handleScenarioSelect(data)
      } else {
        alert("Failed to generate scenario. Check backend.")
      }
    } catch (e) {
      console.error(e)
      alert("Error calling backend to generate scenario.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario)
    // Default to highest unlocked level or 1
    const unlocked = getMaxUnlockedLevel(scenario.id, completedReports)
    setSelectedLevel(unlocked)
  }

  const handleStartSession = () => {
    if (!selectedScenario) return
    let url = `/session/${selectedScenario.id}/${selectedLevel}`
    if (isReversal) url += `?mode=reversal`
    navigate(url)
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#07071a' }}>
      <AuroraBackground />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <AvenOrb state="idle" amplitude={0} size={200} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5 text-sm text-text-secondary">
            <Sparkles size={12} className="text-teal-400" />
            AI-powered social anxiety CBT training
          </div>

          <h1 className="font-display text-5xl md:text-6xl text-text-primary mb-4 leading-tight">
            Practice the{' '}
            <span className="gradient-text">hardest conversations</span>
            <br />
            before they happen.
          </h1>

          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            25 realistic scenarios. 6 social fear domains. Real-time distortion detection with 15 cognitive patterns.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <StatPill icon={Brain} label="Distortion Types" value="15 detected" color="#a78bfa" />
            <StatPill icon={BarChart3} label="Your Streak" value={`${user.streak} days`} color="#2dd4bf" />
            <StatPill icon={Star} label="Improvement" value={`+${user.improvementPct}%`} color="#fbbf24" />
          </div>
        </motion.div>
      </section>

      {/* Scenario Selector */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="relative z-10 max-w-5xl mx-auto px-4 pb-16 space-y-5"
      >
        {/* Step 1: Domain */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-teal-400/20 text-teal-400">1</div>
            <h2 className="text-text-secondary text-sm font-medium uppercase tracking-widest">Choose Your Domain</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {DOMAINS.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setSelectedDomain(d.id); setSelectedScenario(null) }}
                className={`glass rounded-xl p-3 text-center transition-all flex flex-col items-center gap-1.5 hover:border-white/[0.12] ${
                  selectedDomain === d.id ? 'border-white/[0.12]' : ''
                }`}
                style={selectedDomain === d.id ? { boxShadow: `0 0 0 1px ${d.color}40`, borderColor: `${d.color}40` } : {}}
              >
                {selectedDomain === d.id && (
                  <div className="absolute inset-0 rounded-xl opacity-10" style={{ background: d.color }} />
                )}
                <span className="text-2xl">{d.icon}</span>
                <span className="text-[11px] font-medium text-text-secondary leading-tight">{d.label}</span>
                <span className="text-[9px] text-text-muted">{SCENARIOS.filter(s => s.domain === d.id).length} scenarios</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Step 2: Scenario */}
        <AnimatePresence>
          {selectedDomain && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-teal-400/20 text-teal-400">2</div>
                <h2 className="text-text-secondary text-sm font-medium uppercase tracking-widest">
                  {domain?.label} Scenarios
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {selectedDomain === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden glass rounded-xl p-4 flex flex-col justify-center items-center gap-3 border-dashed border-white/[0.2] hover:border-teal-400/50 transition-all col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-5"
                  >
                    <div className="w-full max-w-xl flex flex-col gap-3">
                      <div className="text-sm text-text-primary font-medium flex items-center gap-2">
                        <Sparkles size={16} className="text-teal-400" /> Create Custom Scenario
                      </div>
                      <textarea
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="Describe your upcoming event... (e.g. 'I have a performance review tomorrow with my passive-aggressive boss.')"
                        className="aven-input w-full text-sm py-3 h-24 resize-none"
                        disabled={isGenerating}
                      />
                      <button
                        onClick={handleGenerateScenario}
                        disabled={isGenerating || !customPrompt.trim()}
                        className="btn-primary w-full justify-center disabled:opacity-50"
                      >
                        {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating AI Persona...</> : <><Plus size={16} /> Generate Scenario</>}
                      </button>
                    </div>
                  </motion.div>
                )}

                {scenariosInDomain.map((scenario, i) => {
                  // Custom scenarios default to level 5 unlocked or handled via typical logic
                  const unlocked = selectedDomain === 'custom' ? 5 : getMaxUnlockedLevel(scenario.id, completedReports)
                  return (
                    <motion.div
                      key={scenario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleScenarioSelect(scenario)}
                      className={`relative overflow-hidden glass rounded-xl p-4 cursor-pointer transition-all ${
                        selectedScenario?.id === scenario.id ? 'border-white/[0.15]' : 'hover:border-white/[0.1]'
                      }`}
                      style={selectedScenario?.id === scenario.id ? { borderColor: `${scenario.accentColor || '#2dd4bf'}50` } : {}}
                    >
                      {selectedScenario?.id === scenario.id && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${scenario.gradient || 'from-teal-500/20 to-purple-500/20'} opacity-40`} />
                      )}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">{scenario.icon}</span>
                        </div>
                        <div className="font-medium text-xs text-text-primary leading-tight">{scenario.scenario}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-[10px] text-text-muted line-clamp-1">{scenario.identity}</div>
                        </div>
                        <div className="flex gap-0.5 mt-2">
                          {[1,2,3,4,5].map(lvl => (
                            <div key={lvl} className={`h-1 flex-1 rounded-full ${lvl <= unlocked ? 'bg-teal-400' : 'bg-white/[0.06]'}`} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Difficulty + Start */}
        <AnimatePresence>
          {selectedScenario && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-teal-400/20 text-teal-400">3</div>
                <h2 className="text-text-secondary text-sm font-medium uppercase tracking-widest">Set Difficulty</h2>
              </div>
              <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary font-medium">Difficulty Level</span>
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${DIFFICULTY_COLORS[selectedLevel]}20`, color: DIFFICULTY_COLORS[selectedLevel] }}
                  >
                    L{selectedLevel} — {DIFFICULTY_LABELS[selectedLevel]}
                  </span>
                </div>

                {/* Level selector pills */}
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => {
                    const isLocked = level > maxLevel
                    return (
                      <button
                        key={level}
                        disabled={isLocked}
                        onClick={() => setSelectedLevel(level)}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                          selectedLevel === level
                            ? 'text-white flex-[1.5]'
                            : isLocked 
                              ? 'glass opacity-50 cursor-not-allowed flex-1'
                              : 'glass text-text-muted hover:text-text-secondary flex-1'
                        }`}
                        style={selectedLevel === level ? { background: `linear-gradient(135deg, ${DIFFICULTY_COLORS[level]}80, ${DIFFICULTY_COLORS[level]}40)`, border: `1px solid ${DIFFICULTY_COLORS[level]}40` } : {}}
                      >
                        <span className="text-xs font-medium">L{level}</span>
                        {isLocked && <Lock size={10} className="mt-1 opacity-60" />}
                      </button>
                    )
                  })}
                </div>

                <input
                  type="range"
                  min={1}
                  max={maxLevel}
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: DIFFICULTY_COLORS[selectedLevel] }}
                />

                <div className="glass-teal rounded-xl p-3 text-sm text-text-secondary">
                  <span className="text-teal-400 font-medium">Character: </span>
                  {selectedScenario.name} ·{' '}
                  {selectedScenario.levels[selectedLevel - 1]?.label}
                  {user.totalSessions > 0 && (
                    <div className="text-[10px] text-teal-400/70 mt-1">
                      ✦ This character remembers your last session
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 glass rounded-xl p-3 border border-white/[0.04]">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">Role Reversal Mode</div>
                    <div className="text-[10px] text-text-muted">You play the antagonist. The AI models a healthy response.</div>
                  </div>
                  <button 
                    onClick={() => setIsReversal(!isReversal)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isReversal ? 'bg-teal-500' : 'bg-white/[0.1]'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isReversal ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                <motion.button
                  onClick={handleStartSession}
                  className="btn-primary text-base px-8 py-4 w-full justify-center"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Mic size={18} />
                  Begin Session
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedDomain && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
          >
            {[
              { icon: Brain, title: '15 Distortion Types Detected', desc: 'Multi-label RoBERTa classifier flags cognitive distortions in real time — with severity scoring 1–5.', color: '#a78bfa' },
              { icon: Mic, title: 'Character Memory', desc: 'The professor remembers you fumbled last time. That pressure is the point of the system.', color: '#2dd4bf' },
              { icon: BarChart3, title: 'Adaptive Difficulty', desc: 'Never too easy to be boring. Never too hard to be traumatizing. The system finds your edge.', color: '#fbbf24' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="glass rounded-xl p-5"
              >
                <div className="p-2 rounded-lg w-fit mb-3" style={{ backgroundColor: `${f.color}20` }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-sm text-text-primary mb-1">{f.title}</h3>
                <p className="text-text-muted text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>
    </div>
  )
}
