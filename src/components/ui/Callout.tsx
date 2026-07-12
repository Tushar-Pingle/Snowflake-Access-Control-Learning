import type { ReactNode } from 'react'
import { InlineMd } from './InlineMd'

type Variant = 'info' | 'warning' | 'tip' | 'pitfall'

const META: Record<Variant, { emoji: string; label: string }> = {
  info: { emoji: 'ℹ️', label: 'Note' },
  warning: { emoji: '⚠️', label: 'Watch out' },
  tip: { emoji: '💡', label: 'Tip' },
  pitfall: { emoji: '🕳️', label: 'Common pitfall' },
}

export function Callout({ variant, title, children, md }: { variant: Variant; title?: string; children?: ReactNode; md?: string }) {
  const meta = META[variant]
  return (
    <div className={`callout callout-${variant}`}>
      <div className="callout-title">
        <span aria-hidden>{meta.emoji}</span>
        <span>{title ?? meta.label}</span>
      </div>
      <div>{md ? <p><InlineMd text={md} /></p> : children}</div>
    </div>
  )
}
