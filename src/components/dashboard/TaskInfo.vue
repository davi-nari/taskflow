<template>
  <div class="w-full text-sm">
    <div class="mb-6 grid gap-3 rounded-xl bg-[#101010] p-5 text-gray-400 md:grid-cols-3">
      <div>
        <span class="text-gray-500">Создана:</span>
        <span class="ml-2 text-gray-300">{{ formatDate(task.createdAt) }}</span>
      </div>

      <div>
        <span class="text-gray-500">Дедлайн:</span>
        <span class="ml-2 text-gray-300">{{ formatDate(task.deadline) }}</span>
      </div>

      <div>
        <span class="text-gray-500">Категория:</span>
        <span class="ml-2 text-gray-300">{{ task.category || 'Не указана' }}</span>
      </div>

      <div v-if="planRows.length" class="md:col-span-3">
        <span class="text-gray-500">План:</span>
        <span class="ml-2 text-gray-300">{{ planSummary }}</span>
      </div>

      <div v-if="task.description" class="md:col-span-3">
        <span class="text-gray-500">Описание:</span>
        <span class="ml-2 text-gray-300">{{ task.description }}</span>
      </div>
    </div>

    <div
      :class="[
        'mb-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3',
        openBreak
          ? 'border-[#5A4723] bg-[#241D10]'
          : openSession
            ? 'border-[#234C3E] bg-[#11221C]'
            : 'border-[#4A3B25] bg-[#211A10]',
      ]"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          :class="[
            'h-2.5 w-2.5 shrink-0 rounded-full',
            openBreak
              ? 'bg-amber-400'
              : openSession
                ? 'animate-pulse bg-emerald-400'
                : 'bg-orange-400',
          ]"
        />
        <div class="min-w-0">
          <div
            :class="openBreak ? 'text-amber-300' : openSession ? 'text-emerald-300' : 'text-orange-300'"
            class="font-medium"
          >
            {{ trackingTitle }}
          </div>
          <div class="mt-0.5 truncate text-xs text-gray-500">
            <template v-if="openBreak">
              {{ breakReasonLabel(openBreak.reason) }} · рабочее время не учитывается
            </template>
            <template v-else-if="openSession">
              {{ typeLabel(openSession.type) }} · {{ locationLabel(openSession.location) }}
            </template>
            <template v-else>
              Выберите тип работы, чтобы начать учитывать фактическое время.
            </template>
          </div>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <div v-if="openSession || openBreak" class="font-mono text-base font-semibold text-white">
          {{ openBreak ? breakDuration : activeDuration }}
        </div>

        <div v-if="openSession" class="relative">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-[#5A4723] bg-[#2A2112] px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-[#352817]"
            @click="pauseMenuOpen = !pauseMenuOpen"
          >
            <Pause class="h-3.5 w-3.5" />
            Пауза
            <ChevronDown class="h-3.5 w-3.5" />
          </button>

          <div
            v-if="pauseMenuOpen"
            class="absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-[#3A3A3A] bg-[#171717] p-2 shadow-2xl"
          >
            <button
              v-for="reason in breakReasons"
              :key="reason.value"
              type="button"
              class="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-gray-300 transition hover:bg-[#242424] hover:text-white"
              @click="pause(reason.value)"
            >
              {{ reason.label }}
            </button>
          </div>
        </div>

        <button
          v-if="openBreak"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
          @click="$emit('resume-tracking')"
        >
          <Play class="h-3.5 w-3.5" />
          Продолжить
        </button>
      </div>
    </div>

    <div>
      <div class="mb-3 text-sm font-medium text-gray-300">Тип</div>

      <div class="mb-6 flex flex-wrap gap-2">
        <button
          v-for="type in availableTypes"
          :key="type.value"
          type="button"
          :class="[
            'rounded-lg border px-4 py-2 text-sm font-medium transition',
            selectedType === type.value
              ? type.activeClass
              : 'border-[#3B3B3B] bg-[#171717] text-gray-400 hover:border-[#555] hover:text-gray-200',
          ]"
          @click="selectType(type.value)"
        >
          {{ type.label }}
        </button>
      </div>

      <div
        v-if="availableTypes.length > 1 && !selectedType"
        class="mb-6 rounded-lg border border-[#3D3527] bg-[#1B1710] px-4 py-3 text-xs text-[#D6A85F]"
      >
        В задаче несколько типов. Выберите, с чем работаете сейчас. При переключении TaskFlow автоматически завершит предыдущий временной интервал и начнёт новый.
      </div>

      <div
        v-if="openBreak"
        class="mb-6 rounded-lg border border-[#5A4723] bg-[#211A10] px-4 py-3 text-xs text-amber-300"
      >
        Таймер сейчас на паузе. Тип можно переключить заранее, но новое действие получится добавить только после продолжения работы.
      </div>

      <template v-if="selectedType">
        <div class="mb-3 text-sm font-medium text-gray-300">Действие</div>

        <div class="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-[#333] bg-[#111] p-1">
          <button
            v-for="operation in operations"
            :key="operation.value"
            type="button"
            :disabled="Boolean(openBreak)"
            :class="[
              'rounded-lg px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40',
              selectedOperation === operation.value
                ? 'bg-[#2A2A2A] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300',
            ]"
            @click="selectOperation(operation.value)"
          >
            {{ operation.label }}
          </button>
        </div>

        <div class="grid gap-4" :class="selectedType === 'page' ? 'grid-cols-2' : 'grid-cols-1'">
          <div v-if="selectedType === 'page'">
            <label class="mb-2 block text-sm text-gray-400">Заголовок страницы</label>
            <input
              v-model="pageTitle"
              type="text"
              :disabled="Boolean(openBreak)"
              placeholder="Например: Кроссовки для бега"
              class="w-full rounded-lg border border-[#444] bg-[#101010] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm text-gray-400">Ссылка</label>
            <input
              ref="linkInput"
              v-model="url"
              type="text"
              inputmode="url"
              autocomplete="off"
              :disabled="Boolean(openBreak)"
              placeholder="Вставьте ссылку и нажмите пробел"
              class="w-full rounded-lg border border-[#444] bg-[#101010] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              @keydown.space.prevent="submitAction"
              @keydown.enter.prevent="submitAction"
            />
          </div>
        </div>

        <div class="mt-3 flex min-h-5 items-center gap-3 text-xs">
          <span v-if="error" class="text-red-400">{{ error }}</span>
          <span v-else class="text-gray-600">После вставки ссылки нажмите пробел, чтобы добавить действие в таблицу.</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown, Pause, Play } from '@lucide/vue'
