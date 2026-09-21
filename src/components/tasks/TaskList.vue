<template>
  <div>
    <h2 class="text-xl font-semibold mb-5">Мои задачи</h2>

    <div class="rounded-xl border border-[#555] overflow-hidden">
      <div v-if="!tasks.length" class="p-8 text-center text-gray-500">
        Пока нет задач
      </div>

      <div
        v-for="task in tasks"
        :key="task.id"
        class="p-5 border-b border-[#333] hover:bg-[#181818] cursor-pointer transition-colors"
        @click="$emit('edit', task)"
      >
        <div class="flex justify-between items-start gap-4 mb-3">
          <h3 class="font-semibold min-w-0 break-words">
            {{ task.title }}
          </h3>

          <div class="flex items-center gap-2 shrink-0">
            <div class="relative">
              <button
                type="button"
                class="rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-blue-500/70"
                :aria-expanded="opened === task.id"
                aria-label="Изменить статус задачи"
                @click.stop="changeStatus(task)"
              >
                <StatusBadge :type="task.status || 'todo'" />
              </button>

              <div
                v-if="opened === task.id"
                class="absolute right-0 mt-2 w-52 rounded-xl border border-[#3A3A3A] bg-[#151515] p-2 shadow-2xl z-20"
                @click.stop
              >
                <button
                  v-for="status in statuses"
                  :key="status.value"
                  type="button"
                  class="flex w-full items-center rounded-lg px-2 py-2 text-left transition hover:bg-[#242424]"
                  @click="setStatus(task, status.value)"
                >
                  <StatusBadge :type="status.value" :label="status.label" />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
              title="Удалить задачу"
              aria-label="Удалить задачу"
              @click.stop="requestDelete(task)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="flex gap-2 flex-wrap mb-3">
          <span
            v-for="type in task.types"
            :key="type"
            class="px-3 py-1 rounded-full bg-[#333] text-xs"
          >
            {{ typeName(type) }}
          </span>
        </div>

        <div v-if="task.category" class="mb-3 text-xs text-gray-500">
          Категория: <span class="text-gray-300">{{ task.category }}</span>
        </div>

        <p class="text-sm text-gray-400">
          {{ task.description || 'Без описания' }}
        </p>
      </div>
    </div>

    <div
      v-if="blockedBy"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-[2px]"
      @click.self="blockedBy = null"
    >
      <div class="w-full max-w-md rounded-2xl border border-[#3A3A3A] bg-[#171717] p-6 shadow-2xl">
        <div class="mb-4 grid h-11 w-11 place-items-center rounded-full bg-[#FFF0DC] text-[#E78318]">
          <span class="text-lg font-bold leading-none">!</span>
        </div>

        <h3 class="mb-2 text-lg font-semibold text-white">Уже есть задача в работе</h3>
        <p class="text-sm leading-6 text-gray-400">
          Чтобы взять другую задачу в работу, сначала переведите
          <span class="font-medium text-white">«{{ blockedBy.title }}»</span>
          в статус «Приостановлена» или «Готово».
        </p>

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            @click="goToDashboard"
          >
            Перейти в Dashboard
          </button>
          <button
            type="button"
            class="rounded-lg border border-[#444] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-[#222]"
            @click="blockedBy = null"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2 } from '@lucide/vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { changeTaskStatus, getWorkLocation } from '@/utils/taskStorage'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit', 'update', 'delete'])
const router = useRouter()

const opened = ref(null)
const blockedBy = ref(null)

const statuses = [
  { value: 'todo', label: 'К выполнению' },
  { value: 'progress', label: 'В работе' },
  { value: 'paused', label: 'Приостановлена' },
  { value: 'done', label: 'Готово' },
]

const changeStatus = (task) => {
  opened.value = opened.value === task.id ? null : task.id
}

const setStatus = (task, status) => {
  if (status === 'progress') {
    const anotherActiveTask = props.tasks.find(
      (item) => item.id !== task.id && item.status === 'progress',
    )

    if (anotherActiveTask) {
      blockedBy.value = anotherActiveTask
      opened.value = null
      return
    }
  }

  const updated = props.tasks.map((item) => {
    if (item.id === task.id) {
      return changeTaskStatus(item, status, {
        location: getWorkLocation(),
      })
    }

    return item
  })

  emit('update', updated)
  opened.value = null

  if (status === 'progress') {
    router.push('/')
  }
}

const goToDashboard = () => {
  blockedBy.value = null
  router.push('/')
}

const requestDelete = (task) => {
  const confirmed = window.confirm(`Удалить задачу «${task.title}»?`)

  if (!confirmed) return

  opened.value = null
  emit('delete', task.id)
}

const typeName = (type) => {
  const names = {
    attribute: 'Атрибуты',
    product: 'Карточки',
    description: 'Описание',
    page: 'Страницы',
  }

  return names[type] ?? type
}
</script>
