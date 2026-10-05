<template>
  <section class="text-white">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">История времени</h1>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
          Полный журнал начисления рабочего времени. Здесь видно, по какой задаче, типу работы,
          операции и месту была запущена каждая сессия, а также какие действия попали в неё.
        </p>
      </div>
      <div class="text-right text-xs text-gray-600">
        Перерывы отображаются отдельно и в рабочее время не входят.
      </div>
    </div>

    <div class="mb-5 grid gap-3 md:grid-cols-3">
      <div class="rounded-xl border border-[#303030] bg-[#151515] p-4">
        <div class="text-xs text-gray-500">Начислено времени</div>
        <div class="mt-2 text-2xl font-semibold">{{ formatDuration(summary.durationMs) }}</div>
      </div>
      <div class="rounded-xl border border-[#303030] bg-[#151515] p-4">
        <div class="text-xs text-gray-500">Рабочих сессий</div>
        <div class="mt-2 text-2xl font-semibold">{{ summary.sessions }}</div>
      </div>
      <div class="rounded-xl border border-[#303030] bg-[#151515] p-4">
        <div class="text-xs text-gray-500">Действий / единиц</div>
        <div class="mt-2 text-2xl font-semibold">{{ summary.actions }} / {{ formatNumber(summary.units) }}</div>
      </div>
    </div>

    <div class="mb-5 grid gap-3 rounded-xl border border-[#303030] bg-[#151515] p-4 md:grid-cols-2 xl:grid-cols-5">
      <label class="block xl:col-span-2">
        <span class="mb-2 block text-xs text-gray-500">Задача</span>
        <select v-model="filters.taskId" class="history-control">
          <option value="all">Все задачи</option>
          <option v-for="task in taskOptions" :key="task.id" :value="task.id">{{ task.title }}</option>
        </select>
      </label>

      <label class="block">
        <span class="mb-2 block text-xs text-gray-500">Тип работы</span>
        <select v-model="filters.type" class="history-control">
          <option value="all">Все типы</option>
          <option value="attribute">Атрибуты</option>
          <option value="product">Товары</option>
          <option value="description">Описания</option>
          <option value="page">Страницы</option>
          <option value="break">Перерывы</option>
        </select>
      </label>

      <label class="block">
        <span class="mb-2 block text-xs text-gray-500">Место</span>
        <select v-model="filters.location" class="history-control">
          <option value="all">Везде</option>
          <option value="home">Дом</option>
          <option value="office">Офис</option>
        </select>
      </label>

      <label class="block">
        <span class="mb-2 block text-xs text-gray-500">Дата</span>
        <input v-model="filters.date" type="date" class="history-control" />
      </label>
    </div>

    <div class="overflow-hidden rounded-2xl border border-[#303030] bg-[#151515]">
      <div v-if="!paginatedEntries.length" class="px-5 py-12 text-center text-sm text-gray-500">
        По выбранным фильтрам записей времени нет.
      </div>

      <div v-else class="divide-y divide-[#292929]">
        <article v-for="entry in paginatedEntries" :key="entry.id" class="p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span
                  :class="[
                    'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
                    entry.kind === 'break'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-blue-500/10 text-blue-300',
                  ]"
                >
                  {{ entry.kind === 'break' ? 'Перерыв' : 'Рабочая сессия' }}
                </span>
                <span class="text-xs text-gray-600">{{ formatDate(entry.startedAt) }}</span>
                <span v-if="entry.active" class="text-xs font-medium text-emerald-400">идёт сейчас</span>
              </div>

              <h2 class="truncate font-medium" :title="entry.taskTitle">{{ entry.taskTitle }}</h2>

              <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                <span v-if="entry.kind === 'work'">{{ typeLabel(entry.type) }}</span>
                <span v-if="entry.kind === 'work'">{{ actionLabel(entry.operation) }}</span>
                <span v-if="entry.location">{{ locationLabel(entry.location) }}</span>
                <span v-if="entry.kind === 'break'">{{ breakLabel(entry.reason) }}</span>
              </div>

              <div class="mt-3 text-xs text-gray-600">
                {{ formatDateTime(entry.startedAt) }} - {{ entry.endedAt ? formatDateTime(entry.endedAt) : 'сейчас' }}
              </div>
            </div>

            <div class="min-w-[190px] text-right">
              <div class="text-xs text-gray-500">{{ entry.kind === 'break' ? 'Не начисляется' : 'Начислено' }}</div>
              <div :class="['mt-1 text-xl font-semibold', entry.kind === 'break' ? 'text-gray-500' : 'text-white']">
                {{ formatDuration(entry.durationMs) }}
              </div>
              <div v-if="entry.kind === 'work'" class="mt-2 text-xs text-gray-500">
                {{ entry.actionsCount }} действий · {{ formatNumber(entry.units) }} ед.
              </div>
            </div>
          </div>

          <details v-if="entry.kind === 'work' && entry.actions.length" class="mt-4 rounded-lg bg-[#101010] px-4 py-3">
            <summary class="cursor-pointer text-xs text-gray-400">
              Показать действия, вошедшие в эту сессию ({{ entry.actions.length }})
            </summary>
            <div class="mt-3 space-y-2">
              <div v-for="action in entry.actions" :key="action.id" class="flex gap-3 text-xs">
                <span class="w-12 shrink-0 text-gray-600">{{ formatTime(action.createdAt) }}</span>
                <a
                  :href="action.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-w-0 truncate text-gray-300 hover:text-white"
                  :title="action.pageTitle || action.url"
                >
                  {{ action.pageTitle || action.url || 'Действие' }}
                </a>
                <span class="ml-auto shrink-0 text-gray-600">{{ formatNumber(Number(action.units) || 1) }} ед.</span>
              </div>
            </div>
          </details>
        </article>
      </div>

      <div v-if="filteredEntries.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-[#303030] px-5 py-4 text-sm">
        <span class="text-gray-600">
          Показано {{ pageStart + 1 }}-{{ pageEnd }} из {{ filteredEntries.length }}
        </span>
        <div class="flex items-center gap-3">
          <button class="rounded-lg bg-[#222] px-3 py-2 disabled:opacity-40" @click="page -= 1" :disabled="page === 1">Назад</button>
          <span class="text-gray-500">{{ page }} / {{ pages }}</span>
          <button class="rounded-lg bg-[#222] px-3 py-2 disabled:opacity-40" @click="page += 1" :disabled="page === pages">Вперёд</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { getTasks } from '@/utils/taskStorage'

