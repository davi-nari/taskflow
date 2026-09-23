<template>
<section class="text-white">
<h1 class="text-2xl font-bold mb-6">История времени</h1>
<div class="rounded-2xl border border-[#303030] bg-[#151515] p-5">
<div class="space-y-3">
<div v-for="entry in items" :key="entry.id" class="rounded-xl bg-[#101010] p-4 flex justify-between gap-4">
<div>
<div class="font-medium">{{ entry.type }} · {{ entry.location || 'нет' }}</div>
<div class="text-sm text-gray-400">{{ format(entry.started_at) }} - {{ format(entry.ended_at) }}</div>
<div class="text-xs text-gray-500">Действий: {{ entry.actions_count || 0 }}</div>
</div>
<button class="text-red-400 text-sm" @click="remove(entry.id)">Удалить</button>
</div>
<div v-if="!items.length" class="text-gray-500">Записей времени нет</div>
</div>
<div class="mt-5 flex justify-between items-center text-sm">
<button class="px-3 py-2 bg-[#222] rounded" @click="page--" :disabled="page===1">Назад</button>
<span>{{ page }} / {{ pages }}</span>
<button class="px-3 py-2 bg-[#222] rounded" @click="page++" :disabled="page===pages">Вперед</button>
</div>
</div>
</section>
</template>
<script setup>
import { computed, ref, onMounted } from 'vue'
import { getTimeEntries, deleteTimeEntry } from '@/data/timeEntriesRepository'

const rows=ref([])
const page=ref(1)
const size=10
const pages=computed(()=>Math.max(1,Math.ceil(rows.value.length/size)))
const items=computed(()=>rows.value.slice((page.value-1)*size,page.value*size))

function format(v){ return v ? new Date(v).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : '' }

async function load(){
 rows.value=await getTimeEntries(page.value, 10) || []
}

async function remove(id){
 await deleteTimeEntry(id)
 rows.value=rows.value.filter(x=>x.id!==id)
}

onMounted(load)
</script>
