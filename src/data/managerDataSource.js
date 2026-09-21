import { isSupabaseConfigured } from '@/data/supabaseApi'
import { loadPublicManagerSnapshot } from '@/data/supabaseRepository'
import { getTasks, getWorkLocation } from '@/utils/taskStorage'
import { getSettings, isWorkdayEndedForDate } from '@/utils/settingsStorage'

const loadLocalFallback = async (token) => {
  const settings = getSettings()
  if (!settings.managerAccessToken || settings.managerAccessToken !== token) {
    return { authorized: false, tasks: [], settings: null, todayLocation: null }
  }

  const tasks = getTasks().map((task) => ({
    id: task.id,
    title: task.title,
    types: [...(task.types || [])],
    category: task.category || '',
    planByType: Object.fromEntries(
      Object.entries(task.planByType || {}).map(([type, plan]) => [type, { units: Number(plan?.units) || null }]),
    ),
    deadline: task.deadline || '',
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
    actions: (task.actions || []).map((action) => ({
      id: action.id,
      type: action.type,
      action: action.action,
      pageTitle: action.pageTitle || '',
      url: action.url,
      location: action.location,
      createdAt: action.createdAt,
      editedAt: action.editedAt || null,
      units: Number(action.units) || 1,
    })),
  }))

  return {
    authorized: true,
    tasks,
    settings: {
      categories: settings.categories || [],
      schedule: settings.schedule || {},
      workdayStart: settings.workdayStart || '10:00',
      workdayEnd: settings.workdayEnd || '18:00',
      workdayEndedToday: isWorkdayEndedForDate(),
    },
    todayLocation: getWorkLocation(),
  }
}

export const loadManagerSnapshot = async (token) => {
  if (!isSupabaseConfigured()) return loadLocalFallback(token)

  try {
    const payload = await loadPublicManagerSnapshot(token)
    return payload || { authorized: false, tasks: [], settings: null, todayLocation: null }
  } catch (error) {
    console.error('[TaskFlow] Failed to load manager snapshot:', error)
    return { authorized: false, tasks: [], settings: null, todayLocation: null }
  }
}
