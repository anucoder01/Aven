import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wind, HeartPulse, Mic } from 'lucide-react'
import AuroraBackground from '../components/3d/AuroraBackground'
import { BreathingHub, BodyCheckIn, VocalBiomarkerPanel } from '../components/body/BodyComponents'

const TABS = [
  { id: 'checkin',    label: 'Body Check-in',  icon: HeartPulse, description: '7-point physiological scan' },
  { id: 'breathing',  label: 'Breathing Hub',  icon: Wind,       description: '4 clinically-grounded techniques' },
  { id: 'biomarkers', label: 'Vocal Biomarkers', icon: Mic,      description: 'Pitch, pace & tremor tracking' },
]

export default function BodyPage() {
  const [activeTab, setActiveTab] = useState('checkin')

  return (
    <div className="min-h-screen relative" style={{ background: '#07071a' }}>
      <AuroraBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-text-primary">Body & Physiology</h1>
          <p className="text-sm text-text-muted mt-1">Anxiety isn't just in your head. Track and regulate your physiological state.</p>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
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

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'checkin' && <BodyCheckIn />}
            {activeTab === 'breathing' && <BreathingHub />}
            {activeTab === 'biomarkers' && <VocalBiomarkerPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
