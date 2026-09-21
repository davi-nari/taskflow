<template>
  <section class="min-h-full w-full text-white">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Аналитика</h1>
        <p class="mt-2 text-sm text-gray-500">
          Результат, фактическое время и производительность по задачам.
        </p>
      </div>

      <div class="text-right text-xs text-gray-600">
        <div>{{ rangeLabel }}</div>
        <div class="mt-1">Паузы в рабочее время не включаются</div>
      </div>
    </div>

    <div class="mb-8 rounded-2xl border border-[#303030] bg-[#151515] p-5">
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

      <div class="grid gap-4 xl:grid-cols-6">
        <div v-if="filters.preset === 'custom'" class="grid grid-cols-2 gap-2 xl:col-span-2">
          <label class="block">
            <span class="mb-2 block text-xs text-gray-500">С</span>
            <input
              v-model="filters.from"
              type="date"
              class="w-full rounded-lg border border-[#3A3A3A] bg-[#101010] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-blue-500"
            />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs text-gray-500">По</span>
            <input
              v-model="filters.to"
              type="date"
              class="w-full rounded-lg border border-[#3A3A3A] bg-[#101010] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <label class="block">
          <span class="mb-2 block text-xs text-gray-500">Тип</span>
          <select v-model="filters.type" class="analytics-select">
            <option value="all">Все типы</option>
            <option v-for="type in typeOptions" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-xs text-gray-500">Место</span>
          <select v-model="filters.location" class="analytics-select">
            <option value="all">Дом + офис</option>
            <option value="home">Дом</option>
            <option value="office">Офис</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-xs text-gray-500">Действие</span>
          <select v-model="filters.operation" class="analytics-select">
            <option value="all">Все действия</option>
            <option value="create">Создание</option>
            <option value="add">Добавление</option>
            <option value="edit">Редактирование</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-xs text-gray-500">Категория</span>
          <select v-model="filters.category" class="analytics-select">
            <option value="all">Все категории</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-xs text-gray-500">Статус задачи</span>
          <select v-model="filters.status" class="analytics-select">
            <option value="all">Все статусы</option>
            <option value="todo">К выполнению</option>
            <option value="progress">В работе</option>
            <option value="paused">Приостановлена</option>
            <option value="done">Готово</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-xs text-gray-500">Минимум / день</span>
          <input
            v-model.number="dailyMinimum"
            type="number"
            min="0"
            step="1"
            placeholder="Не задан"
            class="w-full rounded-lg border border-[#3A3A3A] bg-[#101010] px-3 py-2.5 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-blue-500"
          />
        </label>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          type="button"
          class="text-xs text-gray-500 transition hover:text-white"
          @click="resetFilters"
        >
          Сбросить фильтры
        </button>
      </div>
    </div>

    <div class="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Выполнено задач" :value="String(completedTasks.length)" hint="по дате завершения" />
      <MetricCard label="Output" :value="`${formatNumber(totalUnits)} ед.`" hint="действий за период" />
      <MetricCard label="Рабочее время" :value="formatDuration(totalWorkMs)" hint="без пауз" />
      <MetricCard
        label="Output / hour"
        :value="totalWorkMs ? `${formatDecimal(outputPerHour)} ед/ч` : '0 ед/ч'"
        hint="единиц за рабочий час"
      />
      <MetricCard
        label="План завершённых задач"
        :value="planStats.unitsPlan ? `${formatPercent(planStats.unitsRate)}%` : planStats.comparable ? 'Нет плана' : 'Недоступно'"
        :hint="planStats.unitsPlan ? `${formatNumber(planStats.unitsActual)} / ${formatNumber(planStats.unitsPlan)} ед.` : planStats.comparable ? 'план по единицам не задан' : 'план не делится по месту или действию'"
      />
    </div>

    <div class="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-[#292929] bg-[#101010] px-4 py-3">
        <div class="text-xs text-gray-600">Среднее время / единицу</div>
        <div class="mt-1 text-sm font-semibold text-gray-200">{{ totalUnits ? `${formatDecimal(totalWorkMs / 60000 / totalUnits)} мин` : '-' }}</div>
      </div>
      <div class="rounded-xl border border-[#292929] bg-[#101010] px-4 py-3">
        <div class="text-xs text-gray-600">Средний output / активный день</div>
        <div class="mt-1 text-sm font-semibold text-gray-200">{{ dailyStats.activeDays ? `${formatDecimal(dailyStats.averageUnits)} ед.` : '-' }}</div>
      </div>
      <div class="rounded-xl border border-[#292929] bg-[#101010] px-4 py-3">
        <div class="text-xs text-gray-600">Активных дней</div>
        <div class="mt-1 text-sm font-semibold text-gray-200">{{ dailyStats.activeDays }}</div>
      </div>
      <div class="rounded-xl border border-[#292929] bg-[#101010] px-4 py-3">
        <div class="text-xs text-gray-600">Дневной минимум</div>
        <div class="mt-1 text-sm font-semibold text-gray-200">
          {{ dailyMinimum > 0 ? `${dailyStats.daysMeetingMinimum} / ${dailyStats.activeDays} дней` : 'Не задан' }}
        </div>
      </div>
    </div>

    <div class="mb-8 grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.75fr)]">
      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold">Output по времени</h2>
            <p class="mt-1 text-xs text-gray-600">Количество единиц по дням, неделям или месяцам</p>
          </div>
          <span class="rounded-full bg-[#202020] px-3 py-1 text-xs text-gray-500">{{ trendGranularityLabel }}</span>
        </div>

        <TrendChart
          title="Output по времени"
          :points="trendPoints"
          :value-formatter="(value) => `${formatNumber(value)} ед.`"
          :axis-formatter="(value) => formatNumber(value)"
        />
      </div>

      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
        <div class="mb-6">
          <h2 class="font-semibold">Дом / Офис</h2>
          <p class="mt-1 text-xs text-gray-600">Сравнение результата и скорости</p>
        </div>

        <div class="space-y-5">
          <div v-for="row in locationStats" :key="row.location" class="rounded-xl bg-[#101010] p-4">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span :class="['h-2.5 w-2.5 rounded-full', row.location === 'office' ? 'bg-blue-400' : 'bg-emerald-400']" />
                <span class="font-medium">{{ row.label }}</span>
              </div>
              <span class="text-sm font-semibold">{{ formatNumber(row.units) }} ед.</span>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="rounded-lg bg-[#171717] p-3">
                <div class="text-gray-600">Время</div>
                <div class="mt-1 text-gray-300">{{ formatDuration(row.workMs) }}</div>
              </div>
              <div class="rounded-lg bg-[#171717] p-3">
                <div class="text-gray-600">Output / hour</div>
                <div class="mt-1 text-gray-300">{{ formatDecimal(row.rate) }} ед/ч</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-8 grid gap-6 xl:grid-cols-2">
      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
        <div class="mb-5">
          <h2 class="font-semibold">По типам работы</h2>
          <p class="mt-1 text-xs text-gray-600">Где уходит время и какой получается темп</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-left text-sm">
            <thead class="text-xs text-gray-600">
              <tr class="border-b border-[#2C2C2C]">
                <th class="pb-3 pr-4 font-medium">Тип</th>
                <th class="pb-3 px-4 font-medium">Output</th>
                <th class="pb-3 px-4 font-medium">Время</th>
                <th class="pb-3 px-4 font-medium">Ед/ч</th>
                <th class="pb-3 pl-4 font-medium">Мин/ед</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in typeStats" :key="row.type" class="border-b border-[#242424] last:border-0">
                <td class="py-4 pr-4">
                  <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-medium', typeStyle(row.type)]">
                    {{ row.label }}
                  </span>
                </td>
                <td class="px-4 py-4 text-gray-200">{{ formatNumber(row.units) }}</td>
                <td class="px-4 py-4 text-gray-400">{{ formatDuration(row.workMs) }}</td>
                <td class="px-4 py-4 text-gray-200">{{ formatDecimal(row.rate) }}</td>
                <td class="pl-4 py-4 text-gray-400">{{ row.units ? formatDecimal(row.avgMinutes) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
        <div class="mb-5">
          <h2 class="font-semibold">По действиям</h2>
          <p class="mt-1 text-xs text-gray-600">Создание, добавление и редактирование</p>
        </div>

        <div class="space-y-5">
          <div v-for="row in operationStats" :key="row.operation">
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="text-gray-300">{{ row.label }}</span>
              <span class="text-gray-500">{{ formatNumber(row.units) }} ед. · {{ formatPercent(row.share) }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-[#242424]">
              <div class="h-full rounded-full bg-[#5B8FFF] transition-all" :style="{ width: `${row.share}%` }" />
            </div>
          </div>
        </div>

        <div class="mt-8 border-t border-[#2C2C2C] pt-5">
          <h3 class="mb-4 text-sm font-medium text-gray-300">План / факт времени</h3>
          <div class="grid grid-cols-3 gap-3 text-center text-xs">
            <div class="rounded-xl bg-[#101010] p-3">
              <div class="text-gray-600">План</div>
              <div class="mt-2 text-sm font-semibold text-gray-200">{{ planStats.minutesPlan ? formatMinutes(planStats.minutesPlan) : '-' }}</div>
            </div>
            <div class="rounded-xl bg-[#101010] p-3">
              <div class="text-gray-600">Факт</div>
              <div class="mt-2 text-sm font-semibold text-gray-200">{{ planStats.minutesPlan ? formatDuration(planStats.actualWorkMs) : '-' }}</div>
            </div>
            <div class="rounded-xl bg-[#101010] p-3">
              <div class="text-gray-600">Отклонение</div>
              <div :class="['mt-2 text-sm font-semibold', planTimeDeltaClass]">{{ planTimeDeltaLabel }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold">Категории</h2>
            <p class="mt-1 text-xs text-gray-600">Output и время по рабочим категориям</p>
          </div>
          <span class="text-xs text-gray-600">Топ {{ categoryStats.length }}</span>
        </div>

        <div v-if="categoryStats.length" class="space-y-3">
          <div v-for="row in categoryStats" :key="row.category" class="grid grid-cols-[minmax(0,1fr)_90px_110px_90px] items-center gap-3 rounded-xl bg-[#101010] px-4 py-3 text-sm">
            <span class="truncate text-gray-300" :title="row.category">{{ row.category }}</span>
            <span class="text-right text-gray-200">{{ formatNumber(row.units) }} ед.</span>
            <span class="text-right text-gray-500">{{ formatDuration(row.workMs) }}</span>
            <span class="text-right text-gray-400">{{ formatDecimal(row.rate) }} ед/ч</span>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-gray-600">Нет данных по категориям</div>
      </div>

      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
        <div class="mb-5">
          <h2 class="font-semibold">Завершённые задачи</h2>
          <p class="mt-1 text-xs text-gray-600">Последние завершения в выбранном периоде</p>
        </div>

        <div v-if="completedTaskRows.length" class="space-y-3">
          <div v-for="row in completedTaskRows" :key="row.id" class="rounded-xl bg-[#101010] p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-gray-200" :title="row.title">{{ row.title }}</div>
                <div class="mt-1 text-xs text-gray-600">{{ row.category }} · {{ formatDate(row.completedAt) }}</div>
              </div>
              <div class="shrink-0 text-right">
                <div class="text-sm font-semibold text-gray-200">{{ formatNumber(row.units) }} ед.</div>
                <div class="mt-1 text-xs text-gray-600">{{ formatDuration(row.workMs) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-gray-600">За период нет завершённых задач</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import MetricCard from '@/components/analytics/MetricCard.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'
import { getTasks } from '@/utils/taskStorage'
import { getDailyMinimum, updateDailyMinimum } from '@/utils/settingsStorage'

const typeOptions = [
  { value: 'attribute', label: 'Атрибуты' },
  { value: 'product', label: 'Карточки' },
  { value: 'description', label: 'Описание' },
  { value: 'page', label: 'Страницы' },
]

const operationOptions = [
  { value: 'create', label: 'Создание' },
  { value: 'add', label: 'Добавление' },
  { value: 'edit', label: 'Редактирование' },
]

const presets = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: 'month', label: 'Этот месяц' },
  { value: 'prevMonth', label: 'Прошлый месяц' },
  { value: 'all', label: 'Всё время' },
  { value: 'custom', label: 'Свой период' },
]

const tasks = ref([])
const now = ref(Date.now())
let refreshTimer = null
const dailyMinimum = ref(0)

const todayString = () => toDateInput(new Date())

const filters = reactive({
  preset: '7d',
  from: todayString(),
  to: todayString(),
  type: 'all',
  location: 'all',
  operation: 'all',
  category: 'all',
  status: 'all',
})

const categories = computed(() => {
  const values = tasks.value.map((task) => task.category?.trim() || 'Без категории')
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'))
})

const range = computed(() => resolveRange(filters.preset, filters.from, filters.to, tasks.value, now.value))

const rangeLabel = computed(() => {
  const formatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${formatter.format(range.value.start)} - ${formatter.format(range.value.end)}`
})

const taskMatches = (task) => {
  if (filters.category !== 'all' && (task.category || 'Без категории') !== filters.category) return false
  if (filters.status !== 'all' && task.status !== filters.status) return false
  if (filters.type !== 'all' && !(task.types || []).includes(filters.type)) return false
  return true
}

const actionMatches = (action) => {
  const timestamp = new Date(action.createdAt).getTime()
  if (!Number.isFinite(timestamp) || timestamp < range.value.startMs || timestamp > range.value.endMs) return false
  if (filters.type !== 'all' && action.type !== filters.type) return false
  if (filters.location !== 'all' && action.location !== filters.location) return false
  if (filters.operation !== 'all' && action.action !== filters.operation) return false
  return true
}

const sessionMatches = (session) => {
  if (filters.type !== 'all' && session.type !== filters.type) return false
  if (filters.location !== 'all' && session.location !== filters.location) return false
  if (filters.operation !== 'all' && session.operation !== filters.operation) return false
  return true
}

const filteredActions = computed(() => {
  const rows = []

  tasks.value.forEach((task) => {
    if (!taskMatches(task)) return

    ;(task.actions || []).forEach((action) => {
      if (!actionMatches(action)) return
      rows.push({ ...action, taskId: task.id, taskTitle: task.title, category: task.category || 'Без категории' })
    })
  })

  return rows
})

const filteredSessions = computed(() => {
  const rows = []

  tasks.value.forEach((task) => {
    if (!taskMatches(task)) return

    ;(task.workSessions || []).forEach((session) => {
      if (!sessionMatches(session)) return

      const interval = clipSession(session, range.value.startMs, range.value.endMs, now.value)
      if (!interval) return

      rows.push({
        ...session,
        taskId: task.id,
        taskTitle: task.title,
        category: task.category || 'Без категории',
        startMs: interval.startMs,
        endMs: interval.endMs,
        durationMs: interval.durationMs,
      })
    })
  })

  return rows
})

const completedTasks = computed(() =>
  tasks.value.filter((task) => {
    if (!taskMatches(task) || !task.completedAt) return false
    const completed = new Date(task.completedAt).getTime()
    if (!Number.isFinite(completed) || completed < range.value.startMs || completed > range.value.endMs) return false

    if (filters.location !== 'all') {
      const hasLocation = (task.actions || []).some((action) => action.location === filters.location) ||
        (task.workSessions || []).some((session) => session.location === filters.location)
      if (!hasLocation) return false
    }

    if (filters.operation !== 'all') {
      if (!(task.actions || []).some((action) => action.action === filters.operation)) return false
    }

    return true
  }),
)

const totalUnits = computed(() => filteredActions.value.reduce((sum, action) => sum + (Number(action.units) || 1), 0))
const totalWorkMs = computed(() => filteredSessions.value.reduce((sum, session) => sum + session.durationMs, 0))
const outputPerHour = computed(() => totalWorkMs.value > 0 ? totalUnits.value / (totalWorkMs.value / 3600000) : 0)

const locationStats = computed(() => ['home', 'office'].map((location) => {
  const units = filteredActions.value
    .filter((action) => action.location === location)
    .reduce((sum, action) => sum + (Number(action.units) || 1), 0)
  const workMs = filteredSessions.value
    .filter((session) => session.location === location)
    .reduce((sum, session) => sum + session.durationMs, 0)

  return {
    location,
    label: location === 'office' ? 'Офис' : 'Дом',
    units,
    workMs,
    rate: workMs > 0 ? units / (workMs / 3600000) : 0,
  }
}))

const typeStats = computed(() => {
  const visibleTypes = filters.type === 'all'
    ? typeOptions
    : typeOptions.filter((type) => type.value === filters.type)

  return visibleTypes.map((type) => {
    const units = filteredActions.value
      .filter((action) => action.type === type.value)
      .reduce((sum, action) => sum + (Number(action.units) || 1), 0)
    const workMs = filteredSessions.value
      .filter((session) => session.type === type.value)
      .reduce((sum, session) => sum + session.durationMs, 0)

    return {
      type: type.value,
      label: type.label,
      units,
      workMs,
      rate: workMs > 0 ? units / (workMs / 3600000) : 0,
      avgMinutes: units > 0 ? workMs / 60000 / units : 0,
    }
  })
})

const operationStats = computed(() => {
  const denominator = Math.max(1, totalUnits.value)

  return operationOptions.map((operation) => {
    const units = filteredActions.value
      .filter((action) => action.action === operation.value)
      .reduce((sum, action) => sum + (Number(action.units) || 1), 0)

    return {
      operation: operation.value,
      label: operation.label,
      units,
      share: totalUnits.value ? (units / denominator) * 100 : 0,
    }
  })
})

const categoryStats = computed(() => {
  const map = new Map()

  const ensure = (category) => {
    if (!map.has(category)) map.set(category, { category, units: 0, workMs: 0 })
    return map.get(category)
  }

  filteredActions.value.forEach((action) => {
    ensure(action.category).units += Number(action.units) || 1
  })

  filteredSessions.value.forEach((session) => {
    ensure(session.category).workMs += session.durationMs
  })

  return [...map.values()]
    .map((row) => ({ ...row, rate: row.workMs > 0 ? row.units / (row.workMs / 3600000) : 0 }))
    .sort((a, b) => b.units - a.units || b.workMs - a.workMs)
    .slice(0, 8)
})

const planStats = computed(() => {
  const comparable = filters.location === 'all' && filters.operation === 'all'
  let unitsPlan = 0
  let unitsActual = 0
  let minutesPlan = 0
  let actualWorkMs = 0

  completedTasks.value.forEach((task) => {
    const relevantTypes = filters.type === 'all' ? (task.types || []) : [filters.type]

    if (comparable) {
      relevantTypes.forEach((type) => {
        const plan = task.planByType?.[type]
        if (plan?.units) unitsPlan += Number(plan.units) || 0
        if (plan?.minutes) minutesPlan += Number(plan.minutes) || 0
      })
    }

    ;(task.actions || []).forEach((action) => {
      if (filters.type !== 'all' && action.type !== filters.type) return
      if (filters.location !== 'all' && action.location !== filters.location) return
      if (filters.operation !== 'all' && action.action !== filters.operation) return
      unitsActual += Number(action.units) || 1
    })

    ;(task.workSessions || []).forEach((session) => {
      if (filters.type !== 'all' && session.type !== filters.type) return
      if (filters.location !== 'all' && session.location !== filters.location) return
      if (filters.operation !== 'all' && session.operation !== filters.operation) return
      const start = new Date(session.startedAt).getTime()
      const end = session.endedAt ? new Date(session.endedAt).getTime() : now.value
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) actualWorkMs += end - start
    })
  })

  return {
    comparable,
    unitsPlan,
    unitsActual,
    unitsRate: unitsPlan > 0 ? (unitsActual / unitsPlan) * 100 : 0,
    minutesPlan,
    actualWorkMs,
  }
})

const planTimeDeltaMinutes = computed(() => planStats.value.actualWorkMs / 60000 - planStats.value.minutesPlan)
const planTimeDeltaLabel = computed(() => {
  if (!planStats.value.minutesPlan) return '-'
  const delta = Math.round(planTimeDeltaMinutes.value)
  if (delta === 0) return 'По плану'
  return `${delta > 0 ? '+' : ''}${delta} мин`
})
const planTimeDeltaClass = computed(() => {
  if (!planStats.value.minutesPlan || planTimeDeltaMinutes.value === 0) return 'text-gray-300'
  return planTimeDeltaMinutes.value > 0 ? 'text-orange-300' : 'text-emerald-300'
})

const dailyStats = computed(() => {
  const byDay = new Map()

  const ensure = (timestamp) => {
    const date = new Date(timestamp)
    const key = toDateInput(date)
    if (!byDay.has(key)) byDay.set(key, { units: 0, workMs: 0 })
    return byDay.get(key)
  }

  filteredActions.value.forEach((action) => {
    const timestamp = new Date(action.createdAt).getTime()
    if (Number.isFinite(timestamp)) ensure(timestamp).units += Number(action.units) || 1
  })

  filteredSessions.value.forEach((session) => {
    let cursor = startOfDay(new Date(session.startMs))
    while (cursor.getTime() <= session.endMs) {
      const dayStart = cursor.getTime()
      const next = new Date(cursor)
      next.setDate(next.getDate() + 1)
      const dayEnd = next.getTime()
      const overlapStart = Math.max(session.startMs, dayStart)
      const overlapEnd = Math.min(session.endMs, dayEnd)
      if (overlapEnd > overlapStart) ensure(dayStart).workMs += overlapEnd - overlapStart
      cursor = next
    }
  })

  const active = [...byDay.values()].filter((day) => day.units > 0 || day.workMs > 0)
  const activeDays = active.length
  const total = active.reduce((sum, day) => sum + day.units, 0)
  const minimum = Number(dailyMinimum.value) || 0

  return {
    activeDays,
    averageUnits: activeDays ? total / activeDays : 0,
    daysMeetingMinimum: minimum > 0 ? active.filter((day) => day.units >= minimum).length : 0,
  }
})

const trendData = computed(() => buildTrendBuckets(range.value, filteredActions.value, filteredSessions.value))
const trendPoints = computed(() => trendData.value.buckets.map((bucket) => ({ label: bucket.label, value: bucket.units })))
const trendGranularityLabel = computed(() => trendData.value.granularityLabel)

const completedTaskRows = computed(() =>
  completedTasks.value
    .map((task) => {
      const units = (task.actions || [])
        .filter((action) => filters.type === 'all' || action.type === filters.type)
        .filter((action) => filters.location === 'all' || action.location === filters.location)
        .filter((action) => filters.operation === 'all' || action.action === filters.operation)
        .reduce((sum, action) => sum + (Number(action.units) || 1), 0)

      const workMs = (task.workSessions || [])
        .filter((session) => filters.type === 'all' || session.type === filters.type)
        .filter((session) => filters.location === 'all' || session.location === filters.location)
        .filter((session) => filters.operation === 'all' || session.operation === filters.operation)
        .reduce((sum, session) => {
          const start = new Date(session.startedAt).getTime()
          const end = session.endedAt ? new Date(session.endedAt).getTime() : now.value
          return sum + (Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 0)
        }, 0)

      return {
        id: task.id,
        title: task.title,
        category: task.category || 'Без категории',
        completedAt: task.completedAt,
        units,
        workMs,
      }
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 7),
)

const setPreset = (preset) => {
  const current = range.value
  filters.preset = preset
  if (preset !== 'custom') return

  filters.from = toDateInput(current.start)
  filters.to = toDateInput(current.end)
}

const resetFilters = () => {
  filters.preset = '7d'
  filters.from = todayString()
  filters.to = todayString()
  filters.type = 'all'
  filters.location = 'all'
  filters.operation = 'all'
  filters.category = 'all'
  filters.status = 'all'
}

const formatNumber = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value || 0)
const formatDecimal = (value) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value || 0)
const formatPercent = (value) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value || 0)

const formatDuration = (ms) => {
  const totalMinutes = Math.round((ms || 0) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (!hours) return `${minutes}м`
  if (!minutes) return `${hours}ч`
  return `${hours}ч ${minutes}м`
}

const formatMinutes = (minutes) => formatDuration((minutes || 0) * 60000)

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const typeStyle = (type) => ({
  attribute: 'bg-[#18372F] text-[#72D5B5]',
  product: 'bg-[#292447] text-[#B9B0FF]',
  description: 'bg-[#182C42] text-[#8FC4FF]',
  page: 'bg-[#3A2B17] text-[#F4BC72]',
}[type] || 'bg-[#2A2A2A] text-gray-300')

function toDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
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
  if (!value) return new Date()
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function resolveRange(preset, from, to, allTasks, currentNow) {
  const current = new Date(currentNow)
  let start = startOfDay(current)
  let end = endOfDay(current)

  if (preset === '7d') {
    start.setDate(start.getDate() - 6)
  } else if (preset === '30d') {
    start.setDate(start.getDate() - 29)
  } else if (preset === 'month') {
    start = new Date(current.getFullYear(), current.getMonth(), 1)
  } else if (preset === 'prevMonth') {
    start = new Date(current.getFullYear(), current.getMonth() - 1, 1)
    end = new Date(current.getFullYear(), current.getMonth(), 0, 23, 59, 59, 999)
  } else if (preset === 'all') {
    const timestamps = []
    allTasks.forEach((task) => {
      ;[task.createdAt, task.completedAt].forEach((value) => {
        const timestamp = value ? new Date(value).getTime() : NaN
        if (Number.isFinite(timestamp)) timestamps.push(timestamp)
      })
      ;(task.actions || []).forEach((action) => {
        const timestamp = new Date(action.createdAt).getTime()
        if (Number.isFinite(timestamp)) timestamps.push(timestamp)
      })
      ;(task.workSessions || []).forEach((session) => {
        const timestamp = new Date(session.startedAt).getTime()
        if (Number.isFinite(timestamp)) timestamps.push(timestamp)
      })
    })
    if (timestamps.length) start = startOfDay(new Date(Math.min(...timestamps)))
  } else if (preset === 'custom') {
    start = startOfDay(parseDateInput(from))
    end = endOfDay(parseDateInput(to))
    if (start > end) [start, end] = [startOfDay(parseDateInput(to)), endOfDay(parseDateInput(from))]
  }

  return { start, end, startMs: start.getTime(), endMs: end.getTime() }
}

function clipSession(session, rangeStart, rangeEnd, currentNow) {
  const start = new Date(session.startedAt).getTime()
  const rawEnd = session.endedAt ? new Date(session.endedAt).getTime() : currentNow
  if (!Number.isFinite(start) || !Number.isFinite(rawEnd) || rawEnd <= start) return null

  const startMs = Math.max(start, rangeStart)
  const endMs = Math.min(rawEnd, rangeEnd)
  if (endMs <= startMs) return null

  return { startMs, endMs, durationMs: endMs - startMs }
}

function buildTrendBuckets(selectedRange, actions, sessions) {
  const dayMs = 86400000
  const totalDays = Math.max(1, Math.ceil((selectedRange.endMs - selectedRange.startMs + 1) / dayMs))
  const granularity = totalDays <= 45 ? 'day' : totalDays <= 240 ? 'week' : 'month'
  const buckets = []
  let cursor = startOfDay(selectedRange.start)

  while (cursor.getTime() <= selectedRange.endMs) {
    const bucketStart = new Date(cursor)
    let next
    let label

    if (granularity === 'day') {
      next = new Date(cursor)
      next.setDate(next.getDate() + 1)
      label = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(bucketStart)
    } else if (granularity === 'week') {
      next = new Date(cursor)
      next.setDate(next.getDate() + 7)
      label = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(bucketStart)
    } else {
      next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      label = new Intl.DateTimeFormat('ru-RU', { month: 'short', year: '2-digit' }).format(bucketStart)
    }

    const startMs = Math.max(bucketStart.getTime(), selectedRange.startMs)
    const endMs = Math.min(next.getTime() - 1, selectedRange.endMs)
    let units = 0
    let workMs = 0

    actions.forEach((action) => {
      const timestamp = new Date(action.createdAt).getTime()
      if (timestamp >= startMs && timestamp <= endMs) units += Number(action.units) || 1
    })

    sessions.forEach((session) => {
      const overlapStart = Math.max(session.startMs, startMs)
      const overlapEnd = Math.min(session.endMs, endMs)
      if (overlapEnd > overlapStart) workMs += overlapEnd - overlapStart
    })

    buckets.push({ label, units, workMs })
    cursor = next
  }

  return {
    buckets,
    granularityLabel: granularity === 'day' ? 'По дням' : granularity === 'week' ? 'По неделям' : 'По месяцам',
  }
}

watch(dailyMinimum, (value) => {
  const normalized = Math.max(0, Number(value) || 0)
  if (normalized !== value) dailyMinimum.value = normalized
  updateDailyMinimum(normalized)
})

onMounted(() => {
  dailyMinimum.value = getDailyMinimum()
  tasks.value = getTasks()
  refreshTimer = window.setInterval(() => {
    now.value = Date.now()
    tasks.value = getTasks()
  }, 30000)
})

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<style scoped>
.analytics-select {
  width: 100%;
  border: 1px solid #3a3a3a;
  border-radius: 0.5rem;
  background: #101010;
  padding: 0.625rem 0.75rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  outline: none;
}

.analytics-select:focus {
  border-color: #3b82f6;
}
</style>
