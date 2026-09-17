<template>
  <aside class="flex flex-col items-start max-w-80 w-full h-screen">
    <RouterLink to="/" class="text-2xl font-bold"
      >Task<span class="text-[#FFFF00]">Flow</span></RouterLink
    >
    <ul>
      <li class="">
        <RouterLink to="/" class="flex gap-3 items-center"><House class="w-4 h-4" />Dashboard</RouterLink>
      </li>
      <li><RouterLink to="/tasks">Tasks</RouterLink></li>
    </ul>
  </aside>
</template>
te
<script setup>
import { House } from "@lucide/vue";
</script>
  
<style lang="scss" scoped>
</style>