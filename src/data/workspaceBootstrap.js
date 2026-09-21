import { getSupabaseSession, isSupabaseConfigured } from '@/data/supabaseApi'
import {
  loadWorkspaceFromSupabase,
  resetSupabaseRepositoryCache,
  syncSettingsSnapshot,
  syncTasksSnapshot,
} from '@/data/supabaseRepository'
import { getTasks, hydrateTasksCache } from '@/utils/taskStorage'
import { getSettings, hydrateSettingsCache, normalizeSettings } from '@/utils/settingsStorage'

const CACHE_OWNER_KEY = 'taskflow_cache_owner_v1'
let bootstrapPromise = null
let bootstrappedUserId = null

const clearUserCache = () => {
  hydrateTasksCache([])
  hydrateSettingsCache(normalizeSettings())
}

export const bootstrapWorkspace = async ({ force = false } = {}) => {
  if (!isSupabaseConfigured()) {
    return { authenticated: true, backend: 'local', migrated: false }
  }

  const session = await getSupabaseSession()
  const user = session?.user
  if (!user) return { authenticated: false, backend: 'supabase', migrated: false }

  if (!force && bootstrappedUserId === user.id) {
    return { authenticated: true, backend: 'supabase', migrated: false }
  }

  if (bootstrapPromise && !force) return bootstrapPromise

  bootstrapPromise = (async () => {
    const previousOwner = localStorage.getItem(CACHE_OWNER_KEY)
    const canMigrateLegacyCache = !previousOwner || previousOwner === user.id

    if (previousOwner && previousOwner !== user.id) {
      clearUserCache()
      resetSupabaseRepositoryCache()
    }

    const localTasks = canMigrateLegacyCache ? getTasks() : []
    const localSettings = canMigrateLegacyCache ? getSettings() : normalizeSettings()
    const remote = await loadWorkspaceFromSupabase()
    let migrated = false

    if (remote.tasks.length === 0 && localTasks.length > 0) {
      await syncTasksSnapshot(localTasks)
      migrated = true
    } else {
      hydrateTasksCache(remote.tasks)
    }

    if (remote.settings) {
      hydrateSettingsCache({
        ...remote.settings,
        managerAccessToken: canMigrateLegacyCache ? localSettings.managerAccessToken : '',
      })
    } else {
      await syncSettingsSnapshot(localSettings)
      hydrateSettingsCache(localSettings)
      migrated = migrated || Boolean(localSettings.categories.length)
    }

    localStorage.setItem(CACHE_OWNER_KEY, user.id)
    bootstrappedUserId = user.id

    return { authenticated: true, backend: 'supabase', migrated }
  })()

  try {
    return await bootstrapPromise
  } finally {
    bootstrapPromise = null
  }
}

export const resetWorkspaceBootstrap = () => {
  bootstrappedUserId = null
  bootstrapPromise = null
  resetSupabaseRepositoryCache()
}
