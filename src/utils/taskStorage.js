import {
  getDefaultLocationForDate,
  getLastLocation,
  getLocationOverrideForDate,
  saveLocationOverride,
} from '@/utils/settingsStorage'
import { queueTasksSync } from '@/data/supabaseRepository'

const STORAGE_KEY = 'tasks'

const VALID_LOCATIONS = new Set(['home', 'office'])

const nowIso = () => new Date().toISOString()

export const createEntityId = (prefix = 'id') => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const normalizePlanEntry = (entry = {}) => ({
  units:
    entry.units === null || entry.units === '' || typeof entry.units === 'undefined'
      ? null
      : Number(entry.units) || null,
  minutes:
    entry.minutes === null || entry.minutes === '' || typeof entry.minutes === 'undefined'
      ? null
      : Number(entry.minutes) || null,
})

export const normalizeTask = (task = {}) => {
  const types = Array.isArray(task.types) ? task.types : []
  const sourcePlan = task.planByType && typeof task.planByType === 'object' ? task.planByType : {}

  const planByType = types.reduce((acc, type) => {
    acc[type] = normalizePlanEntry(sourcePlan[type])
    return acc
  }, {})

  const actions = (Array.isArray(task.actions) ? task.actions : []).map((item) => ({
    ...item,
    id: String(item?.id ?? createEntityId('action')),
    workSessionId:
      item?.workSessionId === null || typeof item?.workSessionId === 'undefined'
        ? null
        : String(item.workSessionId),
  }))

  const workSessions = (Array.isArray(task.workSessions) ? task.workSessions : []).map((item) => ({
    ...item,
    id: String(item?.id ?? createEntityId('session')),
  }))

  const breaks = (Array.isArray(task.breaks) ? task.breaks : []).map((item) => ({
    ...item,
    id: String(item?.id ?? createEntityId('break')),
  }))

  return {
    ...task,
    id: String(task.id ?? createEntityId('task')),
    types,
    actions,
    workSessions,
    breaks,
    category: task.category || '',
    planByType,
    completedAt: task.completedAt || null,
    lastWorkType: types.includes(task.lastWorkType) ? task.lastWorkType : '',
    lastWorkOperation: ['create', 'add', 'edit'].includes(task.lastWorkOperation) ? task.lastWorkOperation : 'create',
    updatedAt: task.updatedAt || task.createdAt || nowIso(),
  }
}

export const getTasks = () => {
  const data = localStorage.getItem(STORAGE_KEY)

  if (!data) return []

  try {
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed.map(normalizeTask) : []
  } catch {
    return []
  }
}

export const hydrateTasksCache = (tasks = []) => {
  const normalized = (Array.isArray(tasks) ? tasks : []).map(normalizeTask)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export const saveTasks = (tasks) => {
  const normalized = hydrateTasksCache(tasks)
  queueTasksSync(normalized)
  return normalized
}

export const saveTask = (task) => {
  const tasks = getTasks()
  tasks.push(normalizeTask(task))
  saveTasks(tasks)
}

export const updateTask = (updatedTask) => {
  const tasks = getTasks()
  const index = tasks.findIndex((task) => task.id === updatedTask.id)

  if (index !== -1) {
    tasks[index] = normalizeTask(updatedTask)
  }

  saveTasks(tasks)
}

export const getWorkLocation = (date = new Date()) => {
  const override = getLocationOverrideForDate(date)
  if (VALID_LOCATIONS.has(override)) return override

  const scheduled = getDefaultLocationForDate(date)
  if (VALID_LOCATIONS.has(scheduled)) return scheduled

  const saved = getLastLocation()
  return VALID_LOCATIONS.has(saved) ? saved : 'home'
}

export const saveWorkLocation = (location, date = new Date()) =>
  saveLocationOverride(location, date)

export const getOpenSession = (task) => {
  const sessions = Array.isArray(task?.workSessions) ? task.workSessions : []

  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    if (!sessions[index].endedAt) return sessions[index]
  }

  return null
}

export const getOpenBreak = (task) => {
  const breaks = Array.isArray(task?.breaks) ? task.breaks : []

  for (let index = breaks.length - 1; index >= 0; index -= 1) {
    if (!breaks[index].endedAt) return breaks[index]
  }

  return null
}

export const stopActiveSession = (task, endedAt = nowIso()) => {
  const normalizedTask = normalizeTask(task)
  const endTimestamp = new Date(endedAt).getTime()
  let changed = false

  const workSessions = normalizedTask.workSessions.map((session) => {
    if (session.endedAt) return session

    const startTimestamp = new Date(session.startedAt).getTime()
    const durationMs =
      Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp)
        ? Math.max(0, endTimestamp - startTimestamp)
        : 0

    changed = true

    return {
      ...session,
      endedAt,
      durationMs,
    }
  })

  if (!changed) return normalizedTask

  return {
    ...normalizedTask,
    workSessions,
    updatedAt: endedAt,
  }
}

