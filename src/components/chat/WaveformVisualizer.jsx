import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '../../store/sessionStore'

export default function WaveformVisualizer({ active = false }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current)
      drawFlat()
      return
    }

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
        drawWaveform()
      } catch (e) {
        drawIdle()
      }
    }

    init()
    return () => cancelAnimationFrame(animRef.current)
  }, [active])

  const drawFlat = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(45,212,191,0.25)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
  }

  const drawIdle = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    let t = 0

    const animate = () => {
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(45,212,191,0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let x = 0; x < W; x++) {
        const y = H / 2 + Math.sin((x / W) * Math.PI * 4 + t) * 4
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      t += 0.03
      animRef.current = requestAnimationFrame(animate)
    }
    animate()
  }

  const drawWaveform = () => {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    const animate = () => {
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current)
      ctx.clearRect(0, 0, W, H)

      // Gradient stroke
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, 'rgba(45,212,191,0.8)')
      grad.addColorStop(0.5, 'rgba(167,139,250,0.9)')
      grad.addColorStop(1, 'rgba(45,212,191,0.8)')

      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.beginPath()

      const sliceWidth = W / dataArrayRef.current.length
      let x = 0

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = dataArrayRef.current[i] / 128.0
        const y = (v * H) / 2
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.lineTo(W, H / 2)
      ctx.stroke()

      animRef.current = requestAnimationFrame(animate)
    }
    animate()
  }

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
