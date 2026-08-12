// React unused

// CSS-based aurora — no Three.js overhead on landing page
export default function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden="true">
      {/* Layer 1 — teal blob */}
      <div
        className="aurora-layer"
        style={{
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, rgba(45,212,191,0.4) 0%, transparent 70%)',
          top: '-20%',
          left: '-10%',
          animationDuration: '25s',
          animationDelay: '0s',
        }}
      />
      {/* Layer 2 — violet blob */}
      <div
        className="aurora-layer"
        style={{
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
          top: '10%',
          right: '-15%',
          animationDuration: '30s',
          animationDelay: '-8s',
        }}
      />
      {/* Layer 3 — rose accent */}
      <div
        className="aurora-layer"
        style={{
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, rgba(251,113,133,0.2) 0%, transparent 70%)',
          bottom: '-10%',
          left: '30%',
          animationDuration: '20s',
          animationDelay: '-15s',
        }}
      />
      {/* Layer 4 — indigo deep */}
      <div
        className="aurora-layer"
        style={{
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          bottom: '20%',
          right: '20%',
          animationDuration: '35s',
          animationDelay: '-5s',
        }}
      />
      {/* Noise grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />
    </div>
  )
}
