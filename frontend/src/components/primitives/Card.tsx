import type { CSSProperties, ReactNode } from 'react'
import styles from './Card.module.css'

type CardVariant = 'white' | 'yellow' | 'dark'

interface CardProps {
  variant?: CardVariant
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export default function Card({ variant = 'white', children, style, className }: CardProps) {
  const cls = [styles.card, styles[variant], className].filter(Boolean).join(' ')
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  )
}
