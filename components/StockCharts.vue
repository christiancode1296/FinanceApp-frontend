<template>
  <div class="space-y-6">

    <!-- Search Section -->
    <UCard>


      <div class="flex gap-3 items-end">
        <UFormGroup label="Ticker-Symbol" class="flex-1">
          <UInput
              v-model.trim="symbol"
              @keyup.enter="reload()"
              placeholder="AAPL"
              size="lg"
          />
        </UFormGroup>

        <UButton
            @click="reload()"
            :loading="loading"
            size="lg"
            icon="i-lucide-refresh-cw"
        >
          Laden
        </UButton>
      </div>

      <UAlert
          v-if="errorMsg"
          color="red"
          variant="soft"
          :title="errorMsg"
          class="mt-4"
      />
    </UCard>

    <!-- Chart -->
    <UCard>
      <div class="h-96">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </UCard>

    <!-- Last Prices -->
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Schlusskurse der letzten 5 Tage</h3>
      </template>

      <div v-if="lastPrices.length === 0" class="text-gray-500 text-center py-4">
        Keine Daten verfügbar
      </div>

      <ul v-else class="space-y-2">
        <li
            v-for="(entry, index) in lastPrices"
            :key="index"
            class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <span class="font-medium"> {{formatDate(entry.date)}} </span>
          <span class="text-lg font-bold text-primary"> {{ entry.price.toFixed(2) }}  USD
  </span>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const symbol = ref("AAPL")
const chartCanvas = ref(null)
const errorMsg = ref("")
const loading = ref(false)
const lastPrices = ref([])

let chart
let abortController

const loadChartJs = async () => {
  const ChartJS = await import("chart.js")
  const {
    Chart,
    LineController, LineElement, PointElement,
    LinearScale, CategoryScale,
    Tooltip, Legend, Filler
  } = ChartJS

  Chart.register(
      LineController, LineElement, PointElement,
      LinearScale, CategoryScale, Tooltip, Legend, Filler
  )

  return Chart
}

const fetchSeries = async (sym) => {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  loading.value = true
  errorMsg.value = ""

  try {
    const url = `http://localhost:8080/api/stocks/${encodeURIComponent(sym)}`
    const res = await fetch(url, { signal: abortController.signal })

    if (!res.ok) throw new Error(`${sym}: HTTP ${res.status}`)

    const data = await res.json()

    let rows = []
    if (Array.isArray(data?.historical)) rows = data.historical
    else if (Array.isArray(data?.data)) rows = data.data
    else if (Array.isArray(data?.results)) rows = data.results
    else if (
        Array.isArray(data?.historicalStockList) &&
        data.historicalStockList.length > 0 &&
        Array.isArray(data.historicalStockList[0]?.historical)
    ) {
      rows = data.historicalStockList[0].historical
    } else if (Array.isArray(data)) rows = data

    const norm = rows
        .map((p) => {
          const date = p.date || p.formattedDate || p.datetime || p.label || p.timestamp || null
          const raw = p.close ?? p.adjClose ?? p.price ?? p.value ?? null
          const close = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : raw
          return { date, close }
        })
        .filter((p) => p.date && typeof p.close === 'number' && !Number.isNaN(p.close))

    if (!norm.length) {
      throw new Error(`Keine Kursdaten erhalten (Symbol: ${sym}).`)
    }

    norm.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    const series = norm.slice(-360)

    const labels = series.map((p) => p.date)
    const values = series.map((p) => p.close)

    return { labels, values }
  } catch (e) {
    if (e.name !== 'AbortError') {
      errorMsg.value = e.message || String(e)
    }
    return { labels: [], values: [] }
  } finally {
    loading.value = false
  }
}

const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "-"
  const d = new Date(yyyyMmDd)
  if (isNaN(d)) return "-"
  return new Intl.DateTimeFormat(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit"
  }).format(d)
}

const reload = async () => {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  loading.value = true
  errorMsg.value = ""

  try {
    const { labels, values } = await fetchSeries(symbol.value.toUpperCase())

    const minLength = Math.min(labels.length, values.length)
    const validLabels = labels.slice(-minLength)
    const validValues = values.slice(-minLength)

    const lastEntries = validLabels
        .map((date, i) => {
          const price = validValues[i]
          return price !== undefined && !isNaN(price)
              ? { date, price }  // ← Wichtig: Objekt mit date und price
              : null
        })
        .filter(Boolean)
        .slice(-5)
        .reverse()

    lastPrices.value = lastEntries
    await renderChart(validLabels, validValues)
  } catch (e) {
    errorMsg.value = e.message || String(e)
    await renderChart([], [])
  } finally {
    loading.value = false
  }
}

const renderChart = async (labels, values) => {
  const Chart = await loadChartJs()
  const ctx = chartCanvas.value.getContext("2d")

  if (chart) chart.destroy()

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: symbol.value,
          data: values,
          tension: 0.3,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: true },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (items) => (items.length ? formatDate(items[0].label) : ""),
            label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} USD`,
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            callback: (_, idx) => formatDate(labels[idx]),
            maxRotation: 0,
            autoSkip: true,
          },
        },
        y: {
          display: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
      },
    },
  })
}

onMounted(async () => { await reload() })

onUnmounted(() => {
  if (abortController) abortController.abort()
  if (chart) chart.destroy()
})
</script>