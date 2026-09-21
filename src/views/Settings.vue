<template>
  <section class="min-h-full w-full text-white">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Настройки</h1>
      <p class="mt-2 text-sm text-gray-500">
        Рабочий график и категории, которые используются при создании задач.
      </p>
    </div>

    <div class="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-6">
        <div class="mb-6">
          <h2 class="text-lg font-semibold">Рабочая неделя</h2>
          <p class="mt-1 text-sm text-gray-500">
            TaskFlow автоматически подставляет место работы на Dashboard по текущему дню. Его всё равно можно изменить вручную на конкретный день.
          </p>
        </div>

        <div class="overflow-hidden rounded-xl border border-[#303030]">
          <div class="grid grid-cols-[minmax(120px,1fr)_minmax(300px,1.4fr)] bg-[#101010] px-4 py-3 text-xs text-gray-600">
            <span>День</span>
            <span>По умолчанию</span>
          </div>

          <div
            v-for="day in days"
            :key="day.value"
            class="grid grid-cols-[minmax(120px,1fr)_minmax(300px,1.4fr)] items-center gap-4 border-t border-[#2D2D2D] px-4 py-4"
          >
            <div>
              <div class="font-medium text-gray-200">{{ day.label }}</div>
              <div v-if="isToday(day.value)" class="mt-1 text-xs text-blue-400">Сегодня</div>
            </div>

            <div class="inline-flex w-fit rounded-xl border border-[#333] bg-[#0F0F0F] p-1">
              <button
                v-for="mode in scheduleModes"
                :key="mode.value"
                type="button"
                :class="[
                  'rounded-lg px-4 py-2 text-sm transition',
                  schedule[day.value] === mode.value
                    ? mode.activeClass
                    : 'text-gray-500 hover:bg-[#1C1C1C] hover:text-gray-300',
                ]"
                @click="setDayMode(day.value, mode.value)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-xl border border-[#2C2C2C] bg-[#101010] px-4 py-3 text-xs text-gray-500">
          Базовый график уже выставлен: <span class="text-gray-300">Пн и Ср - офис, Вт, Чт и Пт - дом, Сб и Вс - выходные.</span>
        </div>

        <div class="mt-4 rounded-xl border border-[#2C2C2C] bg-[#101010] p-4">
          <div class="mb-3">
            <div class="text-sm font-medium text-gray-300">Рабочие часы</div>
            <div class="mt-1 text-xs text-gray-600">Используются как стандартный график и для восстановления незакрытых сессий.</div>
          </div>
          <div class="flex flex-wrap items-end gap-3">
            <label>
              <span class="mb-1.5 block text-xs text-gray-600">Начало</span>
              <input v-model="workdayStart" type="time" class="rounded-lg border border-[#363636] bg-[#0B0B0B] px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            </label>
            <label>
              <span class="mb-1.5 block text-xs text-gray-600">Конец</span>
              <input v-model="workdayEnd" type="time" class="rounded-lg border border-[#363636] bg-[#0B0B0B] px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            </label>
            <button type="button" class="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-gray-200" @click="saveWorkdayHours">Сохранить</button>
          </div>
          <div v-if="workdaySaved" class="mt-2 text-xs text-emerald-400">Рабочие часы сохранены.</div>
        </div>
      </div>

      <div class="rounded-2xl border border-[#303030] bg-[#151515] p-6">
        <div class="mb-6">
          <h2 class="text-lg font-semibold">Категории</h2>
          <p class="mt-1 text-sm text-gray-500">
            В новой задаче можно выбрать только категорию из этого списка.
          </p>
        </div>

        <form class="mb-5 flex gap-2" @submit.prevent="createCategory">
          <input
            v-model="newCategory"
            type="text"
            placeholder="Например: Кроссовки"
            class="min-w-0 flex-1 rounded-lg border border-[#3A3A3A] bg-[#101010] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500"
          />
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            <Plus class="h-4 w-4" />
            Добавить
          </button>
        </form>

        <p v-if="categoryError" class="mb-4 text-sm text-red-400">{{ categoryError }}</p>

        <div v-if="!categories.length" class="rounded-xl border border-dashed border-[#3A3A3A] px-5 py-10 text-center text-sm text-gray-600">
          Категорий пока нет. Создайте первую категорию, после этого она появится в форме задачи.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="category in categories"
            :key="category"
            class="flex items-center justify-between gap-4 rounded-xl border border-[#2E2E2E] bg-[#101010] px-4 py-3"
          >
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-gray-200">{{ category }}</div>
              <div class="mt-1 text-xs text-gray-600">
                {{ usageCount(category) ? `Используется в ${usageCount(category)} задачах` : 'Пока не используется' }}
              </div>
            </div>

            <button
              type="button"
              :disabled="usageCount(category) > 0"
              :title="usageCount(category) > 0 ? 'Сначала измените категорию в задачах, где она используется' : 'Удалить категорию'"
              class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
              @click="deleteCategory(category)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 rounded-2xl border border-[#303030] bg-[#151515] p-6">
      <div class="flex flex-wrap items-start justify-between gap-5">
        <div class="max-w-2xl">
          <div class="mb-2 flex items-center gap-2">
            <ShieldCheck class="h-5 w-5 text-emerald-400" />
            <h2 class="text-lg font-semibold">Ссылка для руководителя</h2>
          </div>
          <p class="text-sm leading-6 text-gray-500">
            Отдельная read-only страница без меню TaskFlow. На ней видны текущая задача, результат, средние показатели и ссылки-доказательства. Рабочее время и паузы не показываются.
          </p>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-[#3A3A3A] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-[#202020]"
            @click="openManagerPreview"
          >
            <ExternalLink class="h-4 w-4" />
            Открыть
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            @click="copyManagerLink"
          >
            <Copy class="h-4 w-4" />
            {{ managerCopied ? 'Скопировано' : 'Копировать ссылку' }}
          </button>
        </div>
      </div>

      <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="min-w-0 flex-1 rounded-xl border border-[#303030] bg-[#101010] px-4 py-3 font-mono text-xs text-gray-400">
          <div class="truncate" :title="managerLink">{{ managerLink }}</div>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#3A3A3A] px-4 py-3 text-xs text-gray-400 transition hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300"
          @click="regenerateManagerLink"
        >
          <RefreshCw class="h-4 w-4" />
          Перевыпустить ссылку
        </button>
      </div>

      <div v-if="managerError" class="mt-4 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs leading-5 text-red-300">
        {{ managerError }}
      </div>

      <div class="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-xs leading-5 text-emerald-200/80">
        Ссылка работает через Supabase и доступна руководителю с любого устройства. Рабочие сессии и паузы не входят в публичный payload.
      </div>
    </div>

    <div class="mt-6 rounded-2xl border border-[#303030] bg-[#151515] p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">Аккаунт Supabase</h2>
          <p class="mt-1 text-sm text-gray-500">{{ userEmail || 'Авторизованный пользователь' }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-[#3A3A3A] px-4 py-2.5 text-sm text-gray-300 transition hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300"
          @click="logout"
        >
          Выйти
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Copy, ExternalLink, Plus, RefreshCw, ShieldCheck, Trash2 } from '@lucide/vue'
import { getCurrentUser, signOutSupabase } from '@/data/supabaseApi'
import { ensureManagerAccessToken, rotateManagerAccessToken } from '@/data/managerAccess'
import { resetWorkspaceBootstrap } from '@/data/workspaceBootstrap'
import { getTasks } from '@/utils/taskStorage'
import {
  addCategory,
  getSettings,
  removeCategory,
  syncCategoriesFromTasks,
  updateSchedule,
  updateWorkdayHours,
} from '@/utils/settingsStorage'

const router = useRouter()

const days = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 0, label: 'Воскресенье' },
]

