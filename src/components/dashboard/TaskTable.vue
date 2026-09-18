<template>
  <div class="mt-8">
    <!-- Заголовок -->
    <h3 class="text-lg font-semibold mb-5">Действия внутри задачи</h3>

    <div class="rounded-lg border border-[#555] overflow-hidden">
      <!-- Шапка -->
      <div
        class="grid grid-cols-[50px_130px_140px_180px_1fr_250px_120px] px-5 py-3 bg-[#181818] text-gray-400 text-sm"
      >
        <span>#</span>
        <span>Тип</span>
        <span>Действие</span>
        <span>Объект</span>
        <span>Ссылка</span>
        <span>Детали</span>
        <span>Статус</span>
      </div>

      <!-- Строки -->
      <div
        v-for="action in actions"
        :key="action.id"
        class="grid grid-cols-[50px_130px_140px_180px_1fr_250px_120px] items-center px-5 py-4 border-t border-[#333] hover:bg-[#181818] transition"
      >
        <!-- Номер -->
        <span class="text-gray-500">
          {{ action.id }}
        </span>

        <!-- Тип -->
        <div>
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              action.typeColor,
            ]"
          >
            {{ action.type }}
          </span>
        </div>

        <!-- Действие -->
        <span class="text-gray-300">
          {{ action.action }}
        </span>

        <!-- Объект -->
        <span class="text-gray-300">
          {{ action.object }}
        </span>

        <!-- Ссылка -->
        <div class="truncate pr-5">
          <a
            v-if="action.url"
            href="#"
            class="text-blue-400 hover:underline truncate block"
          >
            {{ action.url }}
          </a>

          <span v-else class="text-gray-600"> - </span>
        </div>

        <!-- Детали -->
        <div class="text-gray-400 text-sm">
          {{ action.details }}
        </div>

        <!-- Статус -->
        <div>
          <span
            class="px-3 py-1 rounded-full bg-blue-300 text-blue-600 text-xs font-medium"
          >
            {{ action.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const actions = [
  {
    id: 1,

    type: 'Атрибуты',

    typeColor: 'bg-[#D3F0EA] text-[#0E946A]',

    action: 'Создание',

    object: 'Назначение',

    url: '',

    details: 'Значение: Для бега',

    status: 'Готово',
  },

  {
    id: 2,

    type: 'Атрибуты',

    typeColor: 'bg-[#D3F0EA] text-[#0E946A]',

    action: 'Добавление',

    object: 'Nike Air Zoom',

    url: 'di-sport.uz/products/nike-air',

    details: 'Атрибут: Назначение / Для бега',

    status: 'Готово',
  },

  {
    id: 3,

    type: 'Атрибуты',

    typeColor: 'bg-[#D3F0EA] text-[#0E946A]',

    action: 'Добавление',

    object: 'Adidas Runner',

    url: 'di-sport.uz/products/adidas-runner',

    details: 'Атрибут: Назначение / Для бега',

    status: 'В работе',
  },

  {
    id: 4,

    type: 'Страница',

    typeColor: 'bg-[#DDDBFE] text-[#6454F8]',

    action: 'Создание',

    object: 'Кроссовки для бега',

    url: 'di-sport.uz/running',

    details: 'SEO страница',

    status: 'Новая',
  },

  {
    id: 5,

    type: 'Описание',

    typeColor: 'bg-[#CDE7FF] text-[#2563EB]',

    action: 'Обновление',

    object: 'Nike Air',

    url: 'di-sport.uz/products/nike-air',

    details: 'SEO RU + UZ',

    status: 'В работе',
  },
]
</script>
