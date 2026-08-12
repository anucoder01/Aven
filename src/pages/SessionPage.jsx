import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Send, ChevronLeft, AlertTriangle, Brain, Eye, Volume2, VolumeX, StopCircle } from 'lucide-react'
import AvenOrb from '../components/3d/AvenOrb'
import AuroraBackground from '../components/3d/AuroraBackground'
import WaveformVisualizer from '../components/chat/WaveformVisualizer'
import DistortionBadge from '../components/chat/DistortionBadge'
import { useSessionStore } from '../store/sessionStore'
import { useCharacterMemoryStore } from '../store/characterMemoryStore'
import { useUserStore } from '../store/userStore'
import { useBodyStore } from '../store/bodyStore'
import { DISTORTION_LABELS } from '../data/scenarios'
import { characters } from '../data/characterLibrary'
import { classifyMessage, detectAvoidance } from '../data/mockData'
import { sessionEngine } from '../services/sessionEngine'
import { soundscapeEngine } from '../services/soundscapeEngine'
import { BiomarkerConsentModal } from '../components/therapy/BiomarkerConsentModal'
import { faceTensionEngine } from '../services/faceTensionEngine'
import { speak, stopSpeaking } from '../services/ttsEngine'

// DISTORTION_COLORS removed

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
        {!isUser && (
          <span className="text-[10px] text-text-muted ml-1 uppercase tracking-wide">{message.characterName}</span>
        )}
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
          <p className="text-sm leading-relaxed text-text-primary">{message.text}</p>
        </div>
        {isUser && message.timestamp && (
          <span className="text-[10px] text-text-muted mr-1">{message.timestamp}</span>
        )}
        {/* Distortion badges */}
        {isUser && message.distortions && message.distortions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-1 justify-end"
          >
            {message.distortions.map((d, i) => (
              <DistortionBadge key={i} distortionKey={d.key} severity={d.severity} compact />
            ))}
          </motion.div>
        )}
        {/* Avoidance flag */}
        {isUser && message.avoidance && message.avoidance.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-[10px] text-amber-400 mr-1"
          >
            <AlertTriangle size={9} />
            <span>Avoidance detected</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function LiveStatsPanel({ stats }) {
  const { spikeEvents, getLatestCheckIn } = useBodyStore()
  const preSession = getLatestCheckIn('pre')
  const suds = preSession ? preSession.suds : 5
  const hasSpikes = spikeEvents && spikeEvents.length > 0
  const top = DISTORTION_LABELS.filter(d => (stats[d.key] || 0) > 0).sort((a, b) => (stats[b.key] || 0) - (stats[a.key] || 0))

  return (
    <div className="glass rounded-2xl p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <Brain size={11} /> Live Signals
      </h3>

      {top.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-xs text-center">No distortions detected yet.<br />Keep the conversation going.</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {top.map(label => (
            <div key={label.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-text-secondary flex items-center gap-1">
                  {label.emoji} {label.label}
                </span>
                <span className="text-[11px] font-bold" style={{ color: label.color }}>
                  ×{stats[label.key] || 0}
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: label.color }}
                  animate={{ width: `${Math.min((stats[label.key] || 0) * 20, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span className="flex items-center gap-1"><Eye size={10} /> Avoidances</span>
          <span className="text-amber-400 font-semibold">{stats.avoidance_count}</span>
        </div>
        
        {/* Combined Distress View */}
        <div className="space-y-2 mt-4">
          <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Combined Distress</h4>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Self-Report (SUDS)</span>
            <span className="text-text-primary font-bold">{suds}/10</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Physiological (Tremors)</span>
            <span className={hasSpikes ? "text-amber-400 font-bold" : "text-teal-400 font-bold"}>
              {hasSpikes ? "Elevated" : "Calm"}
            </span>
          </div>
          {hasSpikes && suds < 4 && (
            <div className="text-[10px] text-amber-400/80 bg-amber-400/10 p-2 rounded-lg mt-2">
              <AlertTriangle size={10} className="inline mr-1" />
              Mismatch: You reported low distress, but your body shows tension.
            </div>
          )}
        </div>
        <p className="text-[9px] text-text-muted mt-3 opacity-60">
          *Biomarkers are physiological proxies, not clinical diagnoses.
        </p>
      </div>
    </div>
  )
}

export default function SessionPage() {
  const { scenarioId, levelNum } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const isReversal = queryParams.get('mode') === 'reversal'
  const { customScenarios } = useUserStore()
  
  const scenario = characters.find(s => s.id === scenarioId) || customScenarios?.find(s => s.id === scenarioId) || characters[0]
  const level = scenario.levels.find(l => l.level === parseInt(levelNum)) || scenario.levels[0]

  const { messages, liveStats, isCharacterTyping, isRecording,
    startSession, addMessage, addDistortions, addAvoidance,
    setCharacterTyping, setRecording } = useSessionStore()

  const [inputText, setInputText] = useState('')
  const [orbState, setOrbState] = useState('idle')
  const [sessionEnded, setSessionEnded] = useState(false)
  const [isSoundscapeActive, setIsSoundscapeActive] = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(true)
  const chatBottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const videoRef = useRef(null)
  const animRef = useRef(null)

  const [consentState, setConsentState] = useState(null)
  const [facialTension, setFacialTension] = useState(null)

  const { buildMemoryContext } = useCharacterMemoryStore()
  const memoryContextRef = useRef('')

  useEffect(() => {
    return () => {
      soundscapeEngine.cleanup()
      stopSpeaking()
    }
  }, [])

  // Init session — use ref guard to prevent StrictMode double-fire
  const greetingSent = useRef(false)
  useEffect(() => {
    if (greetingSent.current) return
    greetingSent.current = true
    
    // Inject memory
    const memoryContext = buildMemoryContext(scenarioId)
    if (memoryContext) {
      console.log('Injecting Character Memory:', memoryContext)
      memoryContextRef.current = memoryContext
    }

    startSession(scenario, level)
    
    const fetchGreeting = async () => {
      setCharacterTyping(true)
      setOrbState('speaking')
      try {
        const sysPrompt = sessionEngine.buildSystemPrompt(
          scenario.id, 
          level.level, 
          [], 
          "The user just walked up to you. Start the conversation in character.",
          isReversal
        )
        const aiRes = await fetch('http://localhost:8000/llm/character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_prompt: sysPrompt,
            messages: [],
            stream: false,
            difficulty_level: level.level
          })
        })
        
        let aiResponse = ""
        if (aiRes.ok) {
          const reader = aiRes.body.getReader()
          const decoder = new TextDecoder()
          let done = false
          while (!done) {
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            if (value) {
              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  const data = JSON.parse(line.replace('data: ', ''))
                  aiResponse += data.delta
                }
              }
            }
          }
        }
        if (!aiResponse) aiResponse = "Hello."
        
        setCharacterTyping(false)

        let finalName = scenario.name
        let finalText = aiResponse
        const match = aiResponse.match(/^([A-Za-z0-9\s]+):\s*(.*)/is)
        if (match && scenario.isGroup) {
          finalName = match[1].trim()
          finalText = match[2].trim()
        }

        addMessage({ role: 'ai', text: finalText, characterName: finalName })
        if (isVoiceMode) {
          await speak(finalText, { rate: 1.0 })
        }
        setTimeout(() => setOrbState('idle'), 1500)
      } catch (e) {
        console.warn("LLM greeting failed", e)
        setCharacterTyping(false)
        addMessage({ role: 'ai', text: "Hello.", characterName: scenario.name })
        if (isVoiceMode) {
          await speak("Hello.", { rate: 1.0 })
        }
        setTimeout(() => setOrbState('idle'), 1500)
      }
    }
    setTimeout(fetchGreeting, 800)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isCharacterTyping])

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || sessionEnded) return
    const userText = text.trim()
    setInputText('')

    // Add user message
    const msgId = Date.now()
    addMessage({ id: msgId, role: 'user', text: userText })

    // Run distortion classifier via backend (fire-and-forget, non-blocking)
    fetch('http://localhost:8000/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userText, session_id: String(scenarioId) })
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error("Classifier API failed");
    })
    .then(data => {
      if (data.distortions && data.distortions.length > 0) {
        setTimeout(() => {
          addDistortions(msgId, data.distortions)
          setOrbState('distortion')
          setTimeout(() => setOrbState('idle'), 2500)
        }, 400)
      }
      if (data.avoidance_signals) {
        data.avoidance_signals.forEach(a => addAvoidance(a))
      }
    })
    .catch(() => {
      console.warn("Classifier API failed, falling back to mock")
      const fallbackDistortions = classifyMessage(userText)
      const fallbackAvoidance = detectAvoidance(userText)
      if (fallbackDistortions.length > 0) {
        addDistortions(msgId, fallbackDistortions)
        setOrbState('distortion')
        setTimeout(() => setOrbState('idle'), 2500)
      }
      fallbackAvoidance.forEach(a => addAvoidance(a))
    })

    // LLM Character Response via backend
    setCharacterTyping(true)
    setOrbState('speaking')
    
    try {
      // Get the last N messages to send as context
      const recentMessages = useSessionStore.getState().messages.slice(-5).map(m => ({
        role: m.role,
        content: m.text
      }))

      const sysPrompt = sessionEngine.buildSystemPrompt(
        scenario.id, 
        level.level, 
        useSessionStore.getState().messages, 
        userText
      )

      // The LLM returns a streaming response. We could stream it into the UI,
      // but for simplicity, we'll fetch the whole response or mock it if the server isn't running.
      const aiRes = await fetch('http://localhost:8000/llm/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: sysPrompt,
          messages: recentMessages,
          stream: false,
          difficulty_level: level.level
        })
      })
      
      let aiResponse = ""
      if (aiRes.ok) {
        // Handle SSE stream briefly
        const reader = aiRes.body.getReader()
        const decoder = new TextDecoder()
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                const data = JSON.parse(line.replace('data: ', ''))
                aiResponse += data.delta
              }
            }
          }
        }
      } else {
        throw new Error("API failed")
      }

      if (!aiResponse) aiResponse = "I'm not sure what to say to that."

      setCharacterTyping(false)
      
      let finalName = scenario.name
      let finalText = aiResponse
      const match = aiResponse.match(/^([A-Za-z0-9\s]+):\s*(.*)/is)
      if (match && scenario.isGroup) {
        finalName = match[1].trim()
        finalText = match[2].trim()
      }

      addMessage({ role: 'ai', text: finalText, characterName: finalName })
      if (isVoiceMode) {
        await speak(finalText, { rate: 1.0 })
      }
      setTimeout(() => setOrbState('idle'), 1500)

    } catch (e) {
      console.warn("LLM API failed, falling back to mock", e)
      setCharacterTyping(false)
      const aiResponse = "I'm not sure what to say to that."
      addMessage({ role: 'ai', text: aiResponse, characterName: scenario.name })
      if (isVoiceMode) {
        await speak(aiResponse, { rate: 1.0 })
      }
      setTimeout(() => setOrbState('idle'), 1500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEnded])

  // Voice recognition
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser. Try Chrome.')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setRecording(false)
      setOrbState('idle')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => { setRecording(true); setOrbState('listening') }
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      handleSend(transcript)
    }
    recognition.onend = () => { setRecording(false); setOrbState('idle') }
    recognition.onerror = () => { setRecording(false); setOrbState('idle') }

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleEndSession = () => {
    setSessionEnded(true)
    navigate('/report')
  }

  const toggleSoundscape = () => {
    if (isSoundscapeActive) {
      soundscapeEngine.stop()
      setIsSoundscapeActive(false)
    } else {
      soundscapeEngine.start()
      setIsSoundscapeActive(true)
    }
  }

  const difficultyColor = ['', '#2dd4bf', '#a78bfa', '#fbbf24', '#fb923c', '#fb7185'][level.level] || '#2dd4bf'

  useEffect(() => {
    if (consentState === 'accepted') {
      let isRunning = true
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        videoRef.current.play()

        let lastProcessTime = 0
        const loop = async (now) => {
          if (!isRunning) return
          if (videoRef.current && videoRef.current.readyState >= 2) {
            // Limit to ~5 FPS (every 200ms)
            if (now - lastProcessTime > 200) {
              lastProcessTime = now
              const result = await faceTensionEngine.predictVideo(videoRef.current, performance.now())
              if (result) {
                setFacialTension(result.tensionIndex)
                fetch('http://localhost:8000/biomarker/facial', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    session_id: String(scenarioId),
                    user_id: 'test_user',
                    tension_index: result.tensionIndex,
                    blink_rate: result.blinkRate
                  })
                }).catch(e => console.warn("Facial tracking post failed", e))
              }
            }
          }
          animRef.current = requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
      }).catch(e => {
        console.warn("Camera access denied", e)
      })

      return () => {
        isRunning = false
        cancelAnimationFrame(animRef.current)
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop())
        }
      }
    }
  }, [consentState])

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: '#07071a' }}>
      {consentState === null && (
        <BiomarkerConsentModal
          onAccept={() => setConsentState('accepted')}
          onDecline={() => setConsentState('declined')}
        />
      )}
      
      {/* Hidden video for mediapipe */}
      <video ref={videoRef} className="hidden" playsInline muted />
      
      <AuroraBackground />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 glass border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost text-xs py-1.5 px-3">
            <ChevronLeft size={13} /> Back
          </button>
          <div className="h-4 w-px bg-white/[0.06]" />
          <span className="text-text-secondary text-sm">
            {scenario.icon} {scenario.scenario}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
          >
            L{level.level} — {level.label}
          </span>
          <button
            onClick={toggleSoundscape}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              isSoundscapeActive 
                ? 'text-teal-400 border-teal-400/20 bg-teal-400/10' 
                : 'text-text-muted border-white/[0.04] hover:bg-white/[0.02]'
            }`}
          >
            {isSoundscapeActive ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {isSoundscapeActive ? 'Soundscape On' : 'Soundscape Off'}
          </button>
          <button
            onClick={() => {
              if (isVoiceMode) stopSpeaking()
              setIsVoiceMode(!isVoiceMode)
            }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              isVoiceMode 
                ? 'text-teal-400 border-teal-400/20 bg-teal-400/10' 
                : 'text-text-muted border-white/[0.04] hover:bg-white/[0.02]'
            }`}
          >
            {isVoiceMode ? 'TTS On' : 'TTS Off'}
          </button>
          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-rose-400 border border-rose-400/20 hover:bg-rose-400/10 transition-all"
          >
            <StopCircle size={12} /> End Session
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex gap-4 px-4 py-4 min-h-0">
        {/* Left: Orb + character */}
        <div className="hidden lg:flex flex-col items-center gap-3 w-48 flex-shrink-0">
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-2 w-full">
            <AvenOrb state={orbState} amplitude={isRecording ? 0.6 : 0} size={120} />
            <div className="text-center">
              <div className="text-sm font-medium text-text-primary">{scenario.name}</div>
              <div className="text-xs text-text-muted mt-0.5">{level.label}</div>
            </div>
            <div
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
              style={{ backgroundColor: `${difficultyColor}15`, color: difficultyColor }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: difficultyColor }} />
              {orbState === 'listening' ? 'Listening...' : orbState === 'speaking' ? 'Speaking...' : orbState === 'distortion' ? 'Distortion!' : 'In character'}
            </div>
          </div>
        </div>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="glass rounded-2xl flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {isCharacterTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-3">
                  <div className="chat-bubble-ai flex items-center gap-1.5">
                    {[0, 0.15, 0.3].map(delay => (
                      <motion.div
                        key={delay}
                        className="w-1.5 h-1.5 bg-text-muted rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Voice waveform */}
            <AnimatePresence>
              {(isRecording) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 64, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 border-t border-white/[0.04] overflow-hidden"
                >
                  <div className="py-2">
                    <WaveformVisualizer active={isRecording} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input bar */}
            <div className="p-3 border-t border-white/[0.04] flex items-end gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(inputText)}
                placeholder={isRecording ? 'Listening...' : 'Type your response...'}
                disabled={isRecording || sessionEnded}
                className="aven-input flex-1 text-sm py-2.5"
              />
              <button
                onClick={toggleVoice}
                className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
                  isRecording
                    ? 'bg-rose-500/20 border border-rose-400/30 text-rose-400 animate-pulse'
                    : 'glass hover:border-teal-400/30 text-text-secondary hover:text-teal-400'
                }`}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim() || isRecording || sessionEnded}
                className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #2dd4bf, #8b5cf6)' }}
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live stats */}
        <div className="hidden xl:flex flex-col w-52 flex-shrink-0">
          <LiveStatsPanel stats={liveStats} />
        </div>
      </div>
    </div>
  )
}
