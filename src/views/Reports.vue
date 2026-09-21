<template>
  <section class="report-page min-h-full w-full text-white">
    <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Отчёт</h1>
        <p class="mt-2 text-sm text-gray-500">
          Готовый отчёт для руководителя: результат, время и ссылки на выполненную работу.
        </p>
      </div>

      <div class="report-actions flex flex-wrap gap-2">
        <button type="button" class="report-secondary" @click="copyReport">
          <Copy class="h-4 w-4" />
          {{ copied ? 'Скопировано' : 'Копировать' }}
        </button>
        <button type="button" class="report-secondary" @click="exportCsv">
          <Download class="h-4 w-4" />
          CSV
        </button>
        <button type="button" class="report-primary" @click="printReport">
          <Printer class="h-4 w-4" />
          PDF / Печать
        </button>
      </div>
    </div>

    <div class="report-filters mb-8 rounded-2xl border border-[#303030] bg-[#151515] p-5">
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
          @click="setPreset(preset.value)"
        >
          {{ preset.label }}
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        <div v-if="filters.preset === 'custom'" class="grid grid-cols-2 gap-2 lg:col-span-2">
          <label>
            <span class="mb-2 block text-xs text-gray-500">С</span>
            <input v-model="filters.from" type="date" class="report-input" />
          </label>
          <label>
            <span class="mb-2 block text-xs text-gray-500">По</span>
            <input v-model="filters.to" type="date" class="report-input" />
          </label>
        </div>

        <label>
          <span class="mb-2 block text-xs text-gray-500">Тип</span>
          <select v-model="filters.type" class="report-input">
            <option value="all">Все типы</option>
            <option v-for="type in typeOptions" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
        </label>

        <label>
          <span class="mb-2 block text-xs text-gray-500">Категория</span>
          <select v-model="filters.category" class="report-input">
            <option value="all">Все категории</option>
            <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>

        <label>
          <span class="mb-2 block text-xs text-gray-500">Место</span>
          <select v-model="filters.location" class="report-input">
            <option value="all">Дом + офис</option>
            <option value="office">Офис</option>
            <option value="home">Дом</option>
          </select>
        </label>

        <label>
          <span class="mb-2 block text-xs text-gray-500">Сортировка</span>
          <select v-model="filters.sort" class="report-input">
            <option value="type">По типу</option>
            <option value="total">По объёму</option>
            <option value="time">По времени</option>
            <option value="rate">По производительности</option>
          </select>
        </label>
      </div>
    </div>

    <div class="report-sheet rounded-2xl border border-[#303030] bg-[#151515] p-6">
      <div class="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-[#2B2B2B] pb-6">
        <div>
          <div class="text-xs font-medium uppercase tracking-[0.14em] text-gray-600">TaskFlow work report</div>
          <h2 class="mt-2 text-2xl font-semibold">{{ rangeLabel }}</h2>
          <p class="mt-2 text-sm text-gray-500">Сформировано {{ generatedAtLabel }}</p>
        </div>
        <div class="rounded-xl border border-[#2E2E2E] bg-[#101010] px-4 py-3 text-right text-xs text-gray-500">
          <div>Категория: <span class="text-gray-300">{{ selectedCategoryLabel }}</span></div>
          <div class="mt-1">Место: <span class="text-gray-300">{{ selectedLocationLabel }}</span></div>
        </div>
      </div>

      <div class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Выполнено" :value="`${formatNumber(totalUnits)} ед.`" hint="действий за период" />
        <MetricCard label="Завершено задач" :value="String(completedTasks.length)" hint="по дате завершения" />
        <MetricCard label="Рабочее время" :value="formatDuration(totalWorkMs)" hint="без пауз" />
        <MetricCard label="Ссылки-доказательства" :value="String(filteredActions.length)" hint="каждая ссылка кликабельна" />
      </div>

      <div class="mb-8">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold">Что сделано</h3>
            <p class="mt-1 text-sm text-gray-600">Итог сгруппирован по типу работы.</p>
          </div>
          <div class="text-xs text-gray-600">Нажмите на ссылки, чтобы раскрыть доказательства</div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-[#343434]">
          <table class="w-full min-w-[960px] text-left text-sm">
            <thead class="bg-[#101010] text-xs text-gray-600">
              <tr>
                <th class="px-4 py-3 font-medium">Тип</th>
                <th class="px-4 py-3 text-right font-medium">Создание</th>
                <th class="px-4 py-3 text-right font-medium">Добавление</th>
                <th class="px-4 py-3 text-right font-medium">Редактирование</th>
                <th class="px-4 py-3 text-right font-medium">Всего</th>
                <th class="px-4 py-3 text-right font-medium">Время</th>
                <th class="px-4 py-3 text-right font-medium">Ед/ч</th>
                <th class="px-4 py-3 font-medium">Доказательства</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in sortedTypeRows" :key="row.type">
                <tr class="border-t border-[#2D2D2D]">
                  <td class="px-4 py-4">
                    <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-medium', typeStyle(row.type)]">
                      {{ row.label }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-right text-gray-300">{{ row.create }}</td>
                  <td class="px-4 py-4 text-right text-gray-300">{{ row.add }}</td>
                  <td class="px-4 py-4 text-right text-gray-300">{{ row.edit }}</td>
                  <td class="px-4 py-4 text-right font-semibold text-white">{{ row.total }}</td>
                  <td class="px-4 py-4 text-right text-gray-300">{{ formatDuration(row.workMs) }}</td>
                  <td class="px-4 py-4 text-right text-gray-300">{{ row.rate ? formatDecimal(row.rate) : '-' }}</td>
                  <td class="px-4 py-4">
                    <button
                      v-if="row.evidence.length"
                      type="button"
                      class="inline-flex items-center gap-2 rounded-lg border border-[#343434] bg-[#181818] px-3 py-2 text-xs text-blue-300 transition hover:border-blue-500/50 hover:bg-blue-500/10"
                      @click="toggleEvidence(row.type)"
                    >
                      <Link2 class="h-3.5 w-3.5" />
                      {{ row.evidence.length }} ссылок
                      <ChevronDown :class="['h-3.5 w-3.5 transition', expandedTypes.has(row.type) ? 'rotate-180' : '']" />
                    </button>
                    <span v-else class="text-xs text-gray-600">Нет ссылок</span>
                  </td>
                </tr>
                <tr v-if="expandedTypes.has(row.type)" class="border-t border-[#262626] bg-[#101010]">
                  <td colspan="8" class="px-5 py-5">
                    <div class="grid gap-2">
                      <a
                        v-for="(item, index) in row.evidence"
                        :key="`${row.type}-${item.id}-${index}`"
                        :href="item.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group grid gap-3 rounded-lg border border-[#292929] bg-[#151515] px-4 py-3 transition hover:border-[#3D4B66] md:grid-cols-[42px_minmax(180px,0.8fr)_minmax(260px,1.5fr)_120px]"
                      >
                        <span class="text-xs text-gray-600">{{ index + 1 }}</span>
                        <span class="min-w-0 truncate text-xs text-gray-400" :title="item.pageTitle || item.taskTitle">
                          {{ actionLabel(item.action) }} · {{ item.pageTitle || item.taskTitle }}
                        </span>
                        <span class="min-w-0 truncate text-sm text-blue-400 group-hover:underline">{{ item.url }}</span>
                        <span class="text-right text-xs text-gray-600">{{ formatDateTime(item.createdAt) }}</span>
                      </a>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="!sortedTypeRows.length" class="border-t border-[#2D2D2D]">
                <td colspan="8" class="px-4 py-12 text-center text-sm text-gray-600">
                  За выбранный период нет выполненных действий.
                </td>
              </tr>
            </tbody>
            <tfoot v-if="sortedTypeRows.length" class="border-t border-[#444] bg-[#101010]">
              <tr>
                <td class="px-4 py-4 font-semibold text-white">Итого</td>
                <td class="px-4 py-4 text-right text-gray-300">{{ operationTotals.create }}</td>
                <td class="px-4 py-4 text-right text-gray-300">{{ operationTotals.add }}</td>
                <td class="px-4 py-4 text-right text-gray-300">{{ operationTotals.edit }}</td>
                <td class="px-4 py-4 text-right font-semibold text-white">{{ totalUnits }}</td>
                <td class="px-4 py-4 text-right text-gray-300">{{ formatDuration(totalWorkMs) }}</td>
                <td class="px-4 py-4 text-right text-gray-300">{{ totalRate ? formatDecimal(totalRate) : '-' }}</td>
                <td class="px-4 py-4 text-xs text-gray-500">{{ filteredActions.length }} ссылок</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div>
        <div class="mb-4">
          <h3 class="text-lg font-semibold">Завершённые задачи</h3>
          <p class="mt-1 text-sm text-gray-600">Задачи, закрытые в выбранном периоде.</p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-[#343434]">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-[#101010] text-xs text-gray-600">
              <tr>
                <th class="px-4 py-3 font-medium">Задача</th>
                <th class="px-4 py-3 font-medium">Категория</th>
                <th class="px-4 py-3 text-right font-medium">Output</th>
                <th class="px-4 py-3 text-right font-medium">Ссылки</th>
                <th class="px-4 py-3 text-right font-medium">Завершена</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in completedTaskRows" :key="task.id" class="border-t border-[#2D2D2D]">
                <td class="px-4 py-4 text-gray-200">{{ task.title }}</td>
                <td class="px-4 py-4 text-gray-500">{{ task.category || 'Без категории' }}</td>
                <td class="px-4 py-4 text-right text-gray-300">{{ task.units }}</td>
                <td class="px-4 py-4 text-right text-gray-300">{{ task.links }}</td>
                <td class="px-4 py-4 text-right text-gray-500">{{ formatDate(task.completedAt) }}</td>
              </tr>
              <tr v-if="!completedTaskRows.length" class="border-t border-[#2D2D2D]">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-600">Нет завершённых задач за период.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ChevronDown, Copy, Download, Link2, Printer } from '@lucide/vue'
import MetricCard from '@/components/analytics/MetricCard.vue'
import { getTasks } from '@/utils/taskStorage'
import { syncCategoriesFromTasks } from '@/utils/settingsStorage'

const typeOptions = [
  { value: 'attribute', label: 'Атрибуты' },
  { value: 'product', label: 'Карточки' },
  { value: 'description', label: 'Описание' },
  { value: 'page', label: 'Страницы' },
]

const presets = [
  { value: 'week', label: 'Эта неделя' },
  { value: 'prevWeek', label: 'Прошлая неделя' },
  { value: 'month', label: 'Этот месяц' },
  { value: '30d', label: '30 дней' },
  { value: 'custom', label: 'Свой период' },
]

const tasks = ref([])
const categories = ref([])
const copied = ref(false)
const expandedTypes = ref(new Set())

const filters = reactive({
  preset: 'week',
  from: toDateInput(new Date()),
  to: toDateInput(new Date()),
  type: 'all',
  category: 'all',
  location: 'all',
  sort: 'type',
})

const range = computed(() => resolveRange(filters.preset, filters.from, filters.to))

const rangeLabel = computed(() => {
  const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  if (toDateInput(range.value.start) === toDateInput(range.value.end)) return formatter.format(range.value.start)
  return `${formatter.format(range.value.start)} - ${formatter.format(range.value.end)}`
})

const generatedAtLabel = computed(() => new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date()))

const selectedCategoryLabel = computed(() => filters.category === 'all' ? 'Все категории' : filters.category)
const selectedLocationLabel = computed(() => ({ all: 'Дом + офис', home: 'Дом', office: 'Офис' }[filters.location] || filters.location))

const taskMatches = (task) => filters.category === 'all' || task.category === filters.category

const filteredActions = computed(() => {
  const rows = []

  tasks.value.forEach((task) => {
    if (!taskMatches(task)) return

    ;(task.actions || []).forEach((action) => {
      const timestamp = new Date(action.createdAt).getTime()
      if (!Number.isFinite(timestamp) || timestamp < range.value.startMs || timestamp > range.value.endMs) return
      if (filters.type !== 'all' && action.type !== filters.type) return
      if (filters.location !== 'all' && action.location !== filters.location) return

      rows.push({ ...action, taskId: task.id, taskTitle: task.title, category: task.category || '' })
    })
  })

  return rows
})

const filteredSessions = computed(() => {
  const rows = []

  tasks.value.forEach((task) => {
    if (!taskMatches(task)) return

    ;(task.workSessions || []).forEach((session) => {
      if (filters.type !== 'all' && session.type !== filters.type) return
      if (filters.location !== 'all' && session.location !== filters.location) return

      const clipped = clipSession(session, range.value.startMs, range.value.endMs)
      if (!clipped) return

      rows.push({ ...session, ...clipped, taskId: task.id })
    })
  })

  return rows
})

const completedTasks = computed(() => tasks.value.filter((task) => {
  if (!taskMatches(task) || !task.completedAt) return false
  const timestamp = new Date(task.completedAt).getTime()
  if (!Number.isFinite(timestamp) || timestamp < range.value.startMs || timestamp > range.value.endMs) return false
  if (filters.type !== 'all' && !(task.types || []).includes(filters.type)) return false
  if (filters.location !== 'all') {
    const hasLocation = (task.actions || []).some((action) => action.location === filters.location)
      || (task.workSessions || []).some((session) => session.location === filters.location)
    if (!hasLocation) return false
  }
  return true
}))

const typeRows = computed(() => {
  const visible = filters.type === 'all'
    ? typeOptions
    : typeOptions.filter((type) => type.value === filters.type)

  return visible.map((type) => {
    const evidence = filteredActions.value.filter((action) => action.type === type.value)
    const sessions = filteredSessions.value.filter((session) => session.type === type.value)
    const counts = { create: 0, add: 0, edit: 0 }

    evidence.forEach((action) => {
      if (Object.prototype.hasOwnProperty.call(counts, action.action)) counts[action.action] += Number(action.units) || 1
    })

    const total = evidence.reduce((sum, action) => sum + (Number(action.units) || 1), 0)
    const workMs = sessions.reduce((sum, session) => sum + session.durationMs, 0)

    return {
      type: type.value,
      label: type.label,
      ...counts,
      total,
      workMs,
      rate: workMs > 0 ? total / (workMs / 3600000) : 0,
      evidence: [...evidence].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    }
  }).filter((row) => row.total > 0 || row.workMs > 0)
})

const sortedTypeRows = computed(() => {
  const rows = [...typeRows.value]
  if (filters.sort === 'total') return rows.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'ru'))
  if (filters.sort === 'time') return rows.sort((a, b) => b.workMs - a.workMs || a.label.localeCompare(b.label, 'ru'))
  if (filters.sort === 'rate') return rows.sort((a, b) => b.rate - a.rate || a.label.localeCompare(b.label, 'ru'))
  return rows.sort((a, b) => a.label.localeCompare(b.label, 'ru'))
})

const totalUnits = computed(() => filteredActions.value.reduce((sum, action) => sum + (Number(action.units) || 1), 0))
const totalWorkMs = computed(() => filteredSessions.value.reduce((sum, session) => sum + session.durationMs, 0))
const totalRate = computed(() => totalWorkMs.value > 0 ? totalUnits.value / (totalWorkMs.value / 3600000) : 0)

const operationTotals = computed(() => filteredActions.value.reduce((acc, action) => {
  if (Object.prototype.hasOwnProperty.call(acc, action.action)) acc[action.action] += Number(action.units) || 1
  return acc
}, { create: 0, add: 0, edit: 0 }))

const completedTaskRows = computed(() => completedTasks.value
  .map((task) => {
    const actions = (task.actions || []).filter((action) => {
      const timestamp = new Date(action.createdAt).getTime()
      if (!Number.isFinite(timestamp) || timestamp < range.value.startMs || timestamp > range.value.endMs) return false
      if (filters.type !== 'all' && action.type !== filters.type) return false
      if (filters.location !== 'all' && action.location !== filters.location) return false
      return true
    })

    return {
      id: task.id,
      title: task.title,
      category: task.category,
      completedAt: task.completedAt,
      units: actions.reduce((sum, action) => sum + (Number(action.units) || 1), 0),
      links: actions.length,
    }
  })
  .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)))

