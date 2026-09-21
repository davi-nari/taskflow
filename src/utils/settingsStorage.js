import { queueSettingsSync } from '@/data/supabaseRepository'

const SETTINGS_KEY = 'taskflow_settings_v1'
const LEGACY_WORK_LOCATION_KEY = 'taskflow_work_location'
const LEGACY_WORK_LOCATION_OVERRIDES_KEY = 'taskflow_work_location_overrides'
const LEGACY_DAILY_MINIMUM_KEY = 'taskflow_daily_minimum'

export const DEFAULT_SCHEDULE = {
  1: 'office',
  2: 'home',
  3: 'office',
  4: 'home',
  5: 'home',
  6: 'off',
  0: 'off',
}

const VALID_DAY_MODES = new Set(['home', 'office', 'off'])
const VALID_LOCATIONS = new Set(['home', 'office'])

const normalizeCategory = (value) => String(value || '').trim().replace(/\s+/g, ' ')

const readLegacyOverrides = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_WORK_LOCATION_OVERRIDES_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const normalizeSettings = (settings = {}) => {
  const sourceSchedule = settings.schedule && typeof settings.schedule === 'object'
    ? settings.schedule
    : {}

  const schedule = Object.keys(DEFAULT_SCHEDULE).reduce((acc, day) => {
    const candidate = sourceSchedule[day]
    acc[day] = VALID_DAY_MODES.has(candidate) ? candidate : DEFAULT_SCHEDULE[day]
    return acc
  }, {})

  const categories = Array.isArray(settings.categories)
    ? [...new Set(settings.categories.map(normalizeCategory).filter(Boolean))]
    : []

  const sourceOverrides = settings.locationOverrides && typeof settings.locationOverrides === 'object'
    ? settings.locationOverrides
    : readLegacyOverrides()

  const locationOverrides = Object.entries(sourceOverrides).reduce((acc, [date, location]) => {
    if (VALID_LOCATIONS.has(location)) acc[date] = location
    return acc
  }, {})

  const legacyLastLocation = localStorage.getItem(LEGACY_WORK_LOCATION_KEY)
  const lastLocation = VALID_LOCATIONS.has(settings.lastLocation)
    ? settings.lastLocation
    : VALID_LOCATIONS.has(legacyLastLocation)
      ? legacyLastLocation
      : 'home'

  const legacyDailyMinimum = Number(localStorage.getItem(LEGACY_DAILY_MINIMUM_KEY)) || 0
  const timezone = typeof settings.timezone === 'string' && settings.timezone.trim()
    ? settings.timezone.trim()
    : Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent'

  const dailyMinimum = Math.max(
    0,
    Number(
      typeof settings.dailyMinimum === 'undefined'
        ? legacyDailyMinimum
        : settings.dailyMinimum,
    ) || 0,
  )

  return {
    categories,
    schedule,
    locationOverrides,
    lastLocation,
    dailyMinimum,
    timezone,
    // Kept only as a local convenience cache for the current manager URL.
    // Supabase stores only a hash of the public token.
    managerAccessToken: typeof settings.managerAccessToken === 'string' ? settings.managerAccessToken : '',
  }
}

export const getSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return normalizeSettings()
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return normalizeSettings()
  }
}

export const hydrateSettingsCache = (settings) => {
  const current = getSettings()
  const normalized = normalizeSettings({ ...current, ...settings })
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized))
  localStorage.setItem(LEGACY_WORK_LOCATION_KEY, normalized.lastLocation)
  localStorage.setItem(LEGACY_WORK_LOCATION_OVERRIDES_KEY, JSON.stringify(normalized.locationOverrides))
  localStorage.setItem(LEGACY_DAILY_MINIMUM_KEY, String(normalized.dailyMinimum))
  return normalized
}

export const saveSettings = (settings) => {
  const normalized = hydrateSettingsCache(settings)
  queueSettingsSync(normalized)
  return normalized
}

export const syncCategoriesFromTasks = (tasks = []) => {
  const settings = getSettings()
  const discovered = tasks
    .map((task) => normalizeCategory(task?.category))
    .filter(Boolean)

  const categories = [...new Set([...settings.categories, ...discovered])]

  if (categories.length !== settings.categories.length) {
    return saveSettings({ ...settings, categories }).categories
  }

  return settings.categories
}

export const addCategory = (name) => {
  const normalizedName = normalizeCategory(name)
  const settings = getSettings()

  if (!normalizedName) return settings.categories

  const exists = settings.categories.some(
    (category) => category.toLocaleLowerCase('ru-RU') === normalizedName.toLocaleLowerCase('ru-RU'),
  )

  if (exists) return settings.categories

  return saveSettings({
    ...settings,
    categories: [...settings.categories, normalizedName],
  }).categories
}

export const removeCategory = (name) => {
  const settings = getSettings()
  const target = normalizeCategory(name).toLocaleLowerCase('ru-RU')

  return saveSettings({
    ...settings,
    categories: settings.categories.filter(
      (category) => category.toLocaleLowerCase('ru-RU') !== target,
    ),
  }).categories
}

export const updateSchedule = (schedule) => {
  const settings = getSettings()
  return saveSettings({ ...settings, schedule }).schedule
}

export const getScheduleModeForDate = (date = new Date()) => {
  const day = new Date(date).getDay()
  return getSettings().schedule[day] || DEFAULT_SCHEDULE[day] || 'off'
}

export const getDefaultLocationForDate = (date = new Date()) => {
  const mode = getScheduleModeForDate(date)
  return mode === 'home' || mode === 'office' ? mode : null
}

const localDateKey = (date = new Date()) => {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getLocationOverrideForDate = (date = new Date()) =>
  getSettings().locationOverrides[localDateKey(date)] || null

export const saveLocationOverride = (location, date = new Date()) => {
  const normalizedLocation = VALID_LOCATIONS.has(location) ? location : 'home'
  const settings = getSettings()
  const locationOverrides = {
    ...settings.locationOverrides,
    [localDateKey(date)]: normalizedLocation,
  }

  saveSettings({
    ...settings,
    locationOverrides,
    lastLocation: normalizedLocation,
  })

  return normalizedLocation
}

export const getLastLocation = () => getSettings().lastLocation || 'home'

export const getDailyMinimum = () => Math.max(0, Number(getSettings().dailyMinimum) || 0)

export const updateDailyMinimum = (value) => {
  const settings = getSettings()
  const dailyMinimum = Math.max(0, Number(value) || 0)
  saveSettings({ ...settings, dailyMinimum })
  return dailyMinimum
}

export const cacheManagerAccessToken = (token) => {
  const settings = getSettings()
  return hydrateSettingsCache({ ...settings, managerAccessToken: token || '' }).managerAccessToken
}

export const getCachedManagerAccessToken = () => getSettings().managerAccessToken || ''

export const clearCachedManagerAccessToken = () => cacheManagerAccessToken('')
