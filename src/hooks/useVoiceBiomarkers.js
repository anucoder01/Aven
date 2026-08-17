import { useEffect, useRef } from 'react';
import { useBodyStore } from '../store/bodyStore';
import { API_BASE_URL } from '../config';

export function useVoiceBiomarkers({ isVoiceMode, isRecording, sessionId, userId = 'test_user' }) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const { addSpike } = useBodyStore();

  useEffect(() => {
    let active = true;

    // Only run biomarker extraction when voice mode is enabled and user is NOT actively using SpeechRecognition
    if (isVoiceMode && !isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          streamRef.current = stream;
          
          let mimeType = 'audio/webm';
          if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/mp4';
          }

          try {
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = async (e) => {
              if (e.data && e.data.size > 0 && active) {
                const formData = new FormData();
                formData.append('audio', e.data, 'chunk.webm');
                formData.append('session_id', String(sessionId));
                formData.append('user_id', String(userId));

                try {
                  const response = await fetch(`${API_BASE_URL}/biomarker/voice`, {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.is_spike) {
                      addSpike({
                        type: 'voice',
                        reason: result.spike_reason,
                        jitter: result.jitter_pct,
                        timestamp: new Date().toISOString()
                      });
                    }
                  }
                } catch {
                  // Silently handle non-critical biomarker upload hiccups
                }
              }
            };

            // Use continuous timeslice (6000ms) without creating new recorder instances
            recorder.start(6000);
          } catch (recErr) {
            console.warn('MediaRecorder failed to initialize:', recErr);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission denied or unavailable for voice biomarkers:', err);
        });
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isVoiceMode, isRecording, sessionId, userId, addSpike]);
}
