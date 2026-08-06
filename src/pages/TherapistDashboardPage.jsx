import { Users } from 'lucide-react'
import AuroraBackground from '../components/3d/AuroraBackground'
import { PatientList } from '../components/therapy/PatientList'

export default function TherapistDashboardPage() {
  return (
    <div className="min-h-screen relative" style={{ background: '#07071a' }}>
      <AuroraBackground />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
              <Users className="text-teal-400" />
              Clinician Portal
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Monitor patient progress, review CBT session transcripts, and assign scenarios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <section>
            <h2 className="text-lg font-medium text-text-primary mb-4">Your Patients</h2>
            <PatientList />
          </section>
        </div>
      </div>
    </div>
  )
}
