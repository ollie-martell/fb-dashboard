import styles from './Delta.module.css'

interface DeltaProps {
  value: string
  tone: 'positive' | 'negative'
}

export default function Delta({ value, tone }: DeltaProps) {
  return (
    <span className={`${styles.pill} ${styles[tone]}`}>{value}</span>
  )
}
