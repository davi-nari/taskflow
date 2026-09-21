<template>
  <span
    :class="[
      'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap',
      currentStyle.wrapper,
      currentStyle.text,
    ]"
  >
    <span
      :class="['h-2 w-2 shrink-0 rounded-full', currentStyle.dot]"
      aria-hidden="true"
    />

    {{ displayLabel }}
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
    wrapper: 'bg-[#F1F3F6]',
    text: 'text-[#4E5969]',
    dot: 'bg-[#8B98AA]',
    label: 'К выполнению',
  },

  progress: {
    wrapper: 'bg-[#E7F0FF]',
    text: 'text-[#2F6FEB]',
    dot: 'bg-[#3278F6]',
    label: 'В работе',
  },

  paused: {
    wrapper: 'bg-[#FFF0DC]',
    text: 'text-[#E78318]',
    dot: 'bg-[#FF8A00]',
    label: 'Приостановлена',
  },

  done: {
    wrapper: 'bg-[#E5F7EA]',
    text: 'text-[#178A48]',
    dot: 'bg-[#1FA45B]',
    label: 'Готово',
  },
}

const currentStyle = computed(() => styles[props.type] || styles.todo)
const displayLabel = computed(() => props.label || currentStyle.value.label)
</script>
