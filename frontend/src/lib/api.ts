/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5001'

export interface FollowerRowDto {
  date: string
  total_followers: number
  new_followers: number
  growth_rate: number
}

export interface Topline {
  yesterday: { value: number; date: string }
  wtd: {
    value: number
    date_range: string
    prior_week_value: number
    delta_pct: number
  }
  mtd: {
    value: number
    target: number
    pct_to_target: number
    pace_delta_pct: number
    projection: number
  }
  total_followers: number
  as_of: string
}

export interface FollowersResponse {
  rows: FollowerRowDto[]
  topline: Topline
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  })

  let body: unknown = null
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string')
        ? (body as { error: string }).error
        : `HTTP ${res.status}`
    throw new ApiError(res.status, msg, body)
  }

  return body as T
}

export function getFollowers(): Promise<FollowersResponse> {
  return request('/api/followers')
}

export function refreshFollowers(): Promise<FollowersResponse> {
  return request('/api/refresh', { method: 'POST' })
}

export function getInstagram(): Promise<FollowersResponse> {
  return request('/api/instagram')
}

export function refreshInstagram(): Promise<FollowersResponse> {
  return request('/api/instagram/refresh', { method: 'POST' })
}