const PAGE_SIZE = 20
const tasks = ref([])
const page = ref(1)
const now = ref(Date.now())
const filters = reactive({
  taskId: 'all',
  type: 'all',
  location: 'all',
  date: '',
})
let clockId = null

const typeLabel = (type) => ({
  attribute: 'Атрибуты',
  product: 'Товары',
  description: 'Описания',
  page: 'Страницы',
}[type] || type || 'Без типа')

const actionLabel = (action) => ({
  create: 'Создание',
  add: 'Добавление',
  edit: 'Редактирование',
}[action] || action || 'Без операции')

const locationLabel = (location) => ({ home: 'Дом', office: 'Офис' }[location] || location || 'Не указано')
const breakLabel = (reason) => ({ break: 'Перерыв', lunch: 'Обед', personal: 'Личное' }[reason] || reason || 'Перерыв')

const timestamp = (value) => {
  const result = new Date(value).getTime()
  return Number.isFinite(result) ? result : null
}

const calcDuration = (item) => {
  if (item.endedAt && item.durationMs !== null && typeof item.durationMs !== 'undefined' && Number.isFinite(Number(item.durationMs))) return Math.max(0, Number(item.durationMs))
  const start = timestamp(item.startedAt)
  const end = timestamp(item.endedAt) ?? now.value
  return start === null ? 0 : Math.max(0, end - start)
}

const locationForBreak = (task, breakItem) => {
  const breakStart = timestamp(breakItem.startedAt)
  if (breakStart === null) return ''

  let location = ''
  let latestStart = -Infinity
  ;(task.workSessions || []).forEach((session) => {
    const sessionStart = timestamp(session.startedAt)
    if (sessionStart === null || sessionStart > breakStart || sessionStart < latestStart) return
    latestStart = sessionStart
    location = session.location || location
  })
  return location
}