import { createEntityId } from '@/utils/taskStorage'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['add-action', 'work-type-change', 'work-operation-change', 'pause-tracking', 'resume-tracking'])

const types = [
  {
    value: 'attribute',
    label: 'Атрибуты',
    activeClass: 'border-[#2B806A] bg-[#18372F] text-[#72D5B5]',
  },
  {
    value: 'product',
    label: 'Карточки',
    activeClass: 'border-[#6557D9] bg-[#292447] text-[#B9B0FF]',
  },
  {
    value: 'description',
    label: 'Описание',
    activeClass: 'border-[#316DAA] bg-[#182C42] text-[#8FC4FF]',
  },
  {
    value: 'page',
    label: 'Страницы',
    activeClass: 'border-[#9B6A28] bg-[#3A2B17] text-[#F4BC72]',
  },
]

const operations = [
  { value: 'create', label: 'Создание' },
  { value: 'add', label: 'Добавление' },
  { value: 'edit', label: 'Редактирование' },
]

const breakReasons = [
  { value: 'break', label: 'Перерыв' },
  { value: 'lunch', label: 'Обед' },
  { value: 'personal', label: 'Личное' },
]

const selectedType = ref('')
const selectedOperation = ref('create')
const url = ref('')
const pageTitle = ref('')
const error = ref('')
const linkInput = ref(null)
const pauseMenuOpen = ref(false)
const now = ref(Date.now())
let timer = null

const availableTypes = computed(() => types.filter((type) => (props.task.types || []).includes(type.value)))

const openSession = computed(() => {
  const sessions = props.task.workSessions || []

  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    if (!sessions[index].endedAt) return sessions[index]
  }

  return null
})

const openBreak = computed(() => {
  const breaks = props.task.breaks || []

  for (let index = breaks.length - 1; index >= 0; index -= 1) {
    if (!breaks[index].endedAt) return breaks[index]
  }

  return null
})

const trackingTitle = computed(() => {
  if (openBreak.value) return 'Таймер на паузе'
  if (openSession.value) return 'Учёт времени идёт'
  return 'Учёт времени не запущен'
})

