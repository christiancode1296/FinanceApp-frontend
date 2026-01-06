<template>
  <div class="space-y-6">
    <!-- Portfolio Overview Card -->
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Portfolio Übersicht</h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="flex flex-col gap-2">
          <span class="text-sm text-gray-500">Gesamtwert</span>
          <span class="text-3xl font-bold text-primary">
            {{ totalValue.toFixed(2) }} {{ getCurrencySymbol() }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-sm text-gray-500">Performance ({{ getTimeRangeLabel }})</span>
          <span
              :class="getPerformanceColor(portfolioPerformance)"
              class="text-3xl font-bold flex items-center gap-2"
          >
            <UIcon
                :name="portfolioPerformance >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                class="w-6 h-6"
            />
            {{ portfolioPerformance !== null ? `${portfolioPerformance}%` : '–' }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-sm text-gray-500">Anzahl Aktien</span>
          <span class="text-3xl font-bold">{{ watchlistItems.length }}</span>
        </div>
      </div>

      <!-- ✨ Zeitraum-Toggle -->
      <div class="flex gap-2 mt-6">
        <UButton
            v-for="range in timeRanges"
            :key="range.value"
            @click="selectedTimeRange = range.value"
            :variant="selectedTimeRange === range.value ? 'solid' : 'soft'"
            size="sm"
        >
          {{ range.label }}
        </UButton>
      </div>
    </UCard>

    <!-- Individual Stock Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard v-for="item in watchlistItems" :key="item.symbol">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold">{{ item.name }}</h3>
              <UBadge size="sm" color="gray">{{ item.symbol }}</UBadge>
            </div>

            <div class="flex items-center gap-3">
              <!-- Performance -->
              <div
                  :class="getPerformanceColor(stockPerformance[item.symbol])"
                  class="font-bold text-lg flex items-center gap-1"
              >
                <UIcon
                    :name="stockPerformance[item.symbol] >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                    class="w-4 h-4"
                />
                {{ stockPerformance[item.symbol] !== null ? `${stockPerformance[item.symbol]}%` : '–' }}
              </div>

              <!-- Remove Button -->
              <UButton
                  @click="toggleWatchlist(item)"
                  icon="i-lucide-trash-2"
                  color="red"
                  variant="soft"
                  size="sm"
              />
            </div>
          </div>
        </template>

        <div class="h-64">
          <canvas :ref="(el) => { if (el) chartRefs[item.symbol] = el }"></canvas>
        </div>

        <template #footer>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500">Aktueller Kurs:</span>
            <span class="font-bold text-lg">
              {{ currentPrices[item.symbol] || '–' }} {{ getCurrencySymbol() }}
            </span>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Empty State -->
    <UCard v-if="watchlistItems.length === 0">
      <div class="text-center py-12">
        <UIcon name="i-lucide-star-off" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 class="text-xl font-semibold mb-2">Keine Aktien in der Watchlist</h3>
        <p class="text-gray-500 mb-6">Füge Aktien hinzu, um ihre Performance zu verfolgen</p>
        <UButton to="/" icon="i-lucide-plus">
          Aktien hinzufügen
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

// ============================================================
// State
// ============================================================

const { watchlist, toggleWatchlist } = useWatchlist()
const chartRefs = ref({})
const charts = ref({})
const stockData = ref({})
const currency = ref('USD')
const exchangeRate = ref(1)

// ✨ Zeitraum-State
const selectedTimeRange = ref(365) // Standard: 1 Jahr

const timeRanges = [
  { label: '30 Tage', value: 30 },
  { label: '6 Monate', value: 180 },
  { label: '1 Jahr', value: 365 },
  { label: '3 Jahre', value: 1095 }
]

// ============================================================
// Computed Properties
// ============================================================

const watchlistItems = computed(() => watchlist.value || [])

const getTimeRangeLabel = computed(() => {
  const range = timeRanges.find(r => r.value === selectedTimeRange.value)
  return range?.label || 'Zeitraum'
})

// ✨ Gefilterte Daten pro Symbol
const filteredStockData = computed(() => {
  const result = {}

  for (const symbol in stockData.value) {
    const data = stockData.value[symbol]
    if (!data?.length) continue

    const today = new Date()
    const startDate = new Date(today)

    switch (selectedTimeRange.value) {
      case 30:
        startDate.setDate(today.getDate() - 30)
        break
      case 180:
        startDate.setMonth(today.getMonth() - 6)
        break
      case 365:
        startDate.setFullYear(today.getFullYear() - 1)
        break
      case 1095:
        startDate.setFullYear(today.getFullYear() - 3)
        break
    }

    result[symbol] = data.filter(p => {
      const priceDate = new Date(p.date)
      return priceDate >= startDate
    })
  }

  return result
})

// ✨ Performance pro Symbol
const stockPerformance = computed(() => {
  const result = {}

  for (const symbol in filteredStockData.value) {
    const data = filteredStockData.value[symbol]
    if (!data?.length) {
      result[symbol] = null
      continue
    }

    const startPrice = data[0]?.price
    const endPrice = data[data.length - 1]?.price

    if (!startPrice || !endPrice) {
      result[symbol] = null
      continue
    }

    result[symbol] = (((endPrice - startPrice) / startPrice) * 100).toFixed(2)
  }

  return result
})

// Portfolio-Performance
const portfolioPerformance = computed(() => {
  const performances = Object.values(stockPerformance.value).filter(p => p !== null)
  if (performances.length === 0) return null

  const avg = performances.reduce((sum, p) => sum + parseFloat(p), 0) / performances.length
  return avg.toFixed(2)
})

// Aktueller Preis pro Symbol
const currentPrices = computed(() => {
  const result = {}
  for (const symbol in filteredStockData.value) {
    const data = filteredStockData.value[symbol]
    if (data?.length) {
      const lastPrice = data[data.length - 1]?.price
      result[symbol] = lastPrice ? convertPrice(lastPrice) : null
    }
  }
  return result
})

// Gesamtwert
const totalValue = computed(() => {
  return Object.values(currentPrices.value)
      .filter(Boolean)
      .reduce((sum, price) => sum + parseFloat(price), 0)
})

// ============================================================
// Helper Functions
// ============================================================

const getPerformanceColor = (value) => {
  if (value === null) return 'text-gray-500'
  return parseFloat(value) >= 0 ? 'text-green-500' : 'text-red-500'
}

const convertPrice = (priceUSD) => {
  if (currency.value === 'EUR') {
    return (priceUSD * exchangeRate.value).toFixed(2)
  }
  return priceUSD.toFixed(2)
}

const getCurrencySymbol = () => currency.value === 'EUR' ? '€' : '$'

// ============================================================
// API Functions
// ============================================================

const fetchExchangeRate = async () => {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await res.json()
    exchangeRate.value = data.rates.EUR || 0.92
  } catch (err) {
    console.error('Fehler beim Laden des Wechselkurses:', err)
    exchangeRate.value = 0.92
  }
}

const fetchStockData = async (symbol) => {
  try {
    const config = useRuntimeConfig()
    const apiUrl = config.public.API_URL || 'http://localhost:8080'
    const url = `${apiUrl}/api/stocks/${encodeURIComponent(symbol)}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`)
    const data = await res.json()

    let rows = []
    if (Array.isArray(data?.historical)) rows = data.historical
    else if (Array.isArray(data?.data)) rows = data.data
    else if (Array.isArray(data?.historicalStockList?.[0]?.historical)) {
      rows = data.historicalStockList[0].historical
    } else if (Array.isArray(data)) rows = data

    const norm = rows
        .map((p) => {
          const date = p.date || p.formattedDate || p.datetime || null
          const raw = p.close ?? p.adjClose ?? p.price ?? null
          const close = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : raw
          return { date, price: close }
        })
        .filter((p) => p.date && typeof p.price === 'number' && !isNaN(p.price))

    norm.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

    return norm.slice(-1095) // Lade 3 Jahre Daten
  } catch (err) {
    console.error(`Fehler beim Laden von ${symbol}:`, err)
    return []
  }
}

