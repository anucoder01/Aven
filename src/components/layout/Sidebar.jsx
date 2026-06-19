import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Dumbbell, HeartPulse, BarChart3, Lightbulb, Shield, ChevronLeft, ChevronRight, Mic, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'practice',  label: 'Practice',       icon: Dumbbell,   path: '/',          description: '25 scenarios · 5 levels each' },
  { id: 'therapy',   label: 'Therapy Tools',  icon: Brain,      path: '/therapy',   description: 'CBT worksheets & exercises' },
  { id: 'body',      label: 'Body',           icon: HeartPulse, path: '/body',      description: 'Physiology & breathing' },
  { id: 'progress',  label: 'Progress',       icon: BarChart3,  path: '/dashboard', description: 'Trajectory & assessments' },
  { id: 'insights',  label: 'Insights',       icon: Lightbulb,  path: '/insights',  description: 'Personal patterns & engine' },
  { id: 'safety',    label: 'Safety',         icon: Shield,     path: '/safety',    description: 'Crisis · therapist · limits' },
]

export default function Sidebar({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isSessionActive = location.pathname.startsWith('/session')
  if (isSessionActive) return children

  const active = NAV_ITEMS.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.id || 'practice'

  const NavItem = ({ item }) => {
    const isActive = active === item.id
    return (
      <motion.button
        onClick={() => { navigate(item.path); setMobileOpen(false) }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left group relative ${
          isActive
            ? 'bg-white/[0.08] text-text-primary'
            : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
        }`}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.97 }}
      >
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
            style={{ background: 'linear-gradient(to bottom, #2dd4bf, #8b5cf6)' }}
          />
        )}
        <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
          isActive ? 'bg-teal-400/10' : 'group-hover:bg-white/[0.04]'
        }`}>
          <item.icon size={15} className={isActive ? 'text-teal-400' : ''} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className={`text-sm font-medium truncate ${isActive ? 'text-text-primary' : ''}`}>
              {item.label}
            </div>
            <div className="text-[10px] text-text-muted truncate">{item.description}</div>
          </div>
        )}
      </motion.button>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#07071a' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        <motion.aside
          animate={{ width: collapsed ? 64 : 220 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`
            flex-shrink-0 flex flex-col glass border-r border-white/[0.05] z-50
            fixed lg:relative inset-y-0 left-0
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            transition-transform lg:transition-none duration-300
          `}
          style={{ overflow: 'hidden' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2dd4bf, #8b5cf6)' }}>
                  <Brain size={14} className="text-white" />
                </div>
                <span className="font-display text-lg text-text-primary">Aven</span>
              </motion.div>
            )}
            {collapsed && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto"
                style={{ background: 'linear-gradient(135deg, #2dd4bf, #8b5cf6)' }}>
                <Brain size={14} className="text-white" />
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => <NavItem key={item.id} item={item} />)}
          </nav>

          {/* Collapse toggle */}
          <div className="p-2 border-t border-white/[0.04]">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-colors"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 glass border-b border-white/[0.04] z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-text-muted">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #8b5cf6)' }}>
              <Brain size={12} className="text-white" />
            </div>
            <span className="font-display text-base text-text-primary">Aven</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
