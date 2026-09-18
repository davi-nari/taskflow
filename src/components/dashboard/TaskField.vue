<template>
  <div class="mb-6">
    <label class="block mb-2">
      {{ label }}
    </label>

    <div class="relative">
      <input
        :placeholder="placeholder"
        class="w-full py-2 px-4 rounded-md border border-[#555] bg-transparent text-gray-300 placeholder:text-gray-500 outline-none focus:border-gray-400"
      />

      <a
        v-if="link"
        href=""
        target="_blank"
        class="absolute right-5 top-1/2 -translate-y-1/2"
      >
        <ExternalLink class="w-4 h-4" />
      </a>
    </div>
  </div>
</template>

<script setup>
import { ExternalLink } from '@lucide/vue'

defineProps({
  label: String,

  placeholder: String,

  link: Boolean,
})
</script>
