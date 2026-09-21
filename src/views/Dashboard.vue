<template>
  <section class="flex min-h-full w-full flex-col text-white">
    <DashboardHeader :location="location" :schedule-mode="scheduleMode" @location-change="changeLocation" />

    <template v-if="activeTask">
      <TaskCard
        :task="activeTask"
        @status-change="changeStatus"
        @work-type-change="changeWorkType"
        @work-operation-change="changeWorkOperation"
        @add-action="addAction"
        @pause-tracking="pauseTracking"
        @resume-tracking="resumeTracking"
      />

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
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import TaskCard from '@/components/dashboard/TaskCard.vue'
import TaskTable from '@/components/dashboard/TaskTable.vue'
import {
  changeTaskStatus,
  ensureActiveSession,
  getOpenSession,
  getOpenBreak,
  getTasks,
  getWorkLocation,
  saveTasks,
  saveWorkLocation,
  switchWorkContext,
  pauseTaskTracking,
  resumeTaskTracking,
} from '@/utils/taskStorage'
import { getScheduleModeForDate } from '@/utils/settingsStorage'

const tasks = ref([])
const location = ref('home')
const scheduleMode = ref('off')

const activeTask = computed(() => tasks.value.find((task) => task.status === 'progress'))

const persistTask = (updatedTask) => {
  const index = tasks.value.findIndex((task) => task.id === updatedTask.id)
  if (index === -1) return

  tasks.value[index] = updatedTask
  saveTasks(tasks.value)
}

const ensureTracking = () => {
  if (!activeTask.value) return

  const trackedTask = ensureActiveSession(activeTask.value, location.value)

  if (getOpenSession(trackedTask) && !getOpenSession(activeTask.value)) {
    persistTask(trackedTask)
  }
}

const changeStatus = (status) => {
  if (!activeTask.value) return

  persistTask(
    changeTaskStatus(activeTask.value, status, {
      location: location.value,
    }),
  )
}

const changeWorkType = (type) => {
  if (!activeTask.value) return

  persistTask(
    switchWorkContext(activeTask.value, {
      type,
      operation: 'create',
      location: location.value,
    }),
  )
}

const changeWorkOperation = (operation) => {
  if (!activeTask.value) return

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

  if (!activeTask.value) return

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
  if (!activeTask.value) return

  persistTask(
    pauseTaskTracking(activeTask.value, {
      reason,
    }),
  )
}

const resumeTracking = () => {
  if (!activeTask.value) return

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
  if (!activeTask.value || getOpenBreak(activeTask.value)) return

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

onMounted(() => {
  scheduleMode.value = getScheduleModeForDate()
  location.value = getWorkLocation()
  tasks.value = getTasks()
  ensureTracking()
})
</script>
