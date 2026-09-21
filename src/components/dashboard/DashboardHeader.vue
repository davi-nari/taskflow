<template>
  <div class="mb-12 flex flex-wrap items-center justify-between gap-6">
    <div class="flex flex-col gap-3">
      <h2 class="text-2xl">Доброе утро, Давид!</h2>
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-[18px] text-gray-400">{{ formattedDate }}</span>
        <span class="rounded-full border border-[#303030] bg-[#171717] px-3 py-1 text-xs text-gray-500">
          По графику: {{ scheduleLabel }}
        </span>
        <span class="rounded-full border border-[#303030] bg-[#171717] px-3 py-1 text-xs text-gray-500">
          {{ workdayStart }} - {{ workdayEnd }}
        </span>
        <span
          v-if="workdayEnded"
          class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
        >
          Рабочий день завершён
        </span>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        :class="[
          'rounded-lg border px-4 py-2.5 text-sm font-medium transition',
          workdayEnded
            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
            : 'border-[#3A3A3A] bg-[#151515] text-gray-300 hover:border-[#555] hover:bg-[#202020]',
        ]"
        @click="$emit('workday-action')"
      >
        {{ workdayEnded ? 'Продолжить рабочий день' : 'Завершить рабочий день' }}
      </button>

      <LocationSwitcher
        :model-value="location"
        @update:model-value="$emit('location-change', $event)"
      />
    </div>
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
  workdayEnded: {
    type: Boolean,
    default: false,
  },
  workdayStart: {
    type: String,
    default: '10:00',
  },
  workdayEnd: {
    type: String,
    default: '18:00',
  },
})

defineEmits(['location-change', 'workday-action'])

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
