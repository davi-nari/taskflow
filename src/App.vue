<template>
  <RouterView v-if="isPublicView" />

  <div v-else class="app-shell flex gap-6 h-[calc(100vh-48px)] overflow-hidden">
    <Sidebar />
    <main
      class="app-main bg-[#121212] w-full rounded-xl overflow-hidden overflow-y-auto custom-scroll p-6"
    >
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
const isPublicView = computed(() => Boolean(route.meta.publicView))
</script>
