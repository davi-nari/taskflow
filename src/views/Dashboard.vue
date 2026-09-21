<template>
  <section class="flex min-h-full w-full flex-col text-white">
    <DashboardHeader
      :location="location"
      :schedule-mode="scheduleMode"
      :workday-ended="workdayEnded"
      :workday-start="workdayStart"
      :workday-end="workdayEnd"
      @location-change="changeLocation"
      @workday-action="handleWorkdayAction"
    />

    <div
      v-if="workdayEnded"
      class="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4"
    >
      <div>
        <div class="text-sm font-medium text-emerald-200">Рабочий день завершён</div>
        <div class="mt-1 text-xs text-emerald-200/55">
          Таймер остановлен. Активная задача остаётся в работе и продолжится новой сессией в следующий рабочий день.
        </div>
      </div>
      <button
        type="button"
        class="rounded-lg border border-emerald-500/25 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
        @click="resumeWorkday"
      >
        Продолжить сегодня
      </button>
    </div>

    <template v-if="activeTask">
      <div :class="workdayEnded ? 'pointer-events-none opacity-60' : ''">
        <TaskCard
          :task="activeTask"
          @status-change="changeStatus"
          @work-type-change="changeWorkType"
          @work-operation-change="changeWorkOperation"
          @add-action="addAction"
          @pause-tracking="pauseTracking"
          @resume-tracking="resumeTracking"
        />
      </div>

      <TaskTable
        :actions="activeTask.actions || []"
        @edit-action="editAction"
        @delete-action="deleteAction"
      />
    </template>

    <div
      v-else
      class="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-[#3A3A3A] bg-[#151515]/40 px-8 text-center"
    >
      <div class="max-w-md">
        <div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#1F1F1F] text-gray-400">
          <span class="h-2.5 w-2.5 rounded-full bg-gray-500" />
        </div>

        <h3 class="mb-2 text-lg font-semibold">Нет задачи в работе</h3>
        <p class="text-sm leading-6 text-gray-500">
          Переведите нужную задачу в статус «В работе». Одновременно активной может быть только одна задача.
        </p>

        <RouterLink
          to="/tasks"
          class="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Перейти к задачам
        </RouterLink>
      </div>
    </div>

    <div
      v-if="endDayConfirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-[2px]"
      @click.self="endDayConfirmOpen = false"
    >
      <div class="w-full max-w-md rounded-2xl border border-[#3A3A3A] bg-[#171717] p-6 shadow-2xl">
        <h3 class="text-lg font-semibold">Завершить рабочий день?</h3>
        <p class="mt-2 text-sm leading-6 text-gray-500">
          Текущая рабочая сессия и активный перерыв будут закрыты сейчас. Задача останется в статусе «В работе».
        </p>
        <div class="mt-4 rounded-xl border border-[#303030] bg-[#101010] px-4 py-3 text-xs text-gray-500">
          Стандартный график: <span class="text-gray-300">{{ workdayStart }} - {{ workdayEnd }}</span>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-[#444] px-4 py-2.5 text-sm text-gray-300 hover:bg-[#222]" @click="endDayConfirmOpen = false">
            Отмена
          </button>
          <button type="button" class="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-200" @click="finishWorkday">
            Завершить день
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="staleRecovery"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-5 backdrop-blur-[3px]"
    >
      <div class="w-full max-w-lg rounded-2xl border border-amber-500/20 bg-[#171717] p-6 shadow-2xl">
        <div class="mb-4 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
          Незакрытая сессия
        </div>
        <h3 class="text-xl font-semibold">Предыдущий рабочий день не был завершён</h3>
        <p class="mt-2 text-sm leading-6 text-gray-500">
          TaskFlow не будет учитывать ночь как рабочее время. Укажите, когда закончилась предыдущая работа. По умолчанию подставлено окончание графика - {{ workdayEnd }}.
        </p>

        <label class="mt-5 block">
          <span class="mb-2 block text-xs text-gray-500">Закрыть предыдущую сессию в</span>
          <input
            v-model="recoveryCloseAt"
            type="datetime-local"
            class="w-full rounded-lg border border-[#3A3A3A] bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
          />
        </label>
        <p v-if="recoveryError" class="mt-2 text-xs text-red-400">{{ recoveryError }}</p>

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-[#444] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-[#222]"
            @click="useScheduledRecoveryTime"
          >
            Поставить {{ workdayEnd }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400"
            @click="resolveStaleSession"
          >
            Закрыть и продолжить
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import TaskCard from '@/components/dashboard/TaskCard.vue'
import TaskTable from '@/components/dashboard/TaskTable.vue'
import {
  changeTaskStatus,
  closeActiveBreak,
  ensureActiveSession,
  getOpenSession,
  getOpenBreak,
  getTasks,
  getWorkLocation,
  saveTasks,
  saveWorkLocation,
  stopActiveSession,
  switchWorkContext,
  pauseTaskTracking,
  resumeTaskTracking,
} from '@/utils/taskStorage'
import {
  clearWorkdayEnded,
  getScheduleModeForDate,
  getWorkdayHours,
  isWorkdayEndedForDate,
  localDateKey,
  markWorkdayEnded,
  scheduledWorkdayEndForDate,
} from '@/utils/settingsStorage'

const tasks = ref([])
const location = ref('home')
const scheduleMode = ref('off')
const workdayEnded = ref(false)
const workdayStart = ref('10:00')
const workdayEnd = ref('18:00')
const endDayConfirmOpen = ref(false)
const staleRecovery = ref(null)
const recoveryCloseAt = ref('')
const recoveryError = ref('')

const activeTask = computed(() => tasks.value.find((task) => task.status === 'progress'))

const persistTask = (updatedTask) => {
  const index = tasks.value.findIndex((task) => task.id === updatedTask.id)
  if (index === -1) return

  tasks.value[index] = updatedTask
  saveTasks(tasks.value)
}

const ensureTracking = () => {
  if (!activeTask.value || workdayEnded.value || staleRecovery.value) return

  const trackedTask = ensureActiveSession(activeTask.value, location.value)

  if (getOpenSession(trackedTask) && !getOpenSession(activeTask.value)) {
    persistTask(trackedTask)
  }
}

const changeStatus = (status) => {
  if (!activeTask.value || workdayEnded.value) return

  persistTask(
    changeTaskStatus(activeTask.value, status, {
      location: location.value,
    }),
  )
}

const changeWorkType = (type) => {
  if (!activeTask.value || workdayEnded.value) return

  persistTask(
    switchWorkContext(activeTask.value, {
      type,
      operation: 'create',
      location: location.value,
    }),
  )
}

const changeWorkOperation = (operation) => {
  if (!activeTask.value || workdayEnded.value) return

  const openSession = getOpenSession(activeTask.value)
  const type = openSession?.type || activeTask.value.lastWorkType || (activeTask.value.types?.length === 1 ? activeTask.value.types[0] : '')
  if (!type) return

  persistTask(
    switchWorkContext(activeTask.value, {
      type,
      operation,
      location: location.value,
    }),
  )
}

const changeLocation = (nextLocation) => {
  location.value = saveWorkLocation(nextLocation)

  if (!activeTask.value || workdayEnded.value) return

  const openSession = getOpenSession(activeTask.value)
  const rememberedType = activeTask.value.types?.includes(activeTask.value.lastWorkType)
    ? activeTask.value.lastWorkType
    : ''
  const type = openSession?.type || rememberedType || (activeTask.value.types?.length === 1 ? activeTask.value.types[0] : '')
  const operation = openSession?.operation || activeTask.value.lastWorkOperation || 'create'

  if (!type) return

  persistTask(
    switchWorkContext(activeTask.value, {
      type,
      operation,
      location: location.value,
    }),
  )
}

const pauseTracking = (reason) => {
  if (!activeTask.value || workdayEnded.value) return

  persistTask(
    pauseTaskTracking(activeTask.value, {
      reason,
    }),
  )
}

const resumeTracking = () => {
  if (!activeTask.value || workdayEnded.value) return

  persistTask(
    resumeTaskTracking(activeTask.value, {
      location: location.value,
    }),
  )
}

const editAction = (patch) => {
  if (!activeTask.value) return

  const updatedTask = {
    ...activeTask.value,
    actions: (activeTask.value.actions || []).map((action) =>
      action.id === patch.id ? { ...action, ...patch } : action,
    ),
    updatedAt: patch.editedAt || new Date().toISOString(),
  }

  persistTask(updatedTask)
}

const deleteAction = (actionId) => {
  if (!activeTask.value) return

  const updatedTask = {
    ...activeTask.value,
    actions: (activeTask.value.actions || []).filter((action) => action.id !== actionId),
    updatedAt: new Date().toISOString(),
  }

  persistTask(updatedTask)
}

const addAction = (action) => {
  if (!activeTask.value || getOpenBreak(activeTask.value) || workdayEnded.value) return

  let updatedTask = switchWorkContext(activeTask.value, {
    type: action.type,
    operation: action.action,
    location: location.value,
    startedAt: action.createdAt,
  })

  const openSession = getOpenSession(updatedTask)

  updatedTask = {
    ...updatedTask,
    actions: [
      ...(updatedTask.actions || []),
      {
        ...action,
        location: location.value,
        workSessionId: openSession?.id || null,
      },
    ],
    updatedAt: action.createdAt,
  }

  persistTask(updatedTask)
}

const handleWorkdayAction = () => {
  if (workdayEnded.value) {
    resumeWorkday()
    return
  }
  endDayConfirmOpen.value = true
}

const finishWorkday = () => {
  const endedAt = new Date().toISOString()

  if (activeTask.value) {
    let updatedTask = stopActiveSession(activeTask.value, endedAt)
    updatedTask = closeActiveBreak(updatedTask, endedAt)
    persistTask(updatedTask)
  }

  markWorkdayEnded(endedAt)
  workdayEnded.value = true
  endDayConfirmOpen.value = false
}

const resumeWorkday = () => {
  clearWorkdayEnded()
  workdayEnded.value = false
  ensureTracking()
}

const toLocalDateTimeInput = (date) => {
  const value = new Date(date)
  const pad = (number) => String(number).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

const findStaleTracking = () => {
  if (!activeTask.value) return null
  const openSession = getOpenSession(activeTask.value)
  const openBreak = getOpenBreak(activeTask.value)
  const source = openBreak || openSession
  if (!source?.startedAt) return null

  const started = new Date(source.startedAt)
  if (Number.isNaN(started.getTime()) || localDateKey(started) >= localDateKey(new Date())) return null

  const scheduledEnd = scheduledWorkdayEndForDate(started)
  const closeAt = scheduledEnd.getTime() >= started.getTime() ? scheduledEnd : started
  return { source, started, closeAt }
}

const prepareStaleRecovery = () => {
  const stale = findStaleTracking()
  if (!stale) return false
  staleRecovery.value = stale
  recoveryCloseAt.value = toLocalDateTimeInput(stale.closeAt)
  recoveryError.value = ''
  return true
}

const useScheduledRecoveryTime = () => {
  if (!staleRecovery.value) return
  const scheduled = scheduledWorkdayEndForDate(staleRecovery.value.started)
  recoveryCloseAt.value = toLocalDateTimeInput(scheduled)
}

const resolveStaleSession = () => {
  if (!activeTask.value || !staleRecovery.value) return
  recoveryError.value = ''

  const closeDate = new Date(recoveryCloseAt.value)
  if (Number.isNaN(closeDate.getTime())) {
    recoveryError.value = 'Укажите корректные дату и время.'
    return
  }
  if (closeDate.getTime() < staleRecovery.value.started.getTime()) {
    recoveryError.value = 'Время окончания не может быть раньше начала сессии.'
    return
  }

  const closeAt = closeDate.toISOString()
  let updatedTask = stopActiveSession(activeTask.value, closeAt)
  updatedTask = closeActiveBreak(updatedTask, closeAt)
  staleRecovery.value = null
  persistTask(updatedTask)

  if (!workdayEnded.value) {
    const resumedTask = ensureActiveSession(updatedTask, location.value)
    if (getOpenSession(resumedTask)) persistTask(resumedTask)
  }
}

onMounted(() => {
  scheduleMode.value = getScheduleModeForDate()
  location.value = getWorkLocation()
  tasks.value = getTasks()
  const hours = getWorkdayHours()
  workdayStart.value = hours.start
  workdayEnd.value = hours.end
  workdayEnded.value = isWorkdayEndedForDate()

  if (!prepareStaleRecovery()) ensureTracking()
})
</script>
