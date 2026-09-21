<template>
  <section class="min-h-full text-white space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">Импорт</h1>
      <p class="mt-2 text-sm text-gray-500">Экспорт выполненных действий в Google Sheets</p>
    </div>

    <div class="rounded-xl border border-[#303030] bg-[#151515] p-5 space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-medium">Google Sheets Export</h2>
          <p class="text-sm text-gray-500 mt-1">Лист: TaskFlow</p>
        </div>
        <span class="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">Ожидает подключения</span>
      </div>

      <div class="grid grid-cols-3 gap-4 text-sm">
        <div class="rounded-lg bg-[#101010] p-4">Последний экспорт<br><b>-</b></div>
        <div class="rounded-lg bg-[#101010] p-4">Отправлено строк<br><b>{{ rows }}</b></div>
        <div class="rounded-lg bg-[#101010] p-4">Автоэкспорт<br><b>18:20 Asia/Tashkent</b></div>
      </div>

      <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm" @click="exportToday">
        Экспортировать сегодня
      </button>
      <p v-if="message" class="text-sm text-emerald-300">{{ message }}</p>
    </div>

    <div class="rounded-xl border border-[#303030] bg-[#151515] p-5">
      <h2 class="font-medium mb-3">Поиск действий</h2>
      <input v-model="query" class="w-full rounded-lg bg-[#101010] border border-[#333] px-4 py-3" placeholder="Ссылка, заголовок страницы, задача, категория" />
      <div class="mt-4 text-sm text-gray-400">Поиск подготовлен для действий из TaskFlow.</div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { getSupabaseSession } from '../data/supabaseApi'
const rows = ref(0)
const message = ref('')
const query = ref('')

async function exportToday() {
  try {
    const session = await getSupabaseSession()
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-google-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({}),
    })

    const result = await response.json()
    rows.value = result.rows || 0
    message.value = result.success
      ? `Экспорт завершён. Отправлено строк: ${result.rows || 0}`
      : result.error || 'Ошибка экспорта'
  } catch (error) {
    message.value = error.message
  }
}
</script>
