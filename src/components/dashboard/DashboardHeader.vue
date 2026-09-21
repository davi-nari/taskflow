<template>
  <div class="mb-12 flex items-center justify-between gap-6">
    <div class="flex flex-col gap-3">
      <h2 class="text-2xl">Доброе утро, Давид!</h2>
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-[18px] text-gray-400">{{ formattedDate }}</span>
        <span class="rounded-full border border-[#303030] bg-[#171717] px-3 py-1 text-xs text-gray-500">
          По графику: {{ scheduleLabel }}
        </span>
      </div>
    </div>

    <LocationSwitcher
      :model-value="location"
      @update:model-value="$emit('location-change', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LocationSwitcher from './LocationSwitcher.vue'

const props = defineProps({
  location: {
    type: String,
    default: 'home',
  },
  scheduleMode: {
    type: String,
    default: 'off',
  },
})

defineEmits(['location-change'])

const formattedDate = computed(() => {
  const value = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return value.charAt(0).toUpperCase() + value.slice(1)
})

const scheduleLabel = computed(() => {
  if (props.scheduleMode === 'office') return 'офис'
  if (props.scheduleMode === 'home') return 'дом'
  return 'выходной'
})
</script>
