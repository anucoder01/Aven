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

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          // Post chunk to backend
          const blob = new Blob([e.data], { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', blob)
          formData.append('session_id', sessionId || 'test-session')
          formData.append('user_id', 'test_user')

          try {
            const res = await fetch('http://localhost:8000/biomarker/voice', {
              method: 'POST',
              body: formData,
            })
            
            if (res.ok) {
              const result = await res.json()
              const data = result // Depending on backend response structure, it might be the top-level JSON
              
              // Check for spikes
              if (biomarkerBaseline) {
                const pitchDev = (data.pitch_hz - biomarkerBaseline.avg_pitch) / biomarkerBaseline.avg_pitch
                const jitterDev = data.jitter_pct - biomarkerBaseline.avg_jitter

                if (pitchDev > 0.15 || jitterDev > 1.5) { // Arbitrary spike thresholds
                  addSpike({
                    type: 'vocal',
                    pitchDelta: pitchDev * 100,
                    jitterDelta: jitterDev,
                    rawPitch: data.pitch_hz,
                  })
                }
              } else {
                // Not established yet, do nothing.
              }
            }
          } catch (err) {
            console.warn("Voice biomarker analysis failed", err)
          }
        }
      }

      mediaRecorder.onstop = () => {
        // Nothing special on stop, chunks were handled in ondataavailable
      }

      // Record in 5-second chunks
      mediaRecorder.start(5000)

      return () => {
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
    const fetchBaseline = async () => {
      try {
        const res = await fetch(`http://localhost:8000/biomarker/voice/baseline/test_user`);
        if (res.ok) {
          const data = await res.json();
          if (data.established) {
            updateBaseline({
              avg_pitch: data.avg_pitch,
              avg_jitter: data.avg_jitter,
              avg_shimmer: data.avg_shimmer,
              sampleCount: data.sample_count
            });
          }
        }
      } catch (err) {
        console.warn("Could not fetch baseline", err);
      }
    };
    fetchBaseline();
  }, [updateBaseline]);

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
