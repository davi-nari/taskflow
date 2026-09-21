<template>
  <div class="manager-public-root min-h-screen bg-[#0B0B0B] text-white">
    <div v-if="loading" class="grid min-h-screen place-items-center px-6">
      <div class="text-sm text-gray-500">Загрузка отчёта...</div>
    </div>

    <div v-else-if="!authorized" class="grid min-h-screen place-items-center px-6">
      <div class="w-full max-w-lg rounded-2xl border border-[#303030] bg-[#141414] p-8 text-center">
        <div class="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-400">
          <ShieldX class="h-5 w-5" />
        </div>
        <h1 class="text-xl font-semibold">Ссылка недействительна</h1>
        <p class="mt-3 text-sm leading-6 text-gray-500">
          Доступ мог быть перевыпущен владельцем TaskFlow. Попросите актуальную ссылку.
        </p>
      </div>
    </div>

    <template v-else>
      <header class="border-b border-[#242424] bg-[#0F0F0F]">
        <div class="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-10">
          <div>
            <div class="flex items-center gap-3">
              <div class="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-bold text-black">TF</div>
              <div>
                <h1 class="text-lg font-semibold">TaskFlow · Work progress</h1>
                <p class="mt-0.5 text-xs text-gray-600">Read-only отчёт для руководителя</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            Данные обновляются автоматически
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-[1480px] px-6 py-8 lg:px-10 lg:py-10">
        <section class="mb-8 overflow-hidden rounded-2xl border border-[#303030] bg-[#141414]">
          <div class="grid gap-0 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.7fr)]">
            <div class="p-6 lg:p-8">
              <div class="mb-5 flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">Сегодня</span>
                <span class="rounded-full bg-[#222] px-3 py-1 text-xs text-gray-400">{{ todayLocationLabel }}</span>
              </div>

              <template v-if="activeTask">
                <div class="text-xs font-medium uppercase tracking-[0.14em] text-gray-600">Текущая задача</div>
                <h2 class="mt-2 text-2xl font-semibold leading-tight text-white lg:text-3xl">{{ activeTask.title }}</h2>
                <div class="mt-4 flex flex-wrap gap-2">
                  <span v-if="activeTask.category" class="rounded-full border border-[#343434] px-3 py-1 text-xs text-gray-400">
                    {{ activeTask.category }}
                  </span>
                  <span
                    v-for="type in activeTask.types"
                    :key="type"
                    class="rounded-full border border-[#343434] px-3 py-1 text-xs text-gray-400"
                  >
                    {{ typeLabel(type) }}
                  </span>
                </div>

                <div class="mt-7 grid gap-3 sm:grid-cols-3">
                  <div class="rounded-xl bg-[#0E0E0E] p-4">
                    <div class="text-xs text-gray-600">Сделано сегодня</div>
                    <div class="mt-2 text-2xl font-semibold">{{ activeTaskTodayUnits }}</div>
                    <div class="mt-1 text-xs text-gray-600">единиц</div>
                  </div>
                  <div class="rounded-xl bg-[#0E0E0E] p-4">
                    <div class="text-xs text-gray-600">Прогресс задачи</div>
                    <div class="mt-2 text-2xl font-semibold">{{ activeTaskAllUnits }}</div>
                    <div class="mt-1 text-xs text-gray-600">{{ activeTaskPlanLabel }}</div>
                  </div>
                  <div class="rounded-xl bg-[#0E0E0E] p-4">
                    <div class="text-xs text-gray-600">Среднее в день по похожей работе</div>
                    <div class="mt-2 text-2xl font-semibold">{{ similarTaskAverage }}</div>
                    <div class="mt-1 text-xs text-gray-600">единиц / активный день · 30 дней</div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="text-xs font-medium uppercase tracking-[0.14em] text-gray-600">Текущая задача</div>
                <h2 class="mt-2 text-2xl font-semibold text-gray-300">Сейчас нет активной задачи</h2>
                <p class="mt-3 max-w-xl text-sm leading-6 text-gray-600">
                  Здесь автоматически появится задача, как только она будет переведена в статус «В работе».
                </p>
              </template>
            </div>

            <div class="border-t border-[#2B2B2B] bg-[#101010] p-6 lg:p-8 xl:border-l xl:border-t-0">
              <div class="text-sm font-medium text-gray-300">Результат за сегодня</div>
              <div class="mt-5 grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-[#292929] bg-[#141414] p-4">
                  <div class="text-2xl font-semibold">{{ todayUnits }}</div>
                  <div class="mt-1 text-xs text-gray-600">единиц</div>
                </div>
                <div class="rounded-xl border border-[#292929] bg-[#141414] p-4">
                  <div class="text-2xl font-semibold">{{ todayCompletedTasks }}</div>
                  <div class="mt-1 text-xs text-gray-600">задач завершено</div>
                </div>
              </div>

              <div class="mt-5 space-y-3">
                <div v-for="row in todayTypeRows" :key="row.type" class="flex items-center justify-between gap-4 text-sm">
                  <span class="text-gray-500">{{ row.label }}</span>
                  <span class="font-medium text-gray-200">{{ row.total }}</span>
                </div>
                <div v-if="!todayTypeRows.length" class="text-sm text-gray-600">Действий за сегодня пока нет.</div>
              </div>
            </div>
          </div>
        </section>

        <section class="mb-8 rounded-2xl border border-[#303030] bg-[#141414] p-5">
          <div class="mb-5 flex flex-wrap gap-2">
            <button
              v-for="preset in presets"
              :key="preset.value"
              type="button"
              :class="[
                'rounded-lg px-3.5 py-2 text-xs font-medium transition',
                filters.preset === preset.value
                  ? 'bg-white text-black'
                  : 'bg-[#202020] text-gray-400 hover:bg-[#292929] hover:text-white',
              ]"
              @click="filters.preset = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div v-if="filters.preset === 'custom'" class="grid grid-cols-2 gap-2 xl:col-span-2">
              <label>
                <span class="mb-2 block text-xs text-gray-600">С</span>
                <input v-model="filters.from" type="date" class="manager-input" />
              </label>
              <label>
                <span class="mb-2 block text-xs text-gray-600">По</span>
                <input v-model="filters.to" type="date" class="manager-input" />
              </label>
            </div>

            <label>
              <span class="mb-2 block text-xs text-gray-600">Тип</span>
              <select v-model="filters.type" class="manager-input">
                <option value="all">Все типы</option>
                <option v-for="type in typeOptions" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </label>

            <label>
              <span class="mb-2 block text-xs text-gray-600">Действие</span>
              <select v-model="filters.operation" class="manager-input">
                <option value="all">Все действия</option>
                <option value="create">Создание</option>
                <option value="add">Добавление</option>
                <option value="edit">Редактирование</option>
              </select>
            </label>

            <label>
              <span class="mb-2 block text-xs text-gray-600">Категория</span>
              <select v-model="filters.category" class="manager-input">
                <option value="all">Все категории</option>
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
              </select>
            </label>

            <label>
              <span class="mb-2 block text-xs text-gray-600">Место</span>
              <select v-model="filters.location" class="manager-input">
                <option value="all">Дом + офис</option>
                <option value="office">Офис</option>
                <option value="home">Дом</option>
              </select>
            </label>
          </div>
        </section>

        <section class="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="manager-metric">
            <div class="manager-metric-label">Сделано за период</div>
            <div class="manager-metric-value">{{ filteredUnits }}</div>
            <div class="manager-metric-hint">единиц работы</div>
          </div>
          <div class="manager-metric">
            <div class="manager-metric-label">Завершено задач</div>
            <div class="manager-metric-value">{{ filteredCompletedTasks.length }}</div>
            <div class="manager-metric-hint">по дате завершения</div>
          </div>
          <div class="manager-metric">
            <div class="manager-metric-label">Среднее / активный день</div>
            <div class="manager-metric-value">{{ averagePerActiveDay }}</div>
            <div class="manager-metric-hint">единиц в день с результатом</div>
          </div>
          <div class="manager-metric">
            <div class="manager-metric-label">Дней с результатом</div>
            <div class="manager-metric-value">{{ activeDays }}</div>
            <div class="manager-metric-hint">в выбранном периоде</div>
          </div>
        </section>

        <section class="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
          <div class="rounded-2xl border border-[#303030] bg-[#141414] p-5 lg:p-6">
            <div class="mb-4">
              <h2 class="text-lg font-semibold">Динамика результата</h2>
              <p class="mt-1 text-sm text-gray-600">Количество выполненных единиц по дням. Без учёта рабочего времени.</p>
            </div>
            <TrendChart :points="trendPoints" title="Output" :value-formatter="formatUnitsTooltip" />
          </div>

          <div class="rounded-2xl border border-[#303030] bg-[#141414] p-5 lg:p-6">
            <h2 class="text-lg font-semibold">По типам</h2>
            <p class="mt-1 text-sm text-gray-600">Результат и среднее за активный день.</p>
            <div class="mt-5 space-y-4">
              <div v-for="row in filteredTypeRows" :key="row.type" class="rounded-xl border border-[#292929] bg-[#101010] p-4">
                <div class="flex items-center justify-between gap-4">
                  <span class="text-sm font-medium text-gray-300">{{ row.label }}</span>
                  <span class="text-lg font-semibold">{{ row.total }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between gap-4 text-xs text-gray-600">
                  <span>Среднее / день</span>
                  <span>{{ formatDecimal(row.average) }}</span>
                </div>
                <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#252525] pt-3 text-[11px] text-gray-600">
                  <span>Созд.: {{ row.create }}</span>
                  <span>Доб.: {{ row.add }}</span>
                  <span>Ред.: {{ row.edit }}</span>
                </div>
              </div>
              <div v-if="!filteredTypeRows.length" class="py-10 text-center text-sm text-gray-600">Нет данных за период.</div>
            </div>
          </div>
        </section>

        <section class="mb-8 rounded-2xl border border-[#303030] bg-[#141414]">
          <div class="flex flex-wrap items-end justify-between gap-4 border-b border-[#292929] p-5 lg:p-6">
            <div>
              <h2 class="text-lg font-semibold">Ссылки на выполненную работу</h2>
              <p class="mt-1 text-sm text-gray-600">Каждое действие можно открыть и проверить.</p>
            </div>
            <div class="text-xs text-gray-600">{{ filteredActions.length }} ссылок</div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[940px] text-left text-sm">
              <thead class="bg-[#101010] text-xs text-gray-600">
                <tr>
                  <th class="px-5 py-3 font-medium">Дата</th>
                  <th class="px-5 py-3 font-medium">Задача</th>
                  <th class="px-5 py-3 font-medium">Тип</th>
                  <th class="px-5 py-3 font-medium">Действие</th>
                  <th class="px-5 py-3 font-medium">Результат</th>
                  <th class="px-5 py-3 text-right font-medium">Ссылка</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="action in paginatedEvidence" :key="`${action.taskId}-${action.id}`" class="border-t border-[#292929]">
                  <td class="whitespace-nowrap px-5 py-4 text-gray-600">{{ formatDate(action.createdAt) }}</td>
                  <td class="max-w-[280px] px-5 py-4 text-gray-300">
                    <div class="truncate" :title="action.taskTitle">{{ action.taskTitle }}</div>
                    <div v-if="action.category" class="mt-1 truncate text-xs text-gray-600">{{ action.category }}</div>
                  </td>
                  <td class="px-5 py-4 text-gray-400">{{ typeLabel(action.type) }}</td>
                  <td class="px-5 py-4 text-gray-400">{{ actionLabel(action.action) }}</td>
                  <td class="max-w-[260px] px-5 py-4 text-gray-500">
                    <div class="truncate" :title="action.pageTitle || action.url">{{ action.pageTitle || 'Выполненное действие' }}</div>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <a
                      :href="action.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 rounded-lg border border-[#343434] px-3 py-2 text-xs text-blue-300 transition hover:border-blue-500/50 hover:bg-blue-500/5"
                    >
                      Открыть
                      <ExternalLink class="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
                <tr v-if="!paginatedEvidence.length">
                  <td colspan="6" class="px-5 py-12 text-center text-sm text-gray-600">Нет ссылок по выбранным фильтрам.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="evidencePages > 1" class="flex items-center justify-between gap-4 border-t border-[#292929] px-5 py-4">
            <div class="text-xs text-gray-600">Страница {{ evidencePage }} из {{ evidencePages }}</div>
            <div class="flex gap-2">
              <button
                type="button"
                :disabled="evidencePage === 1"
                class="manager-page-button"
                @click="evidencePage -= 1"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button
                type="button"
                :disabled="evidencePage === evidencePages"
                class="manager-page-button"
                @click="evidencePage += 1"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-[#303030] bg-[#141414]">
          <div class="border-b border-[#292929] p-5 lg:p-6">
            <h2 class="text-lg font-semibold">Завершённые задачи</h2>
            <p class="mt-1 text-sm text-gray-600">Итог по задачам, закрытым в выбранном периоде.</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] text-left text-sm">
              <thead class="bg-[#101010] text-xs text-gray-600">
                <tr>
                  <th class="px-5 py-3 font-medium">Задача</th>
                  <th class="px-5 py-3 font-medium">Категория</th>
                  <th class="px-5 py-3 font-medium">Типы</th>
                  <th class="px-5 py-3 text-right font-medium">Результат</th>
                  <th class="px-5 py-3 text-right font-medium">Завершена</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in filteredCompletedTasks" :key="task.id" class="border-t border-[#292929]">
                  <td class="px-5 py-4 text-gray-300">{{ task.title }}</td>
                  <td class="px-5 py-4 text-gray-500">{{ task.category || 'Без категории' }}</td>
                  <td class="px-5 py-4 text-gray-500">{{ task.types.map(typeLabel).join(', ') }}</td>
                  <td class="px-5 py-4 text-right font-medium text-gray-200">{{ task.filteredUnits }}</td>
                  <td class="px-5 py-4 text-right text-gray-600">{{ formatDate(task.completedAt) }}</td>
                </tr>
                <tr v-if="!filteredCompletedTasks.length">
                  <td colspan="5" class="px-5 py-12 text-center text-sm text-gray-600">Нет завершённых задач за период.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, ExternalLink, ShieldX } from '@lucide/vue'
import TrendChart from '@/components/analytics/TrendChart.vue'
import { loadManagerSnapshot } from '@/data/managerDataSource'

const EVIDENCE_PAGE_SIZE = 25

const route = useRoute()
const loading = ref(true)
const authorized = ref(false)
const tasks = ref([])
const settings = ref({ categories: [], schedule: {} })
const todayLocation = ref(null)
const evidencePage = ref(1)
let refreshTimer = null
let previousBodyPadding = ''

const typeOptions = [
  { value: 'attribute', label: 'Атрибуты' },
  { value: 'product', label: 'Карточки' },
  { value: 'description', label: 'Описание' },
  { value: 'page', label: 'Страницы' },
]

const presets = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'month', label: 'Этот месяц' },
  { value: 'custom', label: 'Свой период' },
]

