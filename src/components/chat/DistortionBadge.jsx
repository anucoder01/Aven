import { DISTORTION_LABELS } from '../../data/scenarios'

export default function DistortionBadge({ distortionKey, severity, compact = false }) {
  const label = DISTORTION_LABELS.find(d => d.key === distortionKey)
  if (!label) return null

  const style = {
    backgroundColor: `${label.color}18`,
    borderColor: `${label.color}35`,
    color: label.color,
  }

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
        style={style}
        title={`${label.label} — Severity ${severity}/5`}
      >
        {label.emoji} {severity}/5
      </span>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={style}
    >
      <span>{label.emoji}</span>
      <span>{label.label}</span>
      <span className="opacity-60">·</span>
      <span className="opacity-80">sev {severity}/5</span>
    </div>
  )
}
