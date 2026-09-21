import { isSupabaseConfigured } from '@/data/supabaseApi'
import { createManagerAccessToken, loadPublicManagerSnapshot, rotateManagerAccessTokenRemote } from '@/data/supabaseRepository'
import {
  cacheManagerAccessToken,
  clearCachedManagerAccessToken,
  getCachedManagerAccessToken,
} from '@/utils/settingsStorage'

export const ensureManagerAccessToken = async () => {
  if (!isSupabaseConfigured()) return getCachedManagerAccessToken()

  const cached = getCachedManagerAccessToken()
  if (cached) {
    try {
      const snapshot = await loadPublicManagerSnapshot(cached)
      if (snapshot?.authorized) return cached
    } catch {
      // If validation fails because of a temporary network issue, keep the token
      // instead of revoking a valid link. It can be retried on the next visit.
      return cached
    }
  }

  const token = await createManagerAccessToken()
  cacheManagerAccessToken(token)
  return token
}

export const rotateManagerAccessToken = async () => {
  const token = await rotateManagerAccessTokenRemote()
  cacheManagerAccessToken(token)
  return token
}

export const forgetManagerAccessToken = () => clearCachedManagerAccessToken()
