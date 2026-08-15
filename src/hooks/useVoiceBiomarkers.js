import { useEffect, useRef } from 'react';
import { useBodyStore } from '../store/bodyStore';

export function useVoiceBiomarkers({ isVoiceMode, sessionId, userId = 'test_user' }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const { addSpikeEvent } = useBodyStore();

  useEffect(() => {
    let active = true;

    if (isVoiceMode) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          streamRef.current = stream;
          // Use webm as it is the standard for MediaRecorder in most browsers
          const options = { mimeType: 'audio/webm' };
          const startChunking = () => {
            if (!active) return;
            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = async (e) => {
              if (e.data && e.data.size > 0) {
                // Send the chunk to the backend
                const formData = new FormData();
                formData.append('audio', e.data, 'chunk.webm');
                formData.append('session_id', String(sessionId));
                formData.append('user_id', String(userId));

                try {
                  const response = await fetch('http://localhost:8000/biomarker/voice', {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    console.log('Voice biomarker extracted:', result);
                    if (result.is_spike) {
                      addSpikeEvent({
                        type: 'voice',
                        reason: result.spike_reason,
                        jitter: result.jitter_pct,
                        timestamp: new Date().toISOString()
                      });
                    }
                  } else {
                    console.warn('Voice biomarker analysis failed:', response.status);
                  }
                } catch (err) {
                  console.error("Failed to upload voice chunk for biomarker analysis:", err);
                }
              }
            };

            recorder.start();
            setTimeout(() => {
              if (active && recorder.state === 'recording') {
                recorder.stop();
                startChunking();
              }
            }, 6000);
          };

          startChunking();
        })
        .catch((err) => {
          console.warn('Microphone permission denied or unavailable for voice biomarkers:', err);
          // Graceful degradation: do not crash the session
        });
    } else {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isVoiceMode, sessionId, userId, addSpikeEvent]);

}
