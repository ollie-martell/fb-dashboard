import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'

export interface DayData {
  date: string
  newFollowers: number
}

interface GrowthChartProps {
  data: DayData[]
  animate?: boolean
  compact?: boolean
  platform?: string
}

interface TooltipState {
  date: string
  newFollowers: number
  x: number  // px from left of wrapper
  y: number  // px from top of wrapper
}

const PAD = { top: 16, right: 4, bottom: 28, left: 4 }

function formatTooltipDate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export default function GrowthChart({ data, animate, compact, platform }: GrowthChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDims({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { width, height } = dims
  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom

  const render = width > 0 && height > 0

  const gap = compact ? 2 : 3
  const rawBarW = data.length > 0 ? (innerW - gap * (data.length - 1)) / data.length : 0
  const barW = Math.min(24, Math.max(2, rawBarW))
  const totalBarsW = barW * data.length + gap * (data.length - 1)
  const offsetX = (innerW - totalBarsW) / 2

  const yScale = render
    ? d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d.newFollowers) ?? 1])
        .range([innerH, 0])
    : null

  const ig = platform === 'instagram'
  const fillDefault = ig ? 'var(--accent-blue)' : 'var(--accent-yellow)'
  const fillHover   = ig ? 'var(--accent-blue-strong)' : 'var(--accent-yellow-strong)'

  // Month change markers
  const monthMarkers: { index: number; label: string }[] = []
  let lastMonth = ''
  data.forEach((d, i) => {
    const m = d.date.slice(0, 7)
    if (m !== lastMonth) {
      const label = new Date(d.date + 'T12:00:00Z').toLocaleDateString('en-US', {
        month: 'long',
        timeZone: 'UTC',
      })
      monthMarkers.push({ index: i, label })
      lastMonth = m
    }
  })

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {render && (
        <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {data.map((d, i) => {
              const isLast = i === data.length - 1
              const isHovered = tooltip?.date === d.date
              const bh = Math.max(2, innerH - (yScale!(d.newFollowers) ?? 0))
              const x = offsetX + i * (barW + gap)
              const y = innerH - bh

              return (
                <g key={d.date}>
                  <rect
                    x={x} y={y} width={barW} height={bh} rx={3}
                    fill={isHovered ? fillHover : fillDefault}
                    className={isLast && animate ? 'bar-bounce' : undefined}
                  />
                  {/* Wider hit area for easier hover targeting */}
                  <rect
                    x={x - gap / 2}
                    y={y}
                    width={barW + gap}
                    height={bh}
                    fill="transparent"
                    style={{ cursor: 'default' }}
                    onMouseEnter={() =>
                      setTooltip({
                        date: d.date,
                        newFollowers: d.newFollowers,
                        x: PAD.left + x + barW / 2,
                        y: PAD.top + y,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              )
            })}

            {monthMarkers.map(({ index, label }) => {
              const x = offsetX + index * (barW + gap)
              return (
                <text
                  key={label}
                  x={x}
                  y={innerH + 18}
                  fill="var(--text-tertiary)"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize={10}
                >
                  {label}
                </text>
              )
            })}
          </g>
        </svg>
      )}

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            background: 'var(--bg-card-white)',
            boxShadow: 'var(--shadow-lift)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 10px',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          <div style={{ fontWeight: 600 }}>{tooltip.newFollowers.toLocaleString('en-US')}</div>
          <div style={{ color: 'var(--text-tertiary)' }}>{formatTooltipDate(tooltip.date)}</div>
        </div>
      )}
    </div>
  )
}
