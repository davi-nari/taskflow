<template>
  <aside class="app-sidebar flex flex-col items-start max-w-65 w-full h-screen p-4">
    <!-- Logo -->
    <div class="flex w-full items-center justify-between mb-9">
      <RouterLink to="/" class="text-2xl font-bold">
        Task<span class="text-[#FFFF00]">Flow</span>
      </RouterLink>
      <span class="text-sm text-gray-400">1.5.0</span>
    </div>

    <!-- Navigation -->
    <nav class="w-full">
      <ul class="flex flex-col gap-2">
        <li v-for="item in menuItems" :key="item.path">
          <RouterLink
            :to="item.path"
            class="flex items-center gap-3 w-full p-2 rounded-md font-medium text-gray-400 hover:bg-[#121212] hover:text-white transition-colors"
            active-class="bg-[#121212] text-white"
          >
            <component :is="item.icon" class="w-4 h-4" />

            {{ item.name }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import {
  House,
  SquareCheckBig,
  BarChart3,
  FileInput,
  Settings,
  Import,
} from '@lucide/vue'

const menuItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: House,
  },
  {
    name: 'Tasks',
    path: '/tasks',
    icon: SquareCheckBig,
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: FileInput,
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Import',
    path: '/import',
    icon: Import,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },
]
</script>

<style scoped lang="scss"></style>
