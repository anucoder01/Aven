import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusCircle, User, Settings, Flag, BrainCircuit } from 'lucide-react'
import AuroraBackground from '../components/3d/AuroraBackground'

export default function CustomScenarioBuilder() {
  const [formData, setFormData] = useState({
    characterName: '',
    relationship: '',
    setting: '',
    goal: '',
    difficulty: 1,
  })

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const res = await fetch('http://localhost:8000/scenario/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        setFormData({ characterName: '', relationship: '', setting: '', goal: '', difficulty: 1 })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#07071a' }}>
      <AuroraBackground />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-text-primary">Custom Scenario Builder</h1>
          <p className="text-sm text-text-muted mt-1">
            Design a hyper-personalized exposure therapy scenario tailored to your specific real-world challenges.
          </p>
        </div>

        <motion.div 
          className="glass border border-white/[0.04] p-6 rounded-2xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <User size={16} className="text-teal-400" />
                Character Name & Persona
              </label>
              <input 
                required
                type="text" 
                name="characterName"
                value={formData.characterName}
                onChange={handleChange}
                placeholder="e.g. John, my critical boss"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-teal-400/50 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <BrainCircuit size={16} className="text-purple-400" />
                Relationship Dynamics
              </label>
              <input 
                required
                type="text" 
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                placeholder="e.g. He often talks over me and dismisses my ideas."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-purple-400/50 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Settings size={16} className="text-blue-400" />
                Setting & Context
              </label>
              <textarea 
                required
                name="setting"
                value={formData.setting}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. The weekly marketing sync meeting on Zoom. I have to present."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-blue-400/50 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Flag size={16} className="text-red-400" />
                Your Goal
              </label>
              <input 
                required
                type="text" 
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                placeholder="e.g. Ask for a deadline extension without apologizing."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-red-400/50 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                Difficulty Level (1-5)
              </label>
              <input 
                type="range" 
                name="difficulty"
                min="1" max="5" 
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full accent-teal-400"
              />
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>1 - Cooperative</span>
                <span>3 - Neutral/Dismissive</span>
                <span>5 - Hostile/Interrupting</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all text-black hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #8b5cf6)' }}
            >
              {saving ? 'Generating...' : (success ? 'Scenario Created!' : 'Create Custom Scenario')}
              {!saving && !success && <PlusCircle size={16} />}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
