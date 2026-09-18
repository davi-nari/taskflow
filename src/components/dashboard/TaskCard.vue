<template>
  <div class="rounded-lg border p-6 border-gray-500">
    <!-- Заголовок задачи -->
    <div class="flex justify-between items-center mb-9">
      <h3 class="font-bold">Название задачи</h3>

      <div class="flex gap-3 items-center">
        <span
          class="py-1.5 px-4 rounded-full bg-blue-300 text-blue-600 font-semibold text-sm flex items-center gap-2"
        >
          <span class="w-2 h-2 rounded-full bg-blue-600" />

          Статус
        </span>

        <button class="p-2">
          <Ellipsis />
        </button>
      </div>
    </div>

    <TaskInfo />
  </div>
</template>

<script setup>
import { Ellipsis } from '@lucide/vue'
import TaskInfo from './TaskInfo.vue'
</script>