const setPreset = (preset) => {
  if (preset === 'custom' && filters.preset !== 'custom') {
    filters.from = toDateInput(range.value.start)
    filters.to = toDateInput(range.value.end)
  }
  filters.preset = preset
}

const toggleEvidence = (type) => {
  const next = new Set(expandedTypes.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  expandedTypes.value = next
}

const buildReportText = () => {
  const lines = [
    `TaskFlow Work Report - ${rangeLabel.value}`,
    `Выполнено: ${totalUnits.value} ед.`,
    `Завершено задач: ${completedTasks.value.length}`,
    `Рабочее время: ${formatDuration(totalWorkMs.value)}`,
    '',
    'Итог по типам:',
  ]

  sortedTypeRows.value.forEach((row) => {
    lines.push(`${row.label}: ${row.total} ед. (создание ${row.create}, добавление ${row.add}, редактирование ${row.edit})`)
  })

  lines.push('', 'Ссылки на выполненную работу:')
  filteredActions.value.forEach((action, index) => {
    lines.push(`${index + 1}. ${typeLabel(action.type)} / ${actionLabel(action.action)} / ${action.pageTitle || action.taskTitle} - ${action.url}`)
  })

  return lines.join('\n')
}

const copyReport = async () => {
  try {
    await navigator.clipboard.writeText(buildReportText())
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 1800)
  } catch {
    copied.value = false
  }
}

