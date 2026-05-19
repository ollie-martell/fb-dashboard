import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './App.module.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import GrowthChart, { type DayData } from './components/GrowthChart'
import Card from './components/primitives/Card'
import ChartShell from './components/primitives/ChartShell'
import Delta from './components/primitives/Delta'
import Stat from './components/primitives/Stat'
import {
  ApiError,
  getFollowers,
  getInstagram,
  refreshFollowers,
  refreshInstagram,
  type FollowersResponse,
} from './lib/api'

type Range = '30D' | '45D' | 'All'
type Platform = 'facebook' | 'instagram'

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.5 7A5.5 5.5 0 1 1 7 1.5a5.47 5.47 0 0 1 3.89 1.61M10.5 1.5h3v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function useShouldAnimate(hasData: boolean) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  useEffect(() => {
    if (!hasData) return
    if (sessionStorage.getItem('hasAnimated')) return
    setShouldAnimate(true)
    sessionStorage.setItem('hasAnimated', '1')
  }, [hasData])
  return shouldAnimate
}

function useCompact() {
  const [compact, setCompact] = useState(() => window.innerWidth < 600)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 599px)')
    const handler = (e: MediaQueryListEvent) => setCompact(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return compact
}

function formatPercent(n: number): string {
  const rounded = Math.round(n * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  const abs = Math.abs(rounded)
  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1)
  return `${sign}${formatted}%`
}

function formatSigned(n: number): string {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${Math.abs(n).toLocaleString('en-US')}`
}

function formatProjectionK(n: number): string {
  return `${Math.round(n / 1000)}K`
}

function formatYesterdayDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatAsOf(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatTime(ts: number): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function PlatformToggle({
  value,
  onChange,
}: {
  value: Platform
  onChange: (p: Platform) => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 'var(--space-1)',
        background: 'var(--bg-subtle)',
        padding: '3px',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      {(['facebook', 'instagram'] as const).map((p) => {
        const active = p === value
        const label = p === 'facebook' ? 'Facebook' : 'Instagram'
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              background: active ? 'var(--bg-card-white)' : 'transparent',
              border: 'none',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '7px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 'var(--radius-pill)',
              boxShadow: active ? 'var(--shadow-card)' : 'none',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function RangeToggle({
  value,
  onChange,
}: {
  value: Range
  onChange: (r: Range) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-1)',
        background: 'var(--bg-page)',
        padding: '3px',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      {(['30D', '45D', 'All'] as const).map((label) => {
        const active = label === value
        return (
          <button
            key={label}
            onClick={() => onChange(label)}
            style={{
              background: active ? 'var(--bg-card-white)' : 'transparent',
              border: 'none',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '7px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 'var(--radius-pill)',
              boxShadow: active ? '0 1px 2px rgba(26,22,18,0.06)' : 'none',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function MtdMiddle({ pctToTarget, target, platform }: { pctToTarget: number; target: number; platform: Platform }) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            color: 'var(--text-on-dark-dim)',
            letterSpacing: 'var(--tracking-mono)',
          }}
        >
          / {target.toLocaleString('en-US')}
        </span>
        <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-on-dark-dim)' }}>
          target
        </span>
      </div>
      <div
        style={{
          height: '6px',
          background: 'var(--bg-dark-overlay)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, pctToTarget))}%`,
            background: platform === 'instagram' ? 'var(--accent-blue)' : 'var(--accent-yellow)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: platform === 'instagram' ? 'var(--shadow-blue-glow)' : 'var(--shadow-yellow-glow)',
            transition: 'width 400ms var(--ease-out)',
          }}
        />
      </div>
    </>
  )
}

function RefreshButton({ platform }: { platform: Platform }) {
  const queryClient = useQueryClient()
  const [flashSuccess, setFlashSuccess] = useState(false)

  const onSuccess = (data: FollowersResponse) => {
    const key = platform === 'facebook' ? ['followers'] : ['instagram']
    queryClient.setQueryData(key, data)
    queryClient.invalidateQueries({ queryKey: key })
    setFlashSuccess(true)
    window.setTimeout(() => setFlashSuccess(false), 500)
  }

  const fbMutation = useMutation({ mutationFn: refreshFollowers, onSuccess })
  const igMutation = useMutation({ mutationFn: refreshInstagram, onSuccess })
  const mutation = platform === 'facebook' ? fbMutation : igMutation

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      style={{
        background: 'var(--bg-card-white)',
        border: flashSuccess
          ? '1px solid var(--accent-green)'
          : '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
        padding: '9px 18px 10px',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-13)',
        fontWeight: 500,
        cursor: mutation.isPending ? 'default' : 'pointer',
        borderRadius: 'var(--radius-pill)',
        boxShadow: 'var(--shadow-card)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        minWidth: 96,
        justifyContent: 'center',
        transition: 'transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out), border-color 180ms var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        if (mutation.isPending) return
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lift)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      {mutation.isPending ? (
        <span className="pulse-dot" aria-label="Refreshing" />
      ) : (
        <>
          <RefreshIcon />
          Refresh
        </>
      )}
    </button>
  )
}

