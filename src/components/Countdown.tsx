import { useNow } from '../app/hooks'

const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function Countdown({ endsAt, className = '' }: { endsAt: number; className?: string }) {
  const now = useNow(500)
  const remaining = endsAt - now.getTime()
  return (
    <span className={`countdown ${remaining <= 0 ? 'countdown-done' : ''} ${className}`} aria-live="polite">
      {remaining <= 0 ? 'Time' : formatClock(remaining)}
    </span>
  )
}
