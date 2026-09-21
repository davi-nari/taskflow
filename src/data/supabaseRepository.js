import {
  getCurrentUser,
  isSupabaseConfigured,
  restDelete,
  restSelect,
  restUpsert,
  rpcAuthenticated,
  rpcPublic,
} from '@/data/supabaseApi'

const TABLES = {
  tasks: 'taskflow_tasks',
  actions: 'taskflow_actions',
  sessions: 'taskflow_work_sessions',
  breaks: 'taskflow_breaks',
  settings: 'taskflow_settings',
}

const idCache = {
  tasks: null,
  actions: null,
  sessions: null,
  breaks: null,
}

let taskSyncChain = Promise.resolve()
let settingsSyncChain = Promise.resolve()

const setSyncError = (error) => {
  if (typeof localStorage === 'undefined') return
  if (!error) {
    localStorage.removeItem('taskflow_supabase_sync_error')
    return
  }

  localStorage.setItem(
    'taskflow_supabase_sync_error',
    JSON.stringify({ message: error.message || String(error), at: new Date().toISOString() }),
  )
}

export const getLastSyncError = () => {
  if (typeof localStorage === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('taskflow_supabase_sync_error') || 'null')
  } catch {
    return null
  }
}

const mapTaskRowToLocal = (row, children) => ({
  id: row.id,
  title: row.title,
  types: Array.isArray(row.types) ? row.types : [],
  category: row.category || '',
  planByType: row.plan_by_type || {},
  deadline: row.deadline || '',
  description: row.description || '',
  status: row.status || 'todo',
  lastWorkType: row.last_work_type || '',
  lastWorkOperation: row.last_work_operation || 'create',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  completedAt: row.completed_at,
  actions: children.actions.filter((item) => item.task_id === row.id).map((item) => ({
    id: item.id,
    type: item.type,
    action: item.operation,
    pageTitle: item.page_title || '',
    url: item.url,
    location: item.location,
    units: Number(item.units) || 1,
    workSessionId: item.work_session_id || null,
    createdAt: item.created_at,
    editedAt: item.edited_at || null,
  })),
  workSessions: children.sessions.filter((item) => item.task_id === row.id).map((item) => ({
    id: item.id,
    type: item.type,
    operation: item.operation,
    location: item.location,
    startedAt: item.started_at,
    endedAt: item.ended_at || null,
    durationMs: item.duration_ms === null ? null : Number(item.duration_ms),
  })),
  breaks: children.breaks.filter((item) => item.task_id === row.id).map((item) => ({
    id: item.id,
    reason: item.reason,
    startedAt: item.started_at,
    endedAt: item.ended_at || null,
    durationMs: item.duration_ms === null ? null : Number(item.duration_ms),
  })),
})

const taskToRow = (task, userId) => ({
  id: String(task.id),
  user_id: userId,
  title: task.title || '',
  types: Array.isArray(task.types) ? task.types : [],
  category: task.category || '',
  plan_by_type: task.planByType || {},
  deadline: task.deadline || null,
  description: task.description || '',
  status: task.status || 'todo',
  last_work_type: task.lastWorkType || '',
  last_work_operation: task.lastWorkOperation || 'create',
  created_at: task.createdAt || new Date().toISOString(),
  updated_at: task.updatedAt || new Date().toISOString(),
  completed_at: task.completedAt || null,
})

const flattenTaskChildren = (tasks, userId) => {
  const actions = []
  const sessions = []
  const breaks = []

  tasks.forEach((task) => {
    ;(task.actions || []).forEach((item) => {
      actions.push({
        id: String(item.id),
        task_id: String(task.id),
        user_id: userId,
        type: item.type,
        operation: item.action || item.operation || 'create',
        page_title: item.pageTitle || '',
        url: item.url || '',
        location: item.location || null,
        units: Number(item.units) || 1,
        work_session_id: item.workSessionId === null || typeof item.workSessionId === 'undefined' ? null : String(item.workSessionId),
        created_at: item.createdAt || new Date().toISOString(),
        edited_at: item.editedAt || null,
      })
    })

    ;(task.workSessions || []).forEach((item) => {
      sessions.push({
        id: String(item.id),
        task_id: String(task.id),
        user_id: userId,
        type: item.type,
        operation: item.operation || 'create',
        location: item.location || 'home',
        started_at: item.startedAt,
        ended_at: item.endedAt || null,
        duration_ms: item.durationMs === null || typeof item.durationMs === 'undefined' ? null : Math.round(Number(item.durationMs) || 0),
      })
    })

    ;(task.breaks || []).forEach((item) => {
      breaks.push({
        id: String(item.id),
        task_id: String(task.id),
        user_id: userId,
        reason: item.reason || 'break',
        started_at: item.startedAt,
        ended_at: item.endedAt || null,
        duration_ms: item.durationMs === null || typeof item.durationMs === 'undefined' ? null : Math.round(Number(item.durationMs) || 0),
      })
    })
  })

  return { actions, sessions, breaks }
}

const deleteIds = async (table, ids) => {
  const chunks = []
  for (let index = 0; index < ids.length; index += 100) chunks.push(ids.slice(index, index + 100))

  for (const chunk of chunks) {
    const quoted = chunk.map((id) => `"${String(id).replaceAll('"', '\\"')}"`).join(',')
    await restDelete(table, `id=${encodeURIComponent(`in.(${quoted})`)}`)
  }
}