const exportCsv = () => {
  const header = ['Тип', 'Действие', 'Задача', 'Заголовок страницы', 'Категория', 'Место', 'Ссылка', 'Дата']
  const rows = filteredActions.value.map((action) => [
    typeLabel(action.type),
    actionLabel(action.action),
    action.taskTitle,
    action.pageTitle || '',
    action.category || '',
    action.location === 'office' ? 'Офис' : 'Дом',
    action.url,
    formatDateTime(action.createdAt),
  ])

  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(escape).join(';')).join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `taskflow-report-${toDateInput(range.value.start)}-${toDateInput(range.value.end)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const printReport = async () => {
  expandedTypes.value = new Set(sortedTypeRows.value.map((row) => row.type))
  await nextTick()
  window.print()
}

const formatNumber = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value || 0)
const formatDecimal = (value) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value || 0)

const formatDuration = (ms) => {
  const totalMinutes = Math.round((ms || 0) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes}м`
  if (!minutes) return `${hours}ч`
  return `${hours}ч ${minutes}м`
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const formatDateTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

const typeLabel = (type) => typeOptions.find((item) => item.value === type)?.label || type
const actionLabel = (action) => ({ create: 'Создание', add: 'Добавление', edit: 'Редактирование' }[action] || action)

const typeStyle = (type) => ({
  attribute: 'bg-[#18372F] text-[#72D5B5]',
  product: 'bg-[#292447] text-[#B9B0FF]',
  description: 'bg-[#182C42] text-[#8FC4FF]',
  page: 'bg-[#3A2B17] text-[#F4BC72]',
}[type] || 'bg-[#2A2A2A] text-gray-300')

