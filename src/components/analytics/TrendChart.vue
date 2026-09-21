<template>
  <div class="w-full">
    <div v-if="!hasData" class="flex h-64 items-center justify-center text-sm text-gray-600">
      Пока нет данных за выбранный период
    </div>
    <div v-else>
      <div ref="chartRoot" class="min-h-[270px] w-full"></div>
      <div v-if="libraryUnavailable" class="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
        Интерактивный график не загрузился. Проверьте подключение к интернету и обновите страницу.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  points: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'График',
  },
  valueFormatter: {
    type: Function,
    default: (value) => String(value),
  },
  axisFormatter: {
    type: Function,
    default: null,
  },
})

const chartRoot = ref(null)
const libraryUnavailable = ref(false)
let chart = null

const values = computed(() => props.points.map((item) => Number(item.value) || 0))
const hasData = computed(() => values.value.some((value) => value > 0))

const makeOptions = () => ({
  chart: {
    type: 'area',
    height: 270,
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 350 },
    fontFamily: 'inherit',
  },
  theme: { mode: 'dark' },
  series: [
    {
      name: props.title,
      data: props.points.map((item) => Number(item.value) || 0),
    },
  ],
  xaxis: {
    categories: props.points.map((item) => item.label),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { colors: '#6B7280', fontSize: '11px' },
      rotate: 0,
      hideOverlappingLabels: true,
    },
    tooltip: { enabled: false },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: {
      style: { colors: '#6B7280', fontSize: '11px' },
      formatter: (value) => props.axisFormatter ? props.axisFormatter(value) : props.valueFormatter(value),
    },
  },
  grid: {
    borderColor: '#292929',
    strokeDashArray: 0,
    padding: { left: 4, right: 8, top: 0, bottom: 0 },
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.2,
      opacityFrom: 0.3,
      opacityTo: 0.02,
      stops: [0, 90, 100],
    },
  },
  dataLabels: { enabled: false },
  markers: {
    size: 0,
    hover: { size: 5 },
  },
  tooltip: {
    theme: 'dark',
    x: { show: true },
    y: {
      formatter: (value) => props.valueFormatter(value),
      title: { formatter: () => '' },
    },
  },
  noData: { text: 'Нет данных' },
})

const renderChart = async () => {
  await nextTick()
  if (!hasData.value || !chartRoot.value) return

  const ApexCharts = window.ApexCharts
  if (!ApexCharts) {
    libraryUnavailable.value = true
    return
  }

  libraryUnavailable.value = false

  if (chart) {
    await chart.updateOptions(makeOptions(), false, true)
    return
  }

  chart = new ApexCharts(chartRoot.value, makeOptions())
  await chart.render()
}

watch(
  () => props.points,
  async () => {
    if (!hasData.value && chart) {
      chart.destroy()
      chart = null
      return
    }
    await renderChart()
  },
  { deep: true },
)

onMounted(() => {
  renderChart()
})

onBeforeUnmount(() => {
  if (chart) chart.destroy()
  chart = null
})
</script>
