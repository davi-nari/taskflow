<template>
  <div class="rounded-xl border border-[#555] p-6">
    <!-- Название -->

    <div class="mb-8">
      <label class="block mb-2 text-gray-400"> Название задачи </label>

      <input
        v-model="form.title"
        placeholder="Например: Добавить атрибут Назначение для беговой обуви"
        class="w-full py-3 px-4 rounded-md border border-[#555] bg-transparent text-white placeholder:text-gray-600 outline-none"
      />
    </div>

    <!-- Тип задачи -->

    <div class="mb-8">
      <label class="block mb-3 text-gray-400"> Тип задачи </label>

      <div class="flex gap-3 flex-wrap">
        <button
          v-for="type in types"
          :key="type.value"
          @click="toggleType(type.value)"
          :class="[
            'px-5 py-3 rounded-lg border transition',

            form.types.includes(type.value)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-[#555] text-gray-300 hover:bg-[#181818]',
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Дедлайн -->

    <div class="mb-8">
      <label class="block mb-2 text-gray-400"> Дедлайн </label>

      <input
        v-model="form.deadline"
        type="date"
        class="w-full py-3 px-4 rounded-md border border-[#555] bg-transparent text-white outline-none"
      />
    </div>

    <!-- Описание -->

    <div class="mb-8">
      <label class="block mb-2 text-gray-400"> Описание задачи </label>

      <textarea
        v-model="form.description"
        placeholder="Например:

Создать новый атрибут Назначение.

Добавить его товарам категории Кроссовки.

Создать посадочную страницу."
        class="w-full h-40 resize-none py-3 px-4 rounded-md border border-[#555] bg-transparent text-white placeholder:text-gray-600 outline-none"
      ></textarea>
    </div>

    <div class="flex gap-3">
      <button
        @click="save"
        class="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
      >
        {{ form.id ? 'Сохранить изменения' : 'Создать задачу' }}
      </button>

      <button
        v-if="form.id"
        @click="cancel"
        class="px-8 py-3 rounded-lg border border-[#555] text-gray-300 hover:bg-[#181818]"
      >
        Отмена
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  editTask: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['saved'])

const types = [
  {
    label: 'Атрибуты',
    value: 'attribute',
  },

  {
    label: 'Карточки',
    value: 'product',
  },

  {
    label: 'Описание',
    value: 'description',
  },

  {
    label: 'Страницы',
    value: 'page',
  },
]

const form = reactive({
  id: null,

  title: '',

  types: [],

  deadline: '',

  description: '',
})

const reset = () => {
  form.id = null
  form.title = ''
  form.types = []
  form.deadline = ''
  form.description = ''
}

watch(
  () => props.editTask,

  (task) => {
    if (task) {
      form.id = task.id

      form.title = task.title

      form.types = [...(task.types || [])]

      form.deadline = task.deadline

      form.description = task.description
    } else {
      reset()
    }
  },

  {
    immediate: true,
  },
)

const toggleType = (type) => {
  const index = form.types.indexOf(type)

  if (index === -1) {
    form.types.push(type)
  } else {
    form.types.splice(index, 1)
  }
}

const save = () => {
  if (!form.title.trim()) return

  const task = {
    id: form.id ?? Date.now(),

    title: form.title,

    types: [...form.types],

    deadline: form.deadline,

    description: form.description,

    status: props.editTask?.status ?? 'todo',

    createdAt: props.editTask?.createdAt ?? new Date().toISOString(),

    actions: props.editTask?.actions ?? [],
  }

  emit('saved', task)

  reset()
}

const cancel = () => {
  emit('saved', null)

  reset()
}
</script>
