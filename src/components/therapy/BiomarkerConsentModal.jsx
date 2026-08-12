import React from 'react'

export function BiomarkerConsentModal({ onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden border border-white/10">
        <div className="w-12 h-12 rounded-full bg-teal-400/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-text-primary mb-2">Enable Biomarker Tracking?</h2>
        
        <p className="text-sm text-text-secondary mb-4 text-left">
          Aven can analyze your vocal tremors and facial tension to provide physiological insights into your anxiety levels during sessions.
        </p>

        <div className="bg-white/5 rounded-xl p-4 text-left mb-6 text-xs text-text-muted space-y-2">
          <p><strong>🔒 Privacy First:</strong> Your camera feed is processed entirely on your device. Video frames are <em>never</em> recorded, uploaded, or stored.</p>
          <p><strong>📊 What we save:</strong> Only numerical scores (e.g. "Tension Index: 45") are sent to your secure profile to track progress over time.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-2.5 rounded-xl glass text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
          >
            Not right now
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white transition-colors text-sm font-bold shadow-lg shadow-teal-500/25"
          >
            Enable tracking
          </button>
        </div>
      </div>
    </div>
  )
}