const filters = reactive({
  preset: '7d',
  from: toDateInput(new Date()),
  to: toDateInput(new Date()),
  type: 'all',
  operation: 'all',
  category: 'all',
  location: 'all',
})

const categories = computed(() => [...new Set([
  ...(settings.value?.categories || []),
  ...tasks.value.map((task) => String(task.category || '').trim()).filter(Boolean),
])])
const activeTask = computed(() => tasks.value.find((task) => task.status === 'progress') || null)
const range = computed(() => resolveRange(filters.preset, filters.from, filters.to))

const allActions = computed(() => {
  const rows = []
  tasks.value.forEach((task) => {
    ;(task.actions || []).forEach((action) => {
      rows.push({
        ...action,
        taskId: task.id,
        taskTitle: task.title,
        category: task.category || '',
        taskTypes: task.types || [],
      })
    })
  })
  return rows
})

const filteredActions = computed(() => allActions.value
  .filter((action) => {
    const time = new Date(action.createdAt).getTime()
    if (!Number.isFinite(time) || time < range.value.startMs || time > range.value.endMs) return false
    if (filters.type !== 'all' && action.type !== filters.type) return false
    if (filters.operation !== 'all' && action.action !== filters.operation) return false
    if (filters.category !== 'all' && action.category !== filters.category) return false
    if (filters.location !== 'all' && action.location !== filters.location) return false
    return true
  })
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))

const filteredUnits = computed(() => filteredActions.value.reduce((sum, action) => sum + (Number(action.units) || 1), 0))
const activeDayKeys = computed(() => new Set(filteredActions.value.map((action) => localDateKey(action.createdAt))))
const activeDays = computed(() => activeDayKeys.value.size)
const averagePerActiveDay = computed(() => activeDays.value ? formatDecimal(filteredUnits.value / activeDays.value) : '0')

const filteredCompletedTasks = computed(() => tasks.value
  .filter((task) => {
    if (!task.completedAt) return false
    const time = new Date(task.completedAt).getTime()
    if (!Number.isFinite(time) || time < range.value.startMs || time > range.value.endMs) return false
    if (filters.category !== 'all' && task.category !== filters.category) return false
    if (filters.type !== 'all' && !(task.types || []).includes(filters.type)) return false
    return true
  })
  .map((task) => {
    const actions = (task.actions || []).filter((action) => {
      if (filters.type !== 'all' && action.type !== filters.type) return false
      if (filters.operation !== 'all' && action.action !== filters.operation) return false
      if (filters.location !== 'all' && action.location !== filters.location) return false
      return true
    })
    return {
      ...task,
      filteredUnits: actions.reduce((sum, action) => sum + (Number(action.units) || 1), 0),
    }
  })
  .filter((task) => {
    if (filters.operation !== 'all' || filters.location !== 'all') return task.filteredUnits > 0
    return true
  })
  .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)))

