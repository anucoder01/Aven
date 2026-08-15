import { useState } from 'react'
import { User, Clock, Activity, Target } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { PatientDetailModal } from './PatientDetailModal'

export function PatientList() {
  const { user, completedReports } = useUserStore()
  const [selectedPatient, setSelectedPatient] = useState(null)
  
  // Calculate stats for the local user based on real reports
  const totalScenarios = completedReports.length
  
  let averageSuds = 0
  if (totalScenarios > 0) {
    const total = completedReports.reduce((sum, report) => sum + (report.suds || report.suds_score || 0), 0)
    averageSuds = Math.round((total / totalScenarios) * 10) / 10
  }

  // Calculate trend
  let progress = "neutral"
  if (totalScenarios >= 2) {
    const recent = completedReports.slice(-2)
    const recentSuds = recent[1].suds || recent[1].suds_score || 0
    const olderSuds = recent[0].suds || recent[0].suds_score || 0
    if (recentSuds < olderSuds) progress = "improving"
    else if (recentSuds > olderSuds) progress = "declining"
    else progress = "stagnant"
  } else if (totalScenarios === 1) {
    progress = "started"
  } else {
    progress = "none"
  }

  let lastSessionDate = "Never"
  if (totalScenarios > 0) {
    lastSessionDate = new Date(completedReports[completedReports.length - 1].id).toLocaleDateString()
  }

  const localPatient = {
    id: user.id,
    name: user.name === 'You' ? 'Local User (Demo)' : user.name,
    lastSession: lastSessionDate,
    averageSuds,
    completedScenarios: totalScenarios,
    progress
  }

  // We can just show one patient (the local user)
  const patients = [localPatient]

  return (
    <>
      <div className="space-y-4">
        {patients.map(patient => (
          <div 
            key={patient.id} 
            onClick={() => setSelectedPatient(patient)}
            className="glass border border-white/[0.04] p-5 rounded-2xl flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-400/10 flex items-center justify-center">
                <User className="text-teal-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-primary">{patient.name}</h3>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={12}/> Last Session: {patient.lastSession}</span>
                  <span className="text-xs text-text-muted flex items-center gap-1"><Target size={12}/> {patient.completedScenarios} Scenarios</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-secondary flex items-center justify-end gap-2">
                <Activity size={14} className={patient.averageSuds > 70 ? 'text-red-400' : 'text-teal-400'}/>
                Avg SUDS: {patient.averageSuds}
              </div>
              <div className="text-xs text-text-muted mt-1 capitalize">Trend: {patient.progress}</div>
            </div>
          </div>
        ))}
      </div>

      <PatientDetailModal 
        isOpen={!!selectedPatient} 
        onClose={() => setSelectedPatient(null)} 
        patient={selectedPatient}
        reports={completedReports}
      />
    </>
  )
}
