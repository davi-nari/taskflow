<template>
  <section class="flex flex-col w-full h-full text-white">
    <DashboardHeader />

    <TaskCard />
    <TaskTable />
  </section>
</template>

<script setup>
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import TaskCard from '@/components/dashboard/TaskCard.vue'
import TaskTable from '@/components/dashboard/TaskTable.vue'
</script>
