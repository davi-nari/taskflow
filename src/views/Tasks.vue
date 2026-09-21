<template>
  <section class="flex h-full w-full flex-col p-6 text-white">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Задачи</h1>
      <p class="mt-2 text-gray-400">Создавайте задачи и отслеживайте текущую работу</p>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <TaskForm :editTask="editTask" :categories="categories" @saved="handleSave" />

      <TaskList
        :tasks="tasks"
        @edit="editTask = $event"
        @update="updateTasks"
        @delete="deleteTask"
      />
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import TaskList from '@/components/tasks/TaskList.vue'
import {
  ensureActiveSession,
  getOpenSession,
  getTasks,
  getWorkLocation,
  normalizeTask,
  saveTasks,
  stopActiveSession,
} from '@/utils/taskStorage'
import { syncCategoriesFromTasks } from '@/utils/settingsStorage'

const tasks = ref([])
const editTask = ref(null)
const categories = ref([])

const reconcileTrackingAfterEdit = (task) => {
  let nextTask = normalizeTask(task)
  const openSession = getOpenSession(nextTask)

  if (openSession && !nextTask.types.includes(openSession.type)) {
    nextTask = stopActiveSession(nextTask)
    nextTask = {
      ...nextTask,
      lastWorkType: '',
    }
  }

  if (nextTask.status === 'progress') {
    nextTask = ensureActiveSession(nextTask, getWorkLocation())
  }

  return nextTask
}

const handleSave = (task) => {
  if (!task) {
    editTask.value = null
    return
  }

  const reconciledTask = reconcileTrackingAfterEdit(task)
  const index = tasks.value.findIndex((item) => item.id === reconciledTask.id)

  if (index !== -1) {
    tasks.value[index] = reconciledTask
  } else {
    tasks.value.push(reconciledTask)
  }

  saveTasks(tasks.value)
  categories.value = syncCategoriesFromTasks(tasks.value)
  editTask.value = null
}

const updateTasks = (newTasks) => {
  tasks.value = newTasks
  saveTasks(tasks.value)
  categories.value = syncCategoriesFromTasks(tasks.value)
}

const deleteTask = (taskId) => {
  tasks.value = tasks.value.filter((task) => task.id !== taskId)
  saveTasks(tasks.value)
  categories.value = syncCategoriesFromTasks(tasks.value)

  if (editTask.value?.id === taskId) {
    editTask.value = null
  }
}

onMounted(() => {
  tasks.value = getTasks()
  categories.value = syncCategoriesFromTasks(tasks.value)
})
</script>