function Dashboard() {
  const [platform, setPlatform] = useState<Platform>('facebook')
  const [range, setRange] = useState<Range>('45D')
  const compact = useCompact()

  const fbQuery = useQuery<FollowersResponse, ApiError>({
    queryKey: ['followers'],
    queryFn: getFollowers,
  })

  const igQuery = useQuery<FollowersResponse, ApiError>({
    queryKey: ['instagram'],
    queryFn: getInstagram,
  })

  const query = platform === 'facebook' ? fbQuery : igQuery
  const data = query.data
  const hasData = !!data
  const shouldAnimate = useShouldAnimate(hasData)

  // Pulse the yellow card shadow when yesterday's value changes after a refresh.
  // Reset the ref when switching platforms to avoid a false pulse.
  const [pulseShadow, setPulseShadow] = useState(false)
  const prevYesterdayRef = useRef<number | null>(null)

  useEffect(() => {
    prevYesterdayRef.current = null
  }, [platform])

  useEffect(() => {
    if (!data) return
    const val = data.topline.yesterday.value
    if (prevYesterdayRef.current !== null && prevYesterdayRef.current !== val) {
      setPulseShadow(true)
      const t = window.setTimeout(() => setPulseShadow(false), 600)
      return () => window.clearTimeout(t)
    }
    prevYesterdayRef.current = val
  }, [data?.topline.yesterday.value])

  const allChartData: DayData[] = useMemo(
    () =>
      data?.rows.map((r) => ({ date: r.date, newFollowers: r.new_followers })) ??
      [],
    [data],
  )

  const chartData = useMemo(() => {
    if (range === 'All') return allChartData
    const n = range === '30D' ? 30 : 45
    return allChartData.slice(-n)
  }, [allChartData, range])

  const revealClass = (slot: 1 | 2 | 3 | 4) =>
    shouldAnimate ? `reveal reveal-d${slot}` : undefined

  const cardVisibility = hasData ? 'visible' : 'hidden'

  const yesterdayValue = data ? formatSigned(data.topline.yesterday.value) : '+0'
  const yesterdaySub = data ? formatYesterdayDate(data.topline.yesterday.date) : ''

  const wtdValue = data ? formatSigned(data.topline.wtd.value) : '+0'
  const wtdDelta = data?.topline.wtd.delta_pct ?? 0
  const wtdTone: 'positive' | 'negative' = wtdDelta >= 0 ? 'positive' : 'negative'

  const mtdValue = data ? formatSigned(data.topline.mtd.value) : '+0'
  const mtdTarget = data?.topline.mtd.target ?? 0
  const mtdPct = data?.topline.mtd.pct_to_target ?? 0
  const mtdPace = data?.topline.mtd.pace_delta_pct ?? 0
  const mtdTone: 'positive' | 'negative' = mtdPace >= 0 ? 'positive' : 'negative'
  const paceLabel = mtdPace >= 0 ? 'above pace' : 'below pace'
  const projection = data ? formatProjectionK(data.topline.mtd.projection) : ''

  const asOf = data ? formatAsOf(data.topline.as_of) : '—'
  const fetchedAt = query.dataUpdatedAt ? formatTime(query.dataUpdatedAt) : ''

  const yesterdayCardClass = [
    revealClass(1),
    pulseShadow ? 'shadow-pulse' : undefined,
  ].filter(Boolean).join(' ') || undefined

  return (
    <div
      style={{
        maxWidth: 'var(--container-max)',
        margin: '0 auto',
        padding: 'clamp(20px, 3vw, 36px) clamp(20px, 4vw, 56px) 64px',
      }}
    >
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--text-13)', fontWeight: 500, letterSpacing: '0.04em' }}>
          <img src="/logo.png" alt="Martell Media" height={28} style={{ display: 'block' }} />
          <span style={{ color: 'var(--text-tertiary)', margin: '0 8px' }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>Meta Platforms</span>
        </div>

        <div className={styles.headerRight}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              visibility: hasData ? 'visible' : 'hidden',
            }}
          >
            Updated {asOf}
            {fetchedAt ? ` · ${fetchedAt}` : ''}
          </span>
          <RefreshButton platform={platform} />
        </div>
      </header>

      <div style={{ marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
        <PlatformToggle value={platform} onChange={setPlatform} />
      </div>

      <div className={styles.cardGrid}>
        <Card
          variant={platform === 'instagram' ? 'blue' : 'yellow'}
          className={yesterdayCardClass}
          style={{ visibility: cardVisibility }}
        >
          <Stat label="Yesterday" value={yesterdayValue} sub={yesterdaySub} countUp={shouldAnimate} />
        </Card>

        <Card
          variant="white"
          className={revealClass(2)}
          style={{ visibility: cardVisibility }}
        >
          <Stat
            label="Week to date"
            value={wtdValue}
            countUp={shouldAnimate}
            sub={
              <>
                <Delta value={formatPercent(wtdDelta)} tone={wtdTone} platform={platform} /> vs prior week
              </>
            }
          />
        </Card>

        <Card
          variant="dark"
          className={revealClass(3)}
          style={{ visibility: cardVisibility }}
        >
          <Stat
            label="Month to date"
            value={mtdValue}
            countUp={shouldAnimate}
            middle={<MtdMiddle pctToTarget={mtdPct} target={mtdTarget} platform={platform} />}
            sub={
              <>
                <Delta value={formatPercent(mtdPace)} tone={mtdTone} platform={platform} /> {paceLabel}
                {projection ? ` · projecting ${projection}` : ''}
              </>
            }
          />
        </Card>
      </div>

      <div
        className={revealClass(4)}
        style={{ visibility: cardVisibility }}
      >
        <ChartShell
          title="Daily new followers"
          toggle={<RangeToggle value={range} onChange={setRange} />}
        >
          <GrowthChart data={chartData} animate={shouldAnimate} compact={compact} platform={platform} />
        </ChartShell>
      </div>

      <div
        style={{
          marginTop: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 6px',
          fontSize: 'var(--text-13)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          visibility: cardVisibility,
        }}
      >
        <span style={{ color: 'var(--text-tertiary)' }}>Total followers</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          {data ? data.topline.total_followers.toLocaleString('en-US') : '0'}
        </span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
