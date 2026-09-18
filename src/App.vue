<template>
  <div class="flex gap-6 h-[calc(100vh-48px)] overflow-hidden">
    <Sidebar />
    <main
      class="bg-[#121212] w-full rounded-xl overflow-hidden overflow-y-auto custom-scroll p-6"
    >
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
</script>

<style lang="scss" scoped></style>