const planRows = computed(() =>
  availableTypes.value
    .map((type) => ({
      ...type,
      units: props.task.planByType?.[type.value]?.units ?? null,
      minutes: props.task.planByType?.[type.value]?.minutes ?? null,
    }))
    .filter((item) => item.units || item.minutes),
)

const planSummary = computed(() =>
  planRows.value
    .map((item) => {
      const details = []
      if (item.units) details.push(`${item.units} ед.`)
      if (item.minutes) details.push(`${item.minutes} мин`)
      return `${item.label}: ${details.join(' / ')}`
    })
    .join(' · '),
)

const activeDuration = computed(() => {
  if (!openSession.value?.startedAt) return '00:00:00'

  const startedAt = new Date(openSession.value.startedAt).getTime()
  if (!Number.isFinite(startedAt)) return '00:00:00'

  return formatDuration(Math.max(0, now.value - startedAt))
})

const breakDuration = computed(() => {
  if (!openBreak.value?.startedAt) return '00:00:00'

  const startedAt = new Date(openBreak.value.startedAt).getTime()
  if (!Number.isFinite(startedAt)) return '00:00:00'

  return formatDuration(Math.max(0, now.value - startedAt))
})

const syncSelectedType = () => {
  const allowed = availableTypes.value.map((type) => type.value)
  const sessionType = openSession.value?.type
  const rememberedType = allowed.includes(props.task.lastWorkType) ? props.task.lastWorkType : ''
  const singleType = allowed.length === 1 ? allowed[0] : ''
  const nextType = allowed.includes(sessionType) ? sessionType : rememberedType || singleType

  if (!allowed.includes(selectedType.value) || sessionType) {
    selectedType.value = nextType || ''
  }

  const sessionOperation = openSession.value?.operation
  const rememberedOperation = ['create', 'add', 'edit'].includes(props.task.lastWorkOperation)
    ? props.task.lastWorkOperation
    : 'create'
  selectedOperation.value = ['create', 'add', 'edit'].includes(sessionOperation)
    ? sessionOperation
    : rememberedOperation
}

watch(
  () => [
    props.task.id,
    props.task.lastWorkType,
    props.task.workSessions?.length,
    props.task.breaks?.length,
    props.task.lastWorkOperation,
    ...(props.task.types || []),
  ],
  () => syncSelectedType(),
  { immediate: true },
)

const selectType = (type) => {
  if (selectedType.value === type && openSession.value?.type === type) {
    nextTick(() => linkInput.value?.focus())
    return
  }

  selectedType.value = type
  selectedOperation.value = 'create'
  url.value = ''
  pageTitle.value = ''
  error.value = ''
  emit('work-type-change', type)

  if (!openBreak.value) {
    nextTick(() => linkInput.value?.focus())
  }
}

const selectOperation = (operation) => {
  if (selectedOperation.value === operation) return
  selectedOperation.value = operation
  error.value = ''
  emit('work-operation-change', operation)
}

const pause = (reason) => {
  pauseMenuOpen.value = false
  emit('pause-tracking', reason)
}

const normalizeUrl = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const isValidUrl = (value) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const submitAction = () => {
  error.value = ''

  if (openBreak.value) {
    error.value = 'Сначала продолжите таймер.'
    return
  }

  if (!selectedType.value) {
    error.value = 'Сначала выберите тип.'
    return
  }

  if (selectedType.value === 'page' && !pageTitle.value.trim()) {
    error.value = 'Для страницы укажите заголовок.'
    return
  }

  const normalizedUrl = normalizeUrl(url.value)

  if (!normalizedUrl || !isValidUrl(normalizedUrl)) {
    error.value = 'Вставьте корректную ссылку.'
    return
  }

  emit('add-action', {
    id: createEntityId('action'),
    type: selectedType.value,
    action: selectedOperation.value,
    pageTitle: selectedType.value === 'page' ? pageTitle.value.trim() : '',
    url: normalizedUrl,
    createdAt: new Date().toISOString(),
    units: 1,
  })

  url.value = ''
  pageTitle.value = ''
  nextTick(() => linkInput.value?.focus())
}

const typeLabel = (type) => types.find((item) => item.value === type)?.label || type

const locationLabel = (location) => (location === 'office' ? 'Офис' : 'Дом')

const breakReasonLabel = (reason) =>
  breakReasons.find((item) => item.value === reason)?.label || 'Перерыв'

const formatDuration = (durationMs) => {
  const totalSeconds = Math.floor(durationMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

const formatDate = (value) => {
  if (!value) return 'Не указана'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>