const matchingActionsForSession = (task, session) => {
  const actions = Array.isArray(task.actions) ? task.actions : []
  const direct = actions.filter((action) => action.workSessionId && String(action.workSessionId) === String(session.id))
  if (direct.length) return direct

  // Legacy sessions created before workSessionId was stored on actions are reconstructed by
  // timestamp + context. This keeps old history readable without modifying historical rows.
  const start = timestamp(session.startedAt)
  const end = timestamp(session.endedAt) ?? now.value
  if (start === null) return []

  return actions.filter((action) => {
    const at = timestamp(action.createdAt)
    if (at === null || at < start || at > end) return false
    if (session.type && action.type !== session.type) return false
    if (session.operation && (action.action || 'create') !== session.operation) return false
    if (session.location && action.location && action.location !== session.location) return false
    return true
  })
}

const entries = computed(() => {
  const result = []

  tasks.value.forEach((task) => {
    ;(task.workSessions || []).forEach((session) => {
      const actions = matchingActionsForSession(task, session)
      result.push({
        id: `session:${task.id}:${session.id}`,
        kind: 'work',
        taskId: task.id,
        taskTitle: task.title || 'Без названия',
        type: session.type,
        operation: session.operation || 'create',
        location: session.location || '',
        startedAt: session.startedAt,
        endedAt: session.endedAt || null,
        active: !session.endedAt,
        durationMs: calcDuration(session),
        actions,
        actionsCount: actions.length,
        units: actions.reduce((sum, action) => sum + (Number(action.units) || 1), 0),
      })
    })

    ;(task.breaks || []).forEach((item) => {
      result.push({
        id: `break:${task.id}:${item.id}`,
        kind: 'break',
        taskId: task.id,
        taskTitle: task.title || 'Без названия',
        type: 'break',
        reason: item.reason || 'break',
        location: locationForBreak(task, item),
        startedAt: item.startedAt,
        endedAt: item.endedAt || null,
        active: !item.endedAt,
        durationMs: calcDuration(item),
        actions: [],
        actionsCount: 0,
        units: 0,
      })
    })
  })

  return result.sort((a, b) => (timestamp(b.startedAt) || 0) - (timestamp(a.startedAt) || 0))
})

const taskOptions = computed(() => [...tasks.value]
  .filter((task) => task?.id)
  .sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ru')))

const localDateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const filteredEntries = computed(() => entries.value.filter((entry) => {
  if (filters.taskId !== 'all' && entry.taskId !== filters.taskId) return false
  if (filters.type !== 'all' && entry.type !== filters.type) return false
  if (filters.location !== 'all' && entry.location !== filters.location) return false
  if (filters.date && localDateKey(entry.startedAt) !== filters.date) return false
  return true
}))

const pages = computed(() => Math.max(1, Math.ceil(filteredEntries.value.length / PAGE_SIZE)))
const pageStart = computed(() => (page.value - 1) * PAGE_SIZE)
const pageEnd = computed(() => Math.min(filteredEntries.value.length, pageStart.value + PAGE_SIZE))
const paginatedEntries = computed(() => filteredEntries.value.slice(pageStart.value, pageEnd.value))

const summary = computed(() => filteredEntries.value.reduce((acc, entry) => {
  if (entry.kind !== 'work') return acc
  acc.durationMs += entry.durationMs
  acc.sessions += 1
  acc.actions += entry.actionsCount
  acc.units += entry.units
  return acc
}, { durationMs: 0, sessions: 0, actions: 0, units: 0 }))

watch(
  () => [filters.taskId, filters.type, filters.location, filters.date],
  () => { page.value = 1 },
)
watch(pages, (value) => {
  if (page.value > value) page.value = value
})

const formatDate = (value) => new Date(value).toLocaleDateString('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
const formatDateTime = (value) => new Date(value).toLocaleString('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const formatTime = (value) => new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
const formatNumber = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(Number(value) || 0)
const formatDuration = (value) => {
  const totalMinutes = Math.max(0, Math.floor((Number(value) || 0) / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes} мин`
  if (!minutes) return `${hours} ч`
  return `${hours} ч ${minutes} мин`
}

onMounted(() => {
  tasks.value = getTasks()
  clockId = window.setInterval(() => { now.value = Date.now() }, 60_000)
})

onBeforeUnmount(() => {
  if (clockId) window.clearInterval(clockId)
})
</script>

<style scoped>
.history-control {
  width: 100%;
  border: 1px solid #333;
  border-radius: 0.5rem;
  background: #101010;
  padding: 0.7rem 0.8rem;
  color: white;
  font-size: 0.875rem;
  outline: none;
}
.history-control:focus {
  border-color: #555;
}
</style>
