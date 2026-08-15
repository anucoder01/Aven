import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Target, Activity, FileText } from 'lucide-react'

export function PatientDetailModal({ isOpen, onClose, patient, reports }) {
  if (!isOpen || !patient) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass border border-white/[0.08] w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/[0.04] flex items-center justify-between sticky top-0 bg-[#07071a]/95 backdrop-blur z-10">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{patient.name}'s Sessions</h2>
              <div className="text-xs text-text-muted mt-1 flex gap-4">
                <span className="flex items-center gap-1"><Target size={12}/> {reports.length} Total Sessions</span>
                <span className="flex items-center gap-1"><Activity size={12}/> Avg SUDS: {patient.averageSuds}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 glass rounded-xl hover:bg-white/[0.05] text-text-muted">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-sm">
                No sessions completed yet.
              </div>
            ) : (
              [...reports].reverse().map((report, i) => (
                <div key={i} className="glass border border-white/[0.04] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <FileText size={14} className="text-teal-400" />
                      {report.scenario_id || "Scenario"} — Level {report.difficulty || 1}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(report.id).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="glass bg-white/[0.02] p-3 rounded-lg text-center">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">SUDS</div>
                      <div className="text-sm font-bold text-amber-400">{report.suds || report.suds_score || 0}/10</div>
                    </div>
                    <div className="glass bg-white/[0.02] p-3 rounded-lg text-center">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Assertiveness</div>
                      <div className="text-sm font-bold text-teal-400">{report.assertiveness_score || 0}/10</div>
                    </div>
                    <div className="glass bg-white/[0.02] p-3 rounded-lg text-center">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Distortions</div>
                      <div className="text-sm font-bold text-purple-400">{report.total_distortions || 0}</div>
                    </div>
                  </div>

                  <div className="text-xs text-text-secondary leading-relaxed">
                    <span className="font-semibold text-text-primary">Summary:</span> {report.overall_summary || "No summary available."}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
