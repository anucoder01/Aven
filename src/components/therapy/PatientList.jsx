import { useState, useEffect } from 'react'
import { Users, User, Clock, Activity, Target } from 'lucide-react'

export function PatientList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('http://localhost:8000/therapist/patients')
        const data = await res.json()
        if (data.status === 'success') {
          setPatients(data.patients)
        }
      } catch (err) {
        console.error('Failed to fetch patients:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  if (loading) {
    return <div className="text-text-muted text-sm">Loading patients...</div>
  }

  return (
    <div className="space-y-4">
      {patients.map(patient => (
        <div key={patient.id} className="glass border border-white/[0.04] p-5 rounded-2xl flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
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
  )
}
