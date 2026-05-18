import type { ReactNode } from 'react'
import Card from './Card'
import styles from './ChartShell.module.css'

interface ChartShellProps {
  title: string
  toggle?: ReactNode
  children: ReactNode
}

export default function ChartShell({ title, toggle, children }: ChartShellProps) {
  return (
    <Card variant="white" style={{ padding: 0 }}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.title}>{title}</span>
          {toggle && <div>{toggle}</div>}
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </Card>
  )
}
