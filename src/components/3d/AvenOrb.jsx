import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Environment, Float, Sphere } from '@react-three/drei'
import * as THREE from 'three'

// Inner glowing orb
function OrbCore({ state = 'idle', amplitude = 0 }) {
  const meshRef = useRef()
  const innerRef = useRef()

  const stateColors = {
    idle: { primary: '#2dd4bf', secondary: '#8b5cf6', emissive: '#0d9488' },
    listening: { primary: '#a78bfa', secondary: '#2dd4bf', emissive: '#7c3aed' },
    speaking: { primary: '#818cf8', secondary: '#c084fc', emissive: '#6366f1' },
    distortion: { primary: '#fb7185', secondary: '#f43f5e', emissive: '#be123c' },
    success: { primary: '#34d399', secondary: '#2dd4bf', emissive: '#059669' },
  }

  const colors = stateColors[state] || stateColors.idle

  useFrame((ctx, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta * 0.08
    meshRef.current.rotation.y += delta * 0.12

    // Pulse with amplitude
    const scale = 1 + amplitude * 0.3
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1))

    if (innerRef.current) {
      innerRef.current.rotation.x -= delta * 0.15
      innerRef.current.rotation.y -= delta * 0.1
    }
  })

  return (
    <group>
      {/* Outer distort shell */}
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
        <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={colors.primary}
            emissive={colors.emissive}
            emissiveIntensity={0.4 + amplitude * 0.6}
            distort={0.35 + amplitude * 0.2}
            speed={2 + amplitude * 3}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </Sphere>

        {/* Inner bright core */}
        <Sphere ref={innerRef} args={[0.55, 32, 32]}>
          <meshStandardMaterial
            color={colors.secondary}
            emissive={colors.secondary}
            emissiveIntensity={1.2 + amplitude}
            roughness={0}
            metalness={1}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      {/* Outer glow halo */}
      <Sphere args={[1.4, 32, 32]}>
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.primary}
          emissiveIntensity={0.15}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  )
}

// Floating particles ring
function ParticleRing({ state = 'idle' }) {
  const pointsRef = useRef()

  const particles = useMemo(() => {
    const count = 120
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 2.2 + (Math.random() - 0.5) * 0.8
      const height = (Math.random() - 0.5) * 0.4
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius
    }
    return positions
  }, [])

  useFrame((ctx, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.12
      pointsRef.current.rotation.x += delta * 0.02
    }
  })

  const color = state === 'distortion' ? '#fb7185' : state === 'listening' ? '#a78bfa' : '#2dd4bf'

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={particles} count={particles.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.025} transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

export default function AvenOrb({ state = 'idle', amplitude = 0, size = 300 }) {
  return (
    <div style={{ width: size, height: size }} className="relative">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#2dd4bf" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#8b5cf6" />
        <OrbCore state={state} amplitude={amplitude} />
        <ParticleRing state={state} />
        <Environment preset="night" />
      </Canvas>
    </div>
  )
}