function toDateInput(date) {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function parseDateInput(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

function startOfWeek(date) {
  const value = startOfDay(date)
  const day = value.getDay() || 7
  value.setDate(value.getDate() - day + 1)
  return value
}

function resolveRange(preset, from, to) {
  const now = new Date()
  let start = startOfWeek(now)
  let end = endOfDay(now)

  if (preset === 'prevWeek') {
    start = startOfWeek(now)
    start.setDate(start.getDate() - 7)
    end = endOfDay(new Date(start))
    end.setDate(end.getDate() + 6)
  } else if (preset === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (preset === '30d') {
    start = startOfDay(now)
    start.setDate(start.getDate() - 29)
  } else if (preset === 'custom') {
    start = startOfDay(parseDateInput(from))
    end = endOfDay(parseDateInput(to))
    if (start > end) [start, end] = [startOfDay(parseDateInput(to)), endOfDay(parseDateInput(from))]
  }

  return { start, end, startMs: start.getTime(), endMs: end.getTime() }
}

function clipSession(session, rangeStart, rangeEnd) {
  const start = new Date(session.startedAt).getTime()
  const rawEnd = session.endedAt ? new Date(session.endedAt).getTime() : Date.now()
  if (!Number.isFinite(start) || !Number.isFinite(rawEnd) || rawEnd <= start) return null

  const startMs = Math.max(start, rangeStart)
  const endMs = Math.min(rawEnd, rangeEnd)
  if (endMs <= startMs) return null

  return { startMs, endMs, durationMs: endMs - startMs }
}

onMounted(() => {
  tasks.value = getTasks()
  categories.value = syncCategoriesFromTasks(tasks.value)
})
</script>

<style scoped>
.report-input {
  width: 100%;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  background: #101010;
  padding: 0.625rem 0.75rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  outline: none;
}
.report-input:focus { border-color: #3b82f6; }
.report-secondary,
.report-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: 150ms ease;
}
.report-secondary { border: 1px solid #3a3a3a; color: #d1d5db; background: #171717; }
.report-secondary:hover { background: #222; color: white; }
.report-primary { background: #2563eb; color: white; }
.report-primary:hover { background: #3b82f6; }

@media print {
  .report-filters,
  .report-actions { display: none !important; }
  .report-page { color: #111 !important; }
  .report-sheet { border: 0 !important; background: white !important; color: #111 !important; padding: 0 !important; }
  .report-sheet * {
    color: #111 !important;
    background-color: transparent !important;
    border-color: #d4d4d4 !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .report-sheet a { color: #1d4ed8 !important; text-decoration: underline; }
}
</style>
