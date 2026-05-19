import styles from './Delta.module.css'

interface DeltaProps {
  value: string
  tone: 'positive' | 'negative'
  platform?: 'facebook' | 'instagram'
}

export default function Delta({ value, tone, platform }: DeltaProps) {
  const isInstagramPositive = platform === 'instagram' && tone === 'positive'
  const cls = [
    styles.pill,
    isInstagramPositive ? styles.instagramPositive : styles[tone],
  ].join(' ')
  return <span className={cls}>{value}</span>
}