const scheduleModes = [
  { value: 'office', label: 'Офис', activeClass: 'bg-blue-600 text-white' },
  { value: 'home', label: 'Дом', activeClass: 'bg-emerald-600 text-white' },
  { value: 'off', label: 'Выходной', activeClass: 'bg-[#333] text-white' },
]

const schedule = reactive({})
const categories = ref([])
const tasks = ref([])
const newCategory = ref('')
const categoryError = ref('')
const managerToken = ref('')
const managerCopied = ref(false)
const managerLoading = ref(false)
const managerError = ref('')
const userEmail = ref('')
const workdayStart = ref('10:00')
const workdayEnd = ref('18:00')
const workdaySaved = ref(false)
const publicBaseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || 'https://taskflowus.netlify.app').replace(/\/+$/, '')

const managerLink = computed(() => {
  if (!managerToken.value || typeof window === 'undefined') return ''
  return `${publicBaseUrl}/manager/${managerToken.value}`
})

const usageMap = computed(() => {
  const map = new Map()
  tasks.value.forEach((task) => {
    const category = String(task.category || '').trim()
    if (!category) return
    map.set(category, (map.get(category) || 0) + 1)
  })
  return map
})

const isToday = (day) => new Date().getDay() === day
const usageCount = (category) => usageMap.value.get(category) || 0

