<template>
  <div class="rounded-xl border border-[#404040] bg-[#151515]/40 p-6">
    <div class="mb-8 flex items-start justify-between gap-6">
      <div class="min-w-0">
        <div class="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
          Активная задача
        </div>
        <h3 class="break-words text-xl font-semibold text-white">
          {{ task.title }}
        </h3>
      </div>

      <div class="relative shrink-0">
        <button
          type="button"
          class="rounded-full outline-none transition hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-blue-500/70"
          :aria-expanded="statusMenuOpen"
          @click="statusMenuOpen = !statusMenuOpen"
        >
          <StatusBadge :type="task.status" />
        </button>

        <div
          v-if="statusMenuOpen"
          class="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-[#3A3A3A] bg-[#151515] p-2 shadow-2xl"
        >
          <div class="px-2 pb-2 pt-1 text-xs text-gray-500">Завершить текущую работу</div>

          <button
            v-for="status in availableStatuses"
            :key="status.value"
            type="button"
            class="flex w-full items-center rounded-lg px-2 py-2 text-left transition hover:bg-[#242424]"
            @click="setStatus(status.value)"
          >
            <StatusBadge :type="status.value" :label="status.label" />
          </button>
        </div>
      </div>
    </div>

    <TaskInfo
      :task="task"
      @add-action="$emit('add-action', $event)"
      @work-type-change="$emit('work-type-change', $event)"
      @work-operation-change="$emit('work-operation-change', $event)"
      @pause-tracking="$emit('pause-tracking', $event)"
      @resume-tracking="$emit('resume-tracking')"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TaskInfo from './TaskInfo.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

defineProps({
  task: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['status-change', 'add-action', 'work-type-change', 'work-operation-change', 'pause-tracking', 'resume-tracking'])

const statusMenuOpen = ref(false)

const availableStatuses = [
  { value: 'paused', label: 'Приостановлена' },
  { value: 'done', label: 'Готово' },
]

const setStatus = (status) => {
  statusMenuOpen.value = false
  emit('status-change', status)
}
</script>
