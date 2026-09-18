<template>
  <div class="flex items-center justify-between mb-12">

    <div class="flex flex-col gap-3">
      <h2 class="text-2xl">
        Доброе утро, Давид!
      </h2>

      <span class="text-[18px] text-gray-400">
        Четверг, Сентябрь 17
      </span>
    </div>


    <LocationSwitcher />

  </div>
</template>


<script setup>
import LocationSwitcher from './LocationSwitcher.vue'
</script>