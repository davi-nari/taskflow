<template>
  <div class="min-h-screen bg-[#0B0B0B] px-5 py-10 text-white">
    <div class="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center justify-center">
      <div class="w-full rounded-2xl border border-[#303030] bg-[#141414] p-7 shadow-2xl">
        <div class="mb-7">
          <div class="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-white text-sm font-bold text-black">TF</div>
          <h1 class="text-2xl font-semibold">Вход в TaskFlow</h1>
          <p class="mt-2 text-sm leading-6 text-gray-500">
            Войдите пользователем, которого создали в Supabase Authentication.
          </p>
        </div>

        <div v-if="!configured" class="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-6 text-red-300">
          Supabase не настроен. Проверьте переменные окружения проекта.
        </div>

        <form class="space-y-4" @submit.prevent="login">
          <label class="block">
            <span class="mb-2 block text-sm text-gray-400">Email</span>
            <input
              v-model.trim="email"
              type="email"
              autocomplete="email"
              required
              class="w-full rounded-xl border border-[#3A3A3A] bg-[#0F0F0F] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm text-gray-400">Пароль</span>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full rounded-xl border border-[#3A3A3A] bg-[#0F0F0F] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-blue-500"
              placeholder="••••••••"
            />
          </label>

          <div v-if="errorMessage" class="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            :disabled="loading || !configured"
            class="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading ? 'Подключаемся...' : 'Войти' }}
          </button>
        </form>

        <div class="mt-6 border-t border-[#292929] pt-5 text-xs leading-5 text-gray-600">
          Данные после входа загружаются из Supabase. При первом подключении существующие локальные задачи автоматически переносятся в базу.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isSupabaseConfigured, signInWithPassword } from '@/data/supabaseApi'
import { bootstrapWorkspace, resetWorkspaceBootstrap } from '@/data/workspaceBootstrap'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const configured = isSupabaseConfigured()

const login = async () => {
  if (!configured || loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    await signInWithPassword(email.value, password.value)
    resetWorkspaceBootstrap()
    await bootstrapWorkspace({ force: true })
    await router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch (error) {
    errorMessage.value = error?.message || 'Не удалось войти в TaskFlow.'
  } finally {
    loading.value = false
  }
}
</script>
