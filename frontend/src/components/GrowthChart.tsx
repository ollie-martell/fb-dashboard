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
}

const PAD = { top: 32, right: 4, bottom: 28, left: 4 }

export default function GrowthChart({ data, animate, compact }: GrowthChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })

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
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      {render && (
        <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {data.map((d, i) => {
              const isLast = i === data.length - 1
              const bh = Math.max(2, innerH - (yScale!(d.newFollowers) ?? 0))
              const x = offsetX + i * (barW + gap)
              const y = innerH - bh
              const fill = isLast ? 'var(--accent-yellow-strong)' : 'var(--accent-yellow)'

              return (
                <g key={d.date}>
                  <rect
                    x={x} y={y} width={barW} height={bh} rx={3} fill={fill}
                    className={isLast && animate ? 'bar-bounce' : undefined}
                  />
                  {isLast && (
                    <text
                      x={x + barW / 2}
                      y={y - 10}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontFamily="'Bricolage Grotesque', sans-serif"
                      fontSize={12}
                      fontWeight={600}
                    >
                      {d.newFollowers.toLocaleString('en-US')}
                    </text>
                  )}
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
    </div>
  )
}