const setDayMode = (day, mode) => {
  schedule[day] = mode
  const saved = updateSchedule({ ...schedule })
  Object.assign(schedule, saved)
}

const saveWorkdayHours = () => {
  const saved = updateWorkdayHours(workdayStart.value, workdayEnd.value)
  workdayStart.value = saved.workdayStart
  workdayEnd.value = saved.workdayEnd
  workdaySaved.value = true
  window.setTimeout(() => { workdaySaved.value = false }, 1600)
}

const createCategory = () => {
  categoryError.value = ''
  const name = newCategory.value.trim()

  if (!name) {
    categoryError.value = 'Введите название категории.'
    return
  }

  const existed = categories.value.some(
    (category) => category.toLocaleLowerCase('ru-RU') === name.toLocaleLowerCase('ru-RU'),
  )

  categories.value = addCategory(name)
  newCategory.value = ''

  if (existed) categoryError.value = 'Такая категория уже есть.'
}

const deleteCategory = (category) => {
  if (usageCount(category) > 0) return
  categories.value = removeCategory(category)
}

const copyManagerLink = async () => {
  if (!managerLink.value) return

  try {
    await navigator.clipboard.writeText(managerLink.value)
    managerCopied.value = true
    window.setTimeout(() => { managerCopied.value = false }, 1800)
  } catch {
    managerCopied.value = false
  }
}

const openManagerPreview = () => {
  if (!managerLink.value) return
  window.open(managerLink.value, '_blank', 'noopener,noreferrer')
}

const regenerateManagerLink = async () => {
  if (managerLoading.value) return
  if (!window.confirm('Старая ссылка перестанет работать. Перевыпустить доступ?')) return

  managerLoading.value = true
  managerError.value = ''
  try {
    managerToken.value = await rotateManagerAccessToken()
    managerCopied.value = false
  } catch (error) {
    managerError.value = error?.message || 'Не удалось создать ссылку через Supabase.'
  } finally {
    managerLoading.value = false
  }
}

const logout = async () => {
  await signOutSupabase()
  resetWorkspaceBootstrap()
  await router.replace('/login')
}

onMounted(async () => {
  tasks.value = getTasks()
  categories.value = syncCategoriesFromTasks(tasks.value)
  const currentSettings = getSettings()
  Object.assign(schedule, currentSettings.schedule)
  workdayStart.value = currentSettings.workdayStart || '10:00'
  workdayEnd.value = currentSettings.workdayEnd || '18:00'
  const user = await getCurrentUser()
  userEmail.value = user?.email || ''

  managerLoading.value = true
  managerError.value = ''
  try {
    managerToken.value = await ensureManagerAccessToken()
  } catch (error) {
    managerError.value = error?.message || 'Не удалось получить ссылку через Supabase.'
  } finally {
    managerLoading.value = false
  }
})
</script>
