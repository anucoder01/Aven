import { useEffect, useRef, useCallback } from 'react'
import { useBodyStore } from '../store/bodyStore'

export function useVoiceBiomarkers(active, sessionId) {
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const { biomarkerBaseline, addSpike, updateBaseline } = useBodyStore()

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []

        // Post to backend
        const formData = new FormData()
        formData.append('audio', blob)
        formData.append('session_id', sessionId || 'test-session')

        try {
          const res = await fetch('http://localhost:8000/biomarker/voice', {
            method: 'POST',
            body: formData,
          })
          
          if (res.ok) {
            const result = await res.json()
            const data = result.data
            
            // Check for spikes
            if (biomarkerBaseline) {
              const pitchDev = (data.pitch_hz - biomarkerBaseline.avgPitch) / biomarkerBaseline.avgPitch
              const jitterDev = data.jitter_pct - biomarkerBaseline.avgJitter

              if (pitchDev > 0.15 || jitterDev > 1.5) { // Arbitrary spike thresholds
                addSpike({
                  type: 'vocal',
                  pitchDelta: pitchDev * 100,
                  jitterDelta: jitterDev,
                  rawPitch: data.pitch_hz,
                })
              }
            } else {
              // Mock establishing baseline for testing without DB persistence of past sessions
              // Normally, we fetch GET /biomarker/voice/baseline/USER_ID
            }
          }
        } catch (e) {
          console.warn("Voice biomarker analysis failed", e)
        }
      }

      // Record in 5-second chunks
      mediaRecorder.start(5000)

      // Stop and restart every 5 seconds to get chunks
      const interval = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          mediaRecorder.start(5000)
        }
      }, 5000)

      return () => {
        clearInterval(interval)
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
        stream.getTracks().forEach(track => track.stop())
      }
    } catch (e) {
      console.warn("Mic access denied for biomarkers", e)
      return () => {}
    }
  }, [sessionId, biomarkerBaseline, addSpike])

  useEffect(() => {
    let cleanup = () => {}
    if (active) {
      startRecording().then(c => cleanup = c)
    }
    return () => {
      cleanup()
    }
  }, [active, startRecording])
}