export const closeActiveBreak = (task, endedAt = nowIso()) => {
  const normalizedTask = normalizeTask(task)
  const endTimestamp = new Date(endedAt).getTime()
  let changed = false

  const breaks = normalizedTask.breaks.map((breakItem) => {
    if (breakItem.endedAt) return breakItem

    const startTimestamp = new Date(breakItem.startedAt).getTime()
    const durationMs =
      Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp)
        ? Math.max(0, endTimestamp - startTimestamp)
        : 0

    changed = true

    return {
      ...breakItem,
      endedAt,
      durationMs,
    }
  })

  if (!changed) return normalizedTask

  return {
    ...normalizedTask,
    breaks,
    updatedAt: endedAt,
  }
}

export const pauseTaskTracking = (
  task,
  { reason = 'break', pausedAt = nowIso() } = {},
) => {
  let nextTask = normalizeTask(task)

  if (nextTask.status !== 'progress' || getOpenBreak(nextTask)) {
    return nextTask
  }

  nextTask = stopActiveSession(nextTask, pausedAt)

  return {
    ...nextTask,
    breaks: [
      ...nextTask.breaks,
      {
        id: createEntityId('break'),
        reason,
        startedAt: pausedAt,
        endedAt: null,
        durationMs: null,
      },
    ],
    updatedAt: pausedAt,
  }
}

export const resumeTaskTracking = (
  task,
  { location = getWorkLocation(), resumedAt = nowIso() } = {},
) => {
  let nextTask = normalizeTask(task)

  if (nextTask.status !== 'progress') return nextTask

  nextTask = closeActiveBreak(nextTask, resumedAt)

  const rememberedType = nextTask.types.includes(nextTask.lastWorkType)
    ? nextTask.lastWorkType
    : ''
  const type = rememberedType || (nextTask.types.length === 1 ? nextTask.types[0] : '')
  const operation = ['create', 'add', 'edit'].includes(nextTask.lastWorkOperation)
    ? nextTask.lastWorkOperation
    : 'create'

  if (!type) return nextTask

  return switchWorkContext(nextTask, {
    type,
    operation,
    location,
    startedAt: resumedAt,
  })
}

export const switchWorkContext = (
  task,
  { type, operation = 'create', location = getWorkLocation(), startedAt = nowIso() } = {},
) => {
  const normalizedTask = normalizeTask(task)

  if (normalizedTask.status !== 'progress' || !normalizedTask.types.includes(type)) {
    return normalizedTask
  }

  const normalizedLocation = VALID_LOCATIONS.has(location) ? location : 'home'
  const normalizedOperation = ['create', 'add', 'edit'].includes(operation) ? operation : 'create'

  if (getOpenBreak(normalizedTask)) {
    return {
      ...normalizedTask,
      lastWorkType: type,
      lastWorkOperation: normalizedOperation,
      updatedAt: startedAt,
    }
  }
  const currentSession = getOpenSession(normalizedTask)

  if (
    currentSession &&
    currentSession.type === type &&
    (currentSession.operation || 'create') === normalizedOperation &&
    currentSession.location === normalizedLocation
  ) {
    return {
      ...normalizedTask,
      lastWorkType: type,
      lastWorkOperation: normalizedOperation,
    }
  }

  const taskWithoutOpenSession = stopActiveSession(normalizedTask, startedAt)

  return {
    ...taskWithoutOpenSession,
    lastWorkType: type,
    lastWorkOperation: normalizedOperation,
    workSessions: [
      ...taskWithoutOpenSession.workSessions,
      {
        id: createEntityId('session'),
        type,
        operation: normalizedOperation,
        location: normalizedLocation,
        startedAt,
        endedAt: null,
        durationMs: null,
      },
    ],
    updatedAt: startedAt,
  }
}

export const ensureActiveSession = (task, location = getWorkLocation()) => {
  const normalizedTask = normalizeTask(task)

  if (
    normalizedTask.status !== 'progress' ||
    getOpenSession(normalizedTask) ||
    getOpenBreak(normalizedTask)
  ) {
    return normalizedTask
  }

  const rememberedType = normalizedTask.types.includes(normalizedTask.lastWorkType)
    ? normalizedTask.lastWorkType
    : ''
  const type = rememberedType || (normalizedTask.types.length === 1 ? normalizedTask.types[0] : '')

  if (!type) return normalizedTask

  return switchWorkContext(normalizedTask, {
    type,
    operation: normalizedTask.lastWorkOperation || 'create',
    location,
  })
}

export const changeTaskStatus = (
  task,
  status,
  { location = getWorkLocation(), changedAt = nowIso() } = {},
) => {
  let nextTask = normalizeTask(task)

  if (nextTask.status === 'progress' && status !== 'progress') {
    nextTask = stopActiveSession(nextTask, changedAt)
    nextTask = closeActiveBreak(nextTask, changedAt)
  }

  nextTask = {
    ...nextTask,
    status,
    completedAt: status === 'done' ? changedAt : null,
    updatedAt: changedAt,
  }

  if (status === 'progress') {
    nextTask = ensureActiveSession(nextTask, location)
  }

  return nextTask
}
