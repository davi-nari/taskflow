const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_KEY = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
)

const SESSION_KEY = 'taskflow_supabase_session_v1'
let refreshPromise = null

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY)

const readStoredSession = () => {
  if (typeof localStorage === 'undefined') return null

  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const writeStoredSession = (session) => {
  if (typeof localStorage === 'undefined') return

  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }

  const normalized = {
    ...session,
    expires_at:
      Number(session.expires_at) ||
      Math.floor(Date.now() / 1000) + Math.max(60, Number(session.expires_in) || 3600),
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(normalized))
}

const parseResponse = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const throwApiError = (response, payload) => {
  const message =
    payload?.msg ||
    payload?.message ||
    payload?.error_description ||
    payload?.error ||
    `Supabase request failed (${response.status})`

  const error = new Error(message)
  error.status = response.status
  error.payload = payload
  throw error
}

const baseHeaders = () => ({
  apikey: SUPABASE_KEY,
  'Content-Type': 'application/json',
})

const refreshSession = async () => {
  if (!isSupabaseConfigured()) return null
  if (refreshPromise) return refreshPromise

  const current = readStoredSession()
  if (!current?.refresh_token) {
    writeStoredSession(null)
    return null
  }

  refreshPromise = (async () => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    })
    const payload = await parseResponse(response)

    if (!response.ok) {
      writeStoredSession(null)
      return null
    }

    writeStoredSession(payload)
    return readStoredSession()
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export const getSupabaseSession = async ({ refresh = true } = {}) => {
  const session = readStoredSession()
  if (!session?.access_token) return null

  const expiresAtMs = Number(session.expires_at || 0) * 1000
  if (!expiresAtMs || expiresAtMs > Date.now() + 60_000) return session

  return refresh ? refreshSession() : null
}

export const getCurrentUser = async () => {
  const session = await getSupabaseSession()
  return session?.user || null
}

export const signInWithPassword = async (email, password) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase не настроен. Проверьте VITE_SUPABASE_URL и publishable key.')
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({ email, password }),
  })
  const payload = await parseResponse(response)

  if (!response.ok) throwApiError(response, payload)

  writeStoredSession(payload)
  return readStoredSession()
}

export const signOutSupabase = async () => {
  const session = await getSupabaseSession({ refresh: false })

  try {
    if (session?.access_token && isSupabaseConfigured()) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          ...baseHeaders(),
          Authorization: `Bearer ${session.access_token}`,
        },
      })
    }
  } finally {
    writeStoredSession(null)
  }
}

const request = async (
  path,
  {
    method = 'GET',
    body,
    auth = true,
    headers = {},
    retry = true,
  } = {},
) => {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured')

  let session = auth ? await getSupabaseSession() : null
  if (auth && !session?.access_token) {
    const error = new Error('Authentication required')
    error.status = 401
    throw error
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      ...baseHeaders(),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...headers,
    },
    ...(typeof body === 'undefined' ? {} : { body: JSON.stringify(body) }),
  })

  const payload = await parseResponse(response)

  if (response.status === 401 && auth && retry) {
    session = await refreshSession()
    if (session?.access_token) {
      return request(path, { method, body, auth, headers, retry: false })
    }
  }

  if (!response.ok) throwApiError(response, payload)
  return payload
}

export const restSelect = (table, query = '') =>
  request(`/rest/v1/${table}${query ? `?${query}` : ''}`)

export const restUpsert = (table, rows, { onConflict = 'id' } = {}) => {
  if (!rows?.length) return Promise.resolve(null)
  const conflict = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : ''

  return request(`/rest/v1/${table}${conflict}`, {
    method: 'POST',
    body: rows,
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
  })
}

export const restDelete = (table, query) =>
  request(`/rest/v1/${table}${query ? `?${query}` : ''}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })

export const rpcAuthenticated = (name, args = {}) =>
  request(`/rest/v1/rpc/${name}`, {
    method: 'POST',
    body: args,
  })

export const rpcPublic = (name, args = {}) =>
  request(`/rest/v1/rpc/${name}`, {
    method: 'POST',
    body: args,
    auth: false,
  })