const ensureIdCache = async (key) => {
  if (idCache[key] instanceof Set) return idCache[key]
  const rows = await restSelect(TABLES[key], 'select=id')
  idCache[key] = new Set((rows || []).map((row) => row.id))
  return idCache[key]
}

const syncRowsById = async (key, rows) => {
  const table = TABLES[key]
  const known = await ensureIdCache(key)
  const next = new Set(rows.map((row) => row.id))

  if (rows.length) await restUpsert(table, rows)

  const removed = [...known].filter((id) => !next.has(id))
  if (removed.length) await deleteIds(table, removed)

  idCache[key] = next
}

export const loadWorkspaceFromSupabase = async () => {
  if (!isSupabaseConfigured()) return { tasks: [], settings: null }
  const user = await getCurrentUser()
  if (!user) return { tasks: [], settings: null }

  const [tasks, actions, sessions, breaks, settingsRows] = await Promise.all([
    restSelect(TABLES.tasks, 'select=*&order=updated_at.desc'),
    restSelect(TABLES.actions, 'select=*&order=created_at.asc'),
    restSelect(TABLES.sessions, 'select=*&order=started_at.asc'),
    restSelect(TABLES.breaks, 'select=*&order=started_at.asc'),
    restSelect(TABLES.settings, 'select=*'),
  ])

  idCache.tasks = new Set((tasks || []).map((row) => row.id))
  idCache.actions = new Set((actions || []).map((row) => row.id))
  idCache.sessions = new Set((sessions || []).map((row) => row.id))
  idCache.breaks = new Set((breaks || []).map((row) => row.id))

  const children = { actions: actions || [], sessions: sessions || [], breaks: breaks || [] }
  const localTasks = (tasks || []).map((row) => mapTaskRowToLocal(row, children))
  const row = settingsRows?.[0] || null

  return {
    tasks: localTasks,
    settings: row
      ? {
          schedule: row.schedule || {},
          categories: Array.isArray(row.categories) ? row.categories : [],
          locationOverrides: row.location_overrides || {},
          lastLocation: row.last_location || 'home',
          dailyMinimum: Number(row.daily_minimum) || 0,
          timezone: row.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent',
        }
      : null,
  }
}

export const syncTasksSnapshot = async (tasks = []) => {
  if (!isSupabaseConfigured()) return
  const user = await getCurrentUser()
  if (!user) return

  const normalizedTasks = Array.isArray(tasks) ? tasks : []
  const taskRows = normalizedTasks.map((task) => taskToRow(task, user.id))
  const children = flattenTaskChildren(normalizedTasks, user.id)

  if (taskRows.length) await restUpsert(TABLES.tasks, taskRows)
  await Promise.all([
    syncRowsById('actions', children.actions),
    syncRowsById('sessions', children.sessions),
    syncRowsById('breaks', children.breaks),
  ])

  const knownTasks = await ensureIdCache('tasks')
  const nextTaskIds = new Set(taskRows.map((row) => row.id))
  const removedTasks = [...knownTasks].filter((id) => !nextTaskIds.has(id))
  if (removedTasks.length) await deleteIds(TABLES.tasks, removedTasks)
  idCache.tasks = nextTaskIds

  setSyncError(null)
}

export const queueTasksSync = (tasks = []) => {
  const snapshot = JSON.parse(JSON.stringify(tasks || []))
  taskSyncChain = taskSyncChain
    .catch(() => undefined)
    .then(() => syncTasksSnapshot(snapshot))
    .catch((error) => {
      setSyncError(error)
      console.error('[TaskFlow] Supabase task sync failed:', error)
    })
  return taskSyncChain
}

export const syncSettingsSnapshot = async (settings = {}) => {
  if (!isSupabaseConfigured()) return
  const user = await getCurrentUser()
  if (!user) return

  await restUpsert(TABLES.settings, [{
    user_id: user.id,
    schedule: settings.schedule || {},
    categories: settings.categories || [],
    location_overrides: settings.locationOverrides || {},
    last_location: ['home', 'office'].includes(settings.lastLocation) ? settings.lastLocation : 'home',
    daily_minimum: Math.max(0, Number(settings.dailyMinimum) || 0),
    timezone: settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent',
    updated_at: new Date().toISOString(),
  }], { onConflict: 'user_id' })

  setSyncError(null)
}

export const queueSettingsSync = (settings = {}) => {
  const snapshot = JSON.parse(JSON.stringify(settings || {}))
  settingsSyncChain = settingsSyncChain
    .catch(() => undefined)
    .then(() => syncSettingsSnapshot(snapshot))
    .catch((error) => {
      setSyncError(error)
      console.error('[TaskFlow] Supabase settings sync failed:', error)
    })
  return settingsSyncChain
}

export const createManagerAccessToken = async () => {
  const payload = await rpcAuthenticated('taskflow_create_manager_link')
  return typeof payload === 'string' ? payload : String(payload || '')
}

export const loadPublicManagerSnapshot = async (token) => {
  const payload = await rpcPublic('taskflow_manager_snapshot', { p_token: token })
  return payload || { authorized: false }
}

export const resetSupabaseRepositoryCache = () => {
  Object.keys(idCache).forEach((key) => { idCache[key] = null })
}
