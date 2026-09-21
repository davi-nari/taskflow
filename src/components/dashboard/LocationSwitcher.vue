<template>
  <div class="inline-flex rounded-lg border border-[#3A3A3A] bg-[#111] p-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="[
        'rounded-md px-4 py-2 text-sm font-medium transition',
        modelValue === option.value
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-[#202020] hover:text-white',
      ]"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'home',
  },
})

defineEmits(['update:modelValue'])

const options = [
  { value: 'home', label: 'Дом' },
  { value: 'office', label: 'Офис' },
]
</script>
