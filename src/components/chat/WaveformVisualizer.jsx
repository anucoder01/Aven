import { useEffect, useRef } from 'react'
import { useVoiceBiomarkers } from '../../hooks/useVoiceBiomarkers'

export default function WaveformVisualizer({ active = false }) {
  useVoiceBiomarkers(active, 'demo-session')
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)

  function drawFlat() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.2)'
    ctx.stroke()
  }

  function drawIdle() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let phase = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
      for (let i = 0; i < canvas.width; i++) {
        const y = Math.sin((i / 30) + phase) * 4 + (canvas.height / 2)
        if (i === 0) ctx.moveTo(i, y)
        else ctx.lineTo(i, y)
      }
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)'
      ctx.stroke()
      phase += 0.05
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
  }

  function drawWaveform() {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current) return
    const ctx = canvas.getContext('2d')

    const animate = () => {
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
      
      const sliceWidth = canvas.width * 1.0 / analyserRef.current.frequencyBinCount
      let x = 0

      for (let i = 0; i < analyserRef.current.frequencyBinCount; i++) {
        const v = dataArrayRef.current[i] / 128.0
        const y = v * (canvas.height / 2)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#2dd4bf'
      ctx.stroke()
      
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
  }

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current)
      drawFlat()
      return
    }

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        streamRef.current = stream
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        audioCtxRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)
        
        analyserRef.current = analyser
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
        drawWaveform()
      })
      .catch(() => {
        drawIdle()
      })

    return () => {
      cancelAnimationFrame(animRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      id="waveform-canvas"
      width={400}
      height={48}
      className="w-full h-12 rounded-lg"
    />
  )
}
