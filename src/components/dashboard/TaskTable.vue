<template>
  <div class="mt-8">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-semibold">Действия внутри задачи</h3>
        <p v-if="actions.length" class="mt-1 text-xs text-gray-600">
          Последние действия отображаются первыми · по {{ PAGE_SIZE }} на странице
        </p>
      </div>
      <span class="text-sm text-gray-500">Всего: {{ actions.length }}</span>
    </div>

    <div class="overflow-x-auto rounded-xl border border-[#404040]">
      <div class="min-w-[1240px]">
        <div
          class="grid grid-cols-[54px_140px_150px_110px_210px_minmax(260px,1fr)_150px_92px] bg-[#181818] px-5 py-3 text-sm text-gray-500"
        >
          <span>#</span>
          <span>Тип</span>
          <span>Действие</span>
          <span>Место</span>
          <span>Заголовок страницы</span>
          <span>Ссылка</span>
          <span>Добавлено</span>
          <span></span>
        </div>

        <div v-if="!actions.length" class="border-t border-[#333] px-5 py-10 text-center text-sm text-gray-600">
          Пока нет действий. Выберите тип, действие и добавьте первую ссылку.
        </div>

        <div
          v-for="(action, index) in paginatedActions"
          :key="action.id"
          class="grid grid-cols-[54px_140px_150px_110px_210px_minmax(260px,1fr)_150px_92px] items-center border-t border-[#333] px-5 py-4 text-sm transition hover:bg-[#181818]"
        >
          <span class="text-gray-600">{{ chronologicalNumber(index) }}</span>

          <div>
            <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-medium', typeStyle(action.type)]">
              {{ typeLabel(action.type) }}
            </span>
          </div>

          <span class="text-gray-300">{{ actionLabel(action.action) }}</span>
          <span class="text-gray-400">{{ locationLabel(action.location) }}</span>

          <span class="truncate pr-4 text-gray-400" :title="action.pageTitle || ''">
            {{ action.pageTitle || '-' }}
          </span>

          <div class="min-w-0 pr-5">
            <a
              :href="action.url"
              target="_blank"
              rel="noopener noreferrer"
              class="block truncate text-blue-400 hover:underline"
              :title="action.url"
            >
              {{ action.url }}
            </a>
          </div>

          <div class="text-gray-500">
            <div>{{ formatTime(action.createdAt) }}</div>
            <div v-if="action.editedAt" class="mt-1 text-[11px] text-gray-600">изменено</div>
          </div>

          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-blue-500/10 hover:text-blue-300"
              title="Редактировать действие"
              aria-label="Редактировать действие"
              @click="openEditor(action)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
              title="Удалить действие"
              aria-label="Удалить действие"
              @click="confirmDelete(action)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div class="text-xs text-gray-600">
        Показано {{ pageStart + 1 }}-{{ pageEnd }} из {{ actions.length }}
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="currentPage === 1"
          class="grid h-9 w-9 place-items-center rounded-lg border border-[#363636] bg-[#151515] text-gray-400 transition hover:border-[#555] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Предыдущая страница"
          @click="currentPage -= 1"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          :class="[
            'h-9 min-w-9 rounded-lg px-3 text-xs font-medium transition',
            currentPage === page
              ? 'bg-white text-black'
              : 'border border-[#363636] bg-[#151515] text-gray-400 hover:border-[#555] hover:text-white',
          ]"
          @click="currentPage = page"
        >
          {{ page }}
        </button>

        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="grid h-9 w-9 place-items-center rounded-lg border border-[#363636] bg-[#151515] text-gray-400 transition hover:border-[#555] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Следующая страница"
          @click="currentPage += 1"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div
      v-if="editingAction"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-[2px]"
      @click.self="closeEditor"
    >
      <form class="w-full max-w-xl rounded-2xl border border-[#3A3A3A] bg-[#171717] p-6 shadow-2xl" @submit.prevent="saveEdit">
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-white">Редактировать действие</h3>
            <p class="mt-1 text-sm text-gray-500">
              Тип, действие, время и место сохраняются. Здесь можно исправить ссылку и заголовок страницы.
            </p>
          </div>
          <button type="button" class="text-gray-500 transition hover:text-white" @click="closeEditor">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-[#101010] p-4 text-sm">
          <div>
            <div class="text-xs text-gray-600">Тип</div>
            <div class="mt-1 text-gray-300">{{ typeLabel(editingAction.type) }}</div>
          </div>
          <div>
            <div class="text-xs text-gray-600">Действие</div>
            <div class="mt-1 text-gray-300">{{ actionLabel(editingAction.action) }}</div>
          </div>
        </div>

        <label v-if="editingAction.type === 'page'" class="mb-4 block">
          <span class="mb-2 block text-sm text-gray-400">Заголовок страницы</span>
          <input
            v-model="editForm.pageTitle"
            type="text"
            class="w-full rounded-lg border border-[#444] bg-[#101010] px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-sm text-gray-400">Ссылка</span>
          <input
            v-model="editForm.url"
            type="text"
            inputmode="url"
            autocomplete="off"
            class="w-full rounded-lg border border-[#444] bg-[#101010] px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </label>

        <p v-if="editError" class="mt-3 text-sm text-red-400">{{ editError }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-[#444] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-[#222]"
            @click="closeEditor"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="deletingAction"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-[2px]"
      @click.self="cancelDelete"
    >
      <div class="w-full max-w-md rounded-2xl border border-[#3A3A3A] bg-[#171717] p-6 shadow-2xl">
        <div class="mb-5 grid h-11 w-11 place-items-center rounded-full bg-red-500/10 text-red-400">
          <Trash2 class="h-5 w-5" />
        </div>
        <h3 class="text-lg font-semibold text-white">Удалить действие?</h3>
        <p class="mt-2 text-sm leading-6 text-gray-500">
          Ссылка исчезнет из задачи, аналитики и отчётов. Рабочая сессия при этом останется без изменений.
        </p>
        <div class="mt-5 rounded-xl border border-[#303030] bg-[#101010] p-3 text-xs text-gray-500">
          <div class="mb-1 text-gray-300">{{ typeLabel(deletingAction.type) }} · {{ actionLabel(deletingAction.action) }}</div>
          <div class="truncate" :title="deletingAction.url">{{ deletingAction.url }}</div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-[#444] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-[#222]"
            @click="cancelDelete"
          >
            Отмена
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500"
            @click="deleteAction"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from '@lucide/vue'

const PAGE_SIZE = 20

const props = defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit-action', 'delete-action'])

const currentPage = ref(1)
const editingAction = ref(null)
const deletingAction = ref(null)
const editError = ref('')
const editForm = reactive({ url: '', pageTitle: '' })

const sortedActions = computed(() => [...props.actions].sort((a, b) => {
  const aTime = new Date(a.createdAt || 0).getTime()
  const bTime = new Date(b.createdAt || 0).getTime()
  if (aTime !== bTime) return bTime - aTime
  return String(b.id ?? '').localeCompare(String(a.id ?? ''))
}))

const totalPages = computed(() => Math.max(1, Math.ceil(sortedActions.value.length / PAGE_SIZE)))
const pageStart = computed(() => (currentPage.value - 1) * PAGE_SIZE)
const pageEnd = computed(() => Math.min(pageStart.value + PAGE_SIZE, sortedActions.value.length))
const paginatedActions = computed(() => sortedActions.value.slice(pageStart.value, pageEnd.value))

const visiblePages = computed(() => {
  const max = totalPages.value
  const current = currentPage.value
  let start = Math.max(1, current - 2)
  let end = Math.min(max, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

watch(
  () => props.actions.length,
  (nextLength, previousLength) => {
    if (nextLength > previousLength) {
      currentPage.value = 1
      return
    }

    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  },
)

const chronologicalNumber = (index) => props.actions.length - pageStart.value - index

const typeLabel = (type) => {
  const labels = {
    attribute: 'Атрибуты',
    product: 'Карточки',
    description: 'Описание',
    page: 'Страницы',
  }

  return labels[type] ?? type
}

const typeStyle = (type) => {
  const styles = {
    attribute: 'bg-[#18372F] text-[#72D5B5]',
    product: 'bg-[#292447] text-[#B9B0FF]',
    description: 'bg-[#182C42] text-[#8FC4FF]',
    page: 'bg-[#3A2B17] text-[#F4BC72]',
  }

  return styles[type] ?? 'bg-[#2A2A2A] text-gray-300'
}

const actionLabel = (action) => {
  const labels = {
    create: 'Создание',
    add: 'Добавление',
    edit: 'Редактирование',
  }

  return labels[action] ?? action
}

const locationLabel = (location) => {
  if (location === 'office') return 'Офис'
  if (location === 'home') return 'Дом'
  return '-'
}

const normalizeUrl = (value) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const isValidUrl = (value) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const openEditor = (action) => {
  editingAction.value = action
  editForm.url = action.url || ''
  editForm.pageTitle = action.pageTitle || ''
  editError.value = ''
}

const closeEditor = () => {
  editingAction.value = null
  editError.value = ''
}

const saveEdit = () => {
  if (!editingAction.value) return

  editError.value = ''
  const url = normalizeUrl(editForm.url)

  if (!url || !isValidUrl(url)) {
    editError.value = 'Введите корректную ссылку.'
    return
  }

  if (editingAction.value.type === 'page' && !editForm.pageTitle.trim()) {
    editError.value = 'Для страницы укажите заголовок.'
    return
  }

  emit('edit-action', {
    id: editingAction.value.id,
    url,
    pageTitle: editingAction.value.type === 'page' ? editForm.pageTitle.trim() : '',
    editedAt: new Date().toISOString(),
  })

  closeEditor()
}

const confirmDelete = (action) => {
  deletingAction.value = action
}

const cancelDelete = () => {
  deletingAction.value = null
}

const deleteAction = () => {
  if (!deletingAction.value) return
  emit('delete-action', deletingAction.value.id)
  deletingAction.value = null
}

const formatTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>
