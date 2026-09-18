<template>
  <button
    v-if="type === 'attribute'"
    class="px-3 py-1 rounded-md bg-[#D3F0EA] text-[#0E946A] text-xs flex items-center gap-1"
  >
    <Hash class="w-5 h-5" />

    Атрибуты
  </button>

  <button
    v-else
    class="px-3 py-1 rounded-md bg-[#DDDBFE] text-[#6454F8] text-xs flex items-center gap-1"
  >
    <PlayingCardsFan class="w-5 h-5" />

    Карточки
  </button>
</template>

<script setup>
import { Hash, PlayingCardsFan } from '@lucide/vue'

defineProps({
  type: {
    type: String,
    required: true,
  },
})
</script>