const filteredTypeRows = computed(() => typeOptions.map((type) => {
  const actions = filteredActions.value.filter((action) => action.type === type.value)
  const days = new Set(actions.map((action) => localDateKey(action.createdAt))).size
  const total = actions.reduce((sum, action) => sum + (Number(action.units) || 1), 0)
  const counts = actions.reduce((acc, action) => {
    if (Object.prototype.hasOwnProperty.call(acc, action.action)) acc[action.action] += Number(action.units) || 1
    return acc
  }, { create: 0, add: 0, edit: 0 })
  return { ...type, type: type.value, total, average: days ? total / days : 0, ...counts }
}).filter((row) => row.total > 0))

const trendPoints = computed(() => {
  const byDay = new Map()
  filteredActions.value.forEach((action) => {
    const key = localDateKey(action.createdAt)
    byDay.set(key, (byDay.get(key) || 0) + (Number(action.units) || 1))
  })

  const days = []
  const cursor = new Date(range.value.start)
  const end = new Date(range.value.end)
  while (cursor <= end && days.length < 370) {
    const key = localDateKey(cursor)
    days.push({
      key,
      label: new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(cursor),
      value: byDay.get(key) || 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
})

const todayRange = computed(() => resolveRange('today'))
const todayActions = computed(() => allActions.value.filter((action) => {
  const time = new Date(action.createdAt).getTime()
  return Number.isFinite(time) && time >= todayRange.value.startMs && time <= todayRange.value.endMs
}))
const todayUnits = computed(() => todayActions.value.reduce((sum, action) => sum + (Number(action.units) || 1), 0))
const todayCompletedTasks = computed(() => tasks.value.filter((task) => {
  const time = new Date(task.completedAt || '').getTime()
  return Number.isFinite(time) && time >= todayRange.value.startMs && time <= todayRange.value.endMs
}).length)
const todayTypeRows = computed(() => typeOptions.map((type) => ({
  ...type,
  type: type.value,
  total: todayActions.value.filter((action) => action.type === type.value).reduce((sum, action) => sum + (Number(action.units) || 1), 0),
})).filter((row) => row.total > 0))

const activeTaskTodayUnits = computed(() => {
  if (!activeTask.value) return 0
  return todayActions.value
    .filter((action) => action.taskId === activeTask.value.id)
    .reduce((sum, action) => sum + (Number(action.units) || 1), 0)
})
const activeTaskAllUnits = computed(() => (activeTask.value?.actions || []).reduce((sum, action) => sum + (Number(action.units) || 1), 0))
const activeTaskPlanUnits = computed(() => {
  if (!activeTask.value) return 0
  return Object.values(activeTask.value.planByType || {}).reduce((sum, plan) => sum + (Number(plan?.units) || 0), 0)
})
const activeTaskPlanLabel = computed(() => activeTaskPlanUnits.value ? `из ${activeTaskPlanUnits.value} по плану` : 'единиц в задаче')

const similarTaskAverage = computed(() => {
  if (!activeTask.value) return '0'
  const threshold = Date.now() - 30 * 86400000
  const activeTypes = new Set(activeTask.value.types || [])
  const matchingActions = []

  tasks.value.forEach((task) => {
    if (activeTask.value.category && task.category !== activeTask.value.category) return

    ;(task.actions || []).forEach((action) => {
      const actionTime = new Date(action.createdAt).getTime()
      if (!Number.isFinite(actionTime) || actionTime < threshold) return
      if (!activeTypes.has(action.type)) return
      matchingActions.push(action)
    })
  })

  if (!matchingActions.length) return '0'
  const days = new Set(matchingActions.map((action) => localDateKey(action.createdAt))).size
  const total = matchingActions.reduce((sum, action) => sum + (Number(action.units) || 1), 0)
  return days ? formatDecimal(total / days) : '0'
})

const todayLocationLabel = computed(() => {
  const latestActionLocation = [...todayActions.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.location
  const mode = todayLocation.value || latestActionLocation || settings.value?.schedule?.[new Date().getDay()] || 'off'
  return { office: 'Сегодня: офис', home: 'Сегодня: дом', off: 'Сегодня: выходной' }[mode] || 'Сегодня'
})

const evidencePages = computed(() => Math.max(1, Math.ceil(filteredActions.value.length / EVIDENCE_PAGE_SIZE)))
const paginatedEvidence = computed(() => {
  const start = (evidencePage.value - 1) * EVIDENCE_PAGE_SIZE
  return filteredActions.value.slice(start, start + EVIDENCE_PAGE_SIZE)
})

watch(
  () => [filters.preset, filters.from, filters.to, filters.type, filters.operation, filters.category, filters.location, filteredActions.value.length],
  () => {
    evidencePage.value = Math.min(evidencePage.value, evidencePages.value)
    if (evidencePage.value < 1) evidencePage.value = 1
  },
)

const refresh = async () => {
  const snapshot = await loadManagerSnapshot(String(route.params.token || ''))
  authorized.value = snapshot.authorized
  tasks.value = snapshot.tasks || []
  settings.value = snapshot.settings || { categories: [], schedule: {} }
  todayLocation.value = snapshot.todayLocation || null
  loading.value = false
}

const handleStorage = () => refresh()

onMounted(() => {
  previousBodyPadding = document.body.style.padding
  document.body.style.padding = '0'
  refresh()
  window.addEventListener('storage', handleStorage)
  refreshTimer = window.setInterval(refresh, 15000)
})

onBeforeUnmount(() => {
  document.body.style.padding = previousBodyPadding
  window.removeEventListener('storage', handleStorage)
  if (refreshTimer) window.clearInterval(refreshTimer)
})

function toDateInput(date) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localDateKey(value) {
  const date = new Date(value)
  return toDateInput(date)
}

function resolveRange(preset, from, to) {
  const now = new Date()
  let start
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (preset === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (preset === '7d') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
  } else if (preset === '30d') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
  } else if (preset === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    const fromDate = from ? new Date(`${from}T00:00:00`) : now
    const toDate = to ? new Date(`${to}T23:59:59.999`) : now
    start = Number.isNaN(fromDate.getTime()) ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : fromDate
    end = Number.isNaN(toDate.getTime()) ? end : toDate
  }

  return { start, end, startMs: start.getTime(), endMs: end.getTime() }
}

function typeLabel(type) {
  return typeOptions.find((item) => item.value === type)?.label || type
}

function actionLabel(action) {
  return { create: 'Создание', add: 'Добавление', edit: 'Редактирование' }[action] || action
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatDecimal(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(Number(value) || 0)
}

function formatUnitsTooltip(value) {
  return `${formatDecimal(value)} ед.`
}
</script>

<style scoped>
.manager-input {
  width: 100%;
  border: 1px solid #353535;
  border-radius: 0.5rem;
  background: #0f0f0f;
  padding: 0.625rem 0.75rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  outline: none;
}

.manager-input:focus {
  border-color: #3b82f6;
}

.manager-metric {
  border: 1px solid #303030;
  border-radius: 1rem;
  background: #141414;
  padding: 1.25rem;
}

.manager-metric-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.manager-metric-value {
  margin-top: 0.5rem;
  font-size: 1.75rem;
  line-height: 2rem;
  font-weight: 600;
}

.manager-metric-hint {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #4b5563;
}

.manager-page-button {
  display: grid;
  height: 2.25rem;
  width: 2.25rem;
  place-items: center;
  border: 1px solid #353535;
  border-radius: 0.5rem;
  color: #9ca3af;
  transition: 150ms ease;
}

.manager-page-button:hover:not(:disabled) {
  border-color: #555;
  color: white;
}

.manager-page-button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
</style>
