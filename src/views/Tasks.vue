<template>
  <section class="flex flex-col p-6 w-full h-full text-white">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Задачи</h1>

      <p class="text-gray-400 mt-2">
        Создавайте задачи и отслеживайте текущую работу
      </p>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <TaskForm :editTask="editTask" @saved="handleSave" />

      <TaskList
        :tasks="tasks"
        @edit="editTask = $event"
        @update="updateTasks"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import TaskForm from '@/components/tasks/TaskForm.vue'

import TaskList from '@/components/tasks/TaskList.vue'

import { getTasks, saveTasks } from '@/utils/taskStorage'

const tasks = ref([])

const editTask = ref(null)

const handleSave = (task) => {
  if (!task) {
    editTask.value = null

    return
  }

  const index = tasks.value.findIndex((item) => item.id === task.id)

  if (index !== -1) {
    tasks.value[index] = task
  } else {
    tasks.value.push(task)
  }

  saveTasks(tasks.value)

  editTask.value = null
}

const updateTasks = (newTasks) => {
  tasks.value = newTasks

  saveTasks(tasks.value)
}

onMounted(() => {
  tasks.value = getTasks()
})
</script>
