const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const TOKEN_KEY = 'mon-songlap-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(
      (data as { message?: string }).message || 'Request failed',
      response.status,
      data
    )
  }

  return data as T
}

export async function simulateStream(
  text: string,
  onChunk: (chunk: string) => void,
  delayMs = 35
): Promise<string> {
  if (!text) {
    onChunk('')
    return ''
  }

  const words = text.split(' ')
  let accumulated = ''
  for (const word of words) {
    await new Promise((r) => setTimeout(r, delayMs))
    accumulated += (accumulated ? ' ' : '') + word
    onChunk(accumulated)
  }
  return text
}
