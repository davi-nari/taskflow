<template>
  <span
    :class="[
      'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
      currentStyle.wrapper,
      currentStyle.text,
    ]"
  >
    <span class="w-2 h-2 rounded-full" :class="currentStyle.dot" />

    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'todo',
  },

  label: {
    type: String,
    default: '',
  },
})

const styles = {
  todo: {
    wrapper: 'bg-gray-100',

    text: 'text-gray-600',

    dot: 'bg-gray-400',
  },

  progress: {
    wrapper: 'bg-blue-100',

    text: 'text-blue-600',

    dot: 'bg-blue-500',
  },

  paused: {
    wrapper: 'bg-orange-100',

    text: 'text-orange-600',

    dot: 'bg-orange-500',
  },

  done: {
    wrapper: 'bg-green-100',

    text: 'text-green-600',

    dot: 'bg-green-500',
  },
}

const currentStyle = computed(() => {
  return styles[props.type] || styles.todo
})
</script>
