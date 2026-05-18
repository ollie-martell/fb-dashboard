import { animate } from 'motion'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './Stat.module.css'

interface StatProps {
  label: string
  value: string
  middle?: ReactNode
  sub?: ReactNode
  countUp?: boolean
}

export default function Stat({ label, value, middle, sub, countUp }: StatProps) {
  const isSignedChar = value[0] === '+' || value[0] === '−'
  const sign = isSignedChar ? value[0] : null
  const body = isSignedChar ? value.slice(1) : value
  const bodyRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!countUp || !bodyRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target = parseFloat(body.replace(/[^0-9.]/g, ''))
    if (isNaN(target)) return

    const ctrl = animate(0, target, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (bodyRef.current) {
          bodyRef.current.textContent = Math.round(v).toLocaleString('en-US')
        }
      },
    })
    return () => ctrl.cancel()
  }, [countUp, body])

  return (
    <div>
      <div className={styles.eyebrow}>{label}</div>
      <div className={`display-number ${styles.value}`}>
        {sign && <span className={styles.sign}>{sign}</span>}
        <span ref={bodyRef}>{body}</span>
      </div>
      {middle}
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  )
}
