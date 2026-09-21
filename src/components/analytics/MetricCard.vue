<template>
  <div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
    <div class="text-xs font-medium text-gray-500">{{ label }}</div>
    <div class="mt-3 text-2xl font-semibold tracking-tight text-white">{{ value }}</div>
    <div class="mt-2 text-xs text-gray-600">{{ hint }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  hint: { type: String, default: '' },
})
</script>
