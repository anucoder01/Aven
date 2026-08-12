import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Lightbulb, BarChart3, FlaskConical, Eye } from 'lucide-react'
import AuroraBackground from '../components/3d/AuroraBackground'
import { ThoughtRecordTab, SocraticCoachTab, FearHierarchyTab, BehavioralExperimentTab, ImageryRescriptingTab } from '../components/therapy/TherapyTools'

const TABS = [
  { id: 'thought-records',   label: 'Thought Records',      icon: Brain,         description: 'CBT worksheet, auto-populated from sessions' },
  { id: 'socratic',          label: 'Socratic Coach',        icon: Lightbulb,     description: 'Question-guided thought examination' },
  { id: 'fear-hierarchy',    label: 'Fear Hierarchy',        icon: BarChart3,     description: '0–100 SUDS scale, systematically conquered' },
  { id: 'experiments',       label: 'Behavioral Experiments', icon: FlaskConical, description: 'Test predictions against reality' },
  { id: 'rescripting',       label: 'Imagery Rescripting',   icon: Eye,           description: 'Rewrite your worst social memory' },
]

export default function TherapyPage() {
  const [activeTab, setActiveTab] = useState('thought-records')

  return (
    <div className="min-h-screen relative" style={{ background: '#07071a' }}>
      <AuroraBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-text-primary">Therapy Tools</h1>
          <p className="text-sm text-text-muted mt-1">
            Evidence-based CBT techniques — digitized, session-aware, and always ready.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
                style={isActive ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <tab.icon size={14} className={isActive ? 'text-teal-400' : ''} />
                {tab.label}
              </motion.button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'thought-records' && <ThoughtRecordTab />}
            {activeTab === 'socratic' && <SocraticCoachTab />}
            {activeTab === 'fear-hierarchy' && <FearHierarchyTab />}
            {activeTab === 'experiments' && <BehavioralExperimentTab />}
            {activeTab === 'rescripting' && <ImageryRescriptingTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