// ============================================================
// Chart Functions
// ============================================================

const loadChartJs = async () => {
  const ChartJS = await import('chart.js')
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

const renderChart = async (symbol) => {
  const Chart = await loadChartJs()
  const canvas = chartRefs.value[symbol]
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Zerstöre alten Chart
  if (charts.value[symbol]) {
    charts.value[symbol].destroy()
  }

  const data = filteredStockData.value[symbol] || []
  if (!data.length) return

  const labels = data.map(p => p.date)
  const values = data.map(p => convertPrice(p.price))

  charts.value[symbol] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: symbol,
          data: values,
          tension: 0.3,
          borderColor: 'rgb(5,99,241)',
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
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const rawDate = items[0]?.label
              if (!rawDate) return ''
              const d = new Date(rawDate)
              return d.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
            },
            label: (context) => {
              const val = context.parsed.y
              return `${symbol}: ${val} ${getCurrencySymbol()}`
            }
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 6,
            callback: function(value) {
              const date = this.getLabelForValue(value)
              if (!date) return ''

              const d = new Date(date)
              if (isNaN(d)) return date

              if (selectedTimeRange.value > 180) {
                return d.toLocaleDateString('de-DE', {
                  month: 'short',
                  year: '2-digit'
                })
              }

              return d.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit'
              })
            }
          }
        },
        y: {
          display: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            callback: function(value) {
              return `${value} ${getCurrencySymbol()}`
            }
          }
        },
      },
    },
  })
}

const loadAllData = async () => {
  const symbols = watchlistItems.value.map(item => item.symbol)

  for (const symbol of symbols) {
    const data = await fetchStockData(symbol)
    stockData.value[symbol] = data
    await renderChart(symbol)
  }
}

// ============================================================
// Watchers
// ============================================================

// ✨ Neu-Rendern bei Zeitraum-Änderung
watch(() => selectedTimeRange.value, async () => {
  for (const symbol of watchlistItems.value.map(item => item.symbol)) {
    await renderChart(symbol)
  }
})

// Neu-Rendern bei Currency-Änderung
watch(() => currency.value, async () => {
  for (const symbol of watchlistItems.value.map(item => item.symbol)) {
    await renderChart(symbol)
  }
})

// ============================================================
// Lifecycle
// ============================================================

onMounted(async () => {
  await fetchExchangeRate()
  await loadAllData()
})

onUnmounted(() => {
  for (const chart of Object.values(charts.value)) {
    if (chart) chart.destroy()
  }
})
</script>
