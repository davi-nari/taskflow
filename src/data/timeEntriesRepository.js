import { getCurrentUser, restDelete, restSelect, restUpsert } from '@/data/supabaseApi'

const TABLE = 'taskflow_time_entries'

export async function getTimeEntries(page = 1, size = 10) {
  const user = await getCurrentUser()
  if (!user) return []
  const rows = await restSelect(TABLE, `select=*&user_id=eq.${user.id}&order=started_at.desc`)
  const start = (page - 1) * size
  return (rows || []).slice(start, start + size)
}

export async function deleteTimeEntry(id) {
  return restDelete(TABLE, `id=eq.${id}`)
}

export async function createTimeEntry(entry) {
  const user = await getCurrentUser()
  if (!user) return null
  return restUpsert(TABLE, [{ ...entry, user_id: user.id }])
}
