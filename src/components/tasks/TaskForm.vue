<template>
  <div class="rounded-xl border border-[#555] p-6">
    <div class="mb-8">
      <label class="mb-2 block text-gray-400">Название задачи</label>
      <input
        v-model="form.title"
        placeholder="Например: Добавить атрибут Назначение для беговой обуви"
        class="w-full rounded-md border border-[#555] bg-transparent px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
      />
    </div>

    <div class="mb-8">
      <label class="mb-3 block text-gray-400">Тип задачи</label>

      <div class="flex flex-wrap gap-3">
        <button
          v-for="type in types"
          :key="type.value"
          type="button"
          @click="toggleType(type.value)"
          :class="[
            'rounded-lg border px-5 py-3 transition',
            form.types.includes(type.value)
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-[#555] text-gray-300 hover:bg-[#181818]',
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <div class="mb-8">
      <label class="mb-2 block text-gray-400">Категория</label>
      <select
        v-model="form.category"
        :disabled="!categories.length"
        class="w-full rounded-md border border-[#555] bg-[#121212] px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Без категории</option>
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      <p v-if="categories.length" class="mt-2 text-xs text-gray-600">
        Список категорий настраивается в разделе Settings.
      </p>
      <p v-else class="mt-2 text-xs text-amber-500/80">
        Сначала создайте категории в <RouterLink to="/settings" class="underline hover:text-amber-300">Settings</RouterLink>.
      </p>
    </div>

    <div v-if="form.types.length" class="mb-8">
      <div class="mb-3 flex items-end justify-between gap-4">
        <div>
          <label class="block text-gray-400">План по типам</label>
          <p class="mt-1 text-xs text-gray-600">Можно оставить пустым, если план заранее неизвестен.</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-[#3A3A3A]">
        <div class="grid grid-cols-[minmax(150px,1fr)_140px_160px] bg-[#181818] px-4 py-3 text-xs text-gray-500">
          <span>Тип</span>
          <span>Единиц</span>
          <span>План, мин</span>
        </div>

        <div
          v-for="type in selectedTypeRows"
          :key="type.value"
          class="grid grid-cols-[minmax(150px,1fr)_140px_160px] items-center gap-3 border-t border-[#333] px-4 py-3"
        >
          <span class="text-sm text-gray-300">{{ type.label }}</span>
          <input
            v-model="form.planByType[type.value].units"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="Не задано"
            class="w-full rounded-lg border border-[#444] bg-[#101010] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
          />
          <input
            v-model="form.planByType[type.value].minutes"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="Не задано"
            class="w-full rounded-lg border border-[#444] bg-[#101010] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
          />
        </div>
      </div>
    </div>

    <div class="mb-8">
      <label class="mb-2 block text-gray-400">Дедлайн</label>
      <input
        v-model="form.deadline"
        type="date"
        class="w-full rounded-md border border-[#555] bg-transparent px-4 py-3 text-white outline-none focus:border-blue-500"
      />
    </div>

    <div class="mb-8">
      <label class="mb-2 block text-gray-400">Описание задачи</label>
      <textarea
        v-model="form.description"
        placeholder="Например:\n\nСоздать новый атрибут Назначение.\n\nДобавить его товарам категории Кроссовки.\n\nСоздать посадочную страницу."
        class="h-40 w-full resize-none rounded-md border border-[#555] bg-transparent px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
      ></textarea>
    </div>

    <p v-if="formError" class="mb-4 text-sm text-red-400">{{ formError }}</p>

    <div class="flex gap-3">
      <button
        type="button"
        @click="save"
        class="rounded-lg bg-blue-600 px-8 py-3 text-white transition hover:bg-blue-700"
      >
        {{ form.id ? 'Сохранить изменения' : 'Создать задачу' }}
      </button>

      <button
        v-if="form.id"
        type="button"
        @click="cancel"
        class="rounded-lg border border-[#555] px-8 py-3 text-gray-300 hover:bg-[#181818]"
      >
        Отмена
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { createEntityId } from '@/utils/taskStorage'

const props = defineProps({
  editTask: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['saved'])

const types = [
  { label: 'Атрибуты', value: 'attribute' },
  { label: 'Карточки', value: 'product' },
  { label: 'Описание', value: 'description' },
  { label: 'Страницы', value: 'page' },
]

const form = reactive({
  id: null,
  title: '',
  types: [],
  category: '',
  planByType: {},
  deadline: '',
  description: '',
})

const formError = ref('')

const selectedTypeRows = computed(() => types.filter((type) => form.types.includes(type.value)))

const emptyPlan = () => ({ units: '', minutes: '' })

const ensurePlanRow = (type) => {
  if (!form.planByType[type]) {
    form.planByType[type] = emptyPlan()
  }
}

const reset = () => {
  form.id = null
  form.title = ''
  form.types = []
  form.category = ''
  form.planByType = {}
  form.deadline = ''
  form.description = ''
  formError.value = ''
}

watch(
  () => props.editTask,
  (task) => {
    if (!task) {
      reset()
      return
    }

    form.id = task.id
    form.title = task.title || ''
    form.types = [...(task.types || [])]
    form.category = task.category || ''
    form.deadline = task.deadline || ''
    form.description = task.description || ''
    form.planByType = {}

    form.types.forEach((type) => {
      form.planByType[type] = {
        units: task.planByType?.[type]?.units ?? '',
        minutes: task.planByType?.[type]?.minutes ?? '',
      }
    })

    formError.value = ''
  },
  { immediate: true },
)

const toggleType = (type) => {
  formError.value = ''
  const index = form.types.indexOf(type)

  if (index === -1) {
    form.types.push(type)
    ensurePlanRow(type)
  } else {
    form.types.splice(index, 1)
  }
}

const normalizePositiveNumber = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') return null

  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

const save = () => {
  formError.value = ''

  if (!form.title.trim()) {
    formError.value = 'Укажите название задачи.'
    return
  }

  if (!form.types.length) {
    formError.value = 'Выберите хотя бы один тип задачи.'
    return
  }

  const planByType = form.types.reduce((acc, type) => {
    const plan = form.planByType[type] || emptyPlan()

    acc[type] = {
      units: normalizePositiveNumber(plan.units),
      minutes: normalizePositiveNumber(plan.minutes),
    }

    return acc
  }, {})

  const now = new Date().toISOString()
  const task = {
    id: form.id ?? createEntityId('task'),
    title: form.title.trim(),
    types: [...form.types],
    category: form.category.trim(),
    planByType,
    deadline: form.deadline,
    description: form.description.trim(),
    status: props.editTask?.status ?? 'todo',
    createdAt: props.editTask?.createdAt ?? now,
    updatedAt: now,
    completedAt: props.editTask?.completedAt ?? null,
    actions: props.editTask?.actions ?? [],
    workSessions: props.editTask?.workSessions ?? [],
    breaks: props.editTask?.breaks ?? [],
    lastWorkType: props.editTask?.lastWorkType ?? '',
    lastWorkOperation: props.editTask?.lastWorkOperation ?? 'create',
  }

  emit('saved', task)
  reset()
}

const cancel = () => {
  emit('saved', null)
  reset()
}
</script>
