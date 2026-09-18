<template>
  <div class="w-full text-sm text-gray-400">
    <div class="grid grid-cols-2 gap-10 mb-8">
      <!-- Левая часть -->

      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span> Тип: </span>

          <TaskTypeBadge type="attribute" />

          <TaskTypeBadge type="card" />
        </div>

        <div>Категория:</div>

        <div>Количество:</div>

        <div>Сделано сегодня:</div>
      </div>

      <!-- Правая часть -->

      <div class="flex flex-col gap-3">
        <div>Дата:</div>

        <div>Время в работе:</div>

        <div>Создана:</div>

        <div>Дедлайн:</div>
      </div>
    </div>

    <TaskField label="Ссылка на результат" placeholder="https://..." link />

    <TaskField label="Комментарий" placeholder="Комментарий..." />
  </div>
</template>

<script setup>
import TaskTypeBadge from './TaskTypeBadge.vue'
import TaskField from './TaskField.vue'
</script>
