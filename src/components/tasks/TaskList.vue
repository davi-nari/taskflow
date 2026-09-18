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
        class="p-5 border-b border-[#333] hover:bg-[#181818] cursor-pointer"
        @click="$emit('edit', task)"
      >
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-semibold">
            {{ task.title }}
          </h3>

          <div class="relative">
            <button
              @click.stop="changeStatus(task)"
              class="px-3 py-1 rounded-full text-xs bg-green-100 text-green-600"
            >
              {{ statusName(task.status) }}
            </button>

            <div
              v-if="opened === task.id"
              class="absolute right-0 mt-2 bg-[#181818] border border-[#555] rounded-lg p-2 z-10"
            >
              <button
                v-for="status in statuses"
                :key="status.value"
                @click.stop="setStatus(task, status.value)"
                class="block w-40 text-left px-3 py-2 hover:bg-[#333]"
              >
                {{ status.label }}
              </button>
            </div>
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

        <p class="text-sm text-gray-400">
          {{ task.description || 'Без описания' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit', 'update'])

const opened = ref(null)

const statuses = [
  {
    value: 'todo',
    label: '⚪ К выполнению',
  },

  {
    value: 'progress',
    label: '🔵 В работе',
  },

  {
    value: 'paused',
    label: '🟠 Приостановлена',
  },

  {
    value: 'done',
    label: '🟢 Готово',
  },
]

const changeStatus = (task) => {
  opened.value = opened.value === task.id ? null : task.id
}

const setStatus = (task, status) => {
  const updated = props.tasks.map((item) => {
    if (item.id === task.id) {
      return {
        ...item,

        status,
      }
    }

    return item
  })

  emit('update', updated)

  opened.value = null
}

const statusName = (status) => {
  return (
    statuses.find((item) => item.value === status)?.label ?? '⚪ К выполнению'
  )
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
