<template>
  <div class="space-y-6">
    <!-- Watchlist Overview Card -->
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold">Meine Watchlist</h2>

          <!-- ✨ Currency Toggle Button -->
          <UButton
              @click="currency = currency === 'USD' ? 'EUR' : 'USD'"
              size="lg"
              variant="soft"
          >
            {{ currency }}
          </UButton>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p class="text-sm text-gray-500 mb-1">Anzahl Aktien</p>
          <p class="text-2xl font-bold">{{ watchlistItems.length }}</p>
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
            <div>
              <h3 class="text-lg font-semibold">{{ item.name }}</h3>
              <p class="text-sm text-gray-500">{{ item.symbol }}</p>
            </div>

            <div class="text-right">
              <p class="text-2xl font-bold">
                {{ convertPrice(currentPrices[item.symbol] || 0) }} {{ getCurrencySymbol() }}
              </p>
              <p
                  :class="getPerformanceColor(stockPerformance[item.symbol])"
                  class="text-sm font-semibold"
              >
                {{ stockPerformance[item.symbol] !== null ? `${stockPerformance[item.symbol]}%` : '–' }}
              </p>
            </div>
          </div>
        </template>

        <div class="h-64">
          <canvas :ref="el => { if (el) chartRefs[item.symbol] = el }"></canvas>
        </div>

        <template #footer>
          <UButton
              @click="toggleWatchlist(item)"
              color="red"
              variant="soft"
              size="sm"
              block
          >
            Entfernen
          </UButton>
        </template>
      </UCard>
    </div>

    <!-- Empty State -->
    <UCard v-if="watchlistItems.length === 0">
      <div class="text-center py-12">
        <UIcon name="i-lucide-star-off" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 class="text-xl font-semibold mb-2">Keine Aktien in der Watchlist</h3>
        <p class="text-gray-500">Füge Aktien hinzu, um sie hier zu verfolgen</p>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useWatchlist } from '@/composables/useWatchlist'
import axios from "axios";



const { watchlist, loadWatchlist, toggleWatchlist } = useWatchlist()
const chartRefs = ref({})
const charts = ref({})
const stockData = ref({})
const currency = ref('USD')
const exchangeRate = ref(1)
const allStocks = ref([])
const loading = ref(false)

const selectedTimeRange = ref(365)

const timeRanges = [
  { label: '30 Tage', value: 30 },
  { label: '6 Monate', value: 180 },
  { label: '1 Jahr', value: 365 },
  { label: '3 Jahre', value: 1095 }
]

// ============================================================
// Computed Properties
// ============================================================

const currentCompanyName = computed(() => {
  const stock = allStocks.value.find(s => s.symbol === symbol.value)
  return stock ? `${stock.name} (${stock.symbol})` : symbol.value
})

const watchlistItems = computed(() => watchlist.value || [])

const getTimeRangeLabel = computed(() => {
  const range = timeRanges.find(r => r.value === selectedTimeRange.value)
  return range?.label || 'Zeitraum'
})

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

const portfolioPerformance = computed(() => {
  const performances = Object.values(stockPerformance.value).filter(p => p !== null)
  if (performances.length === 0) return null

  const avg = performances.reduce((sum, p) => sum + parseFloat(p), 0) / performances.length
  return avg.toFixed(2)
})

const currentPrices = computed(() => {
  const result = {}
  for (const symbol in filteredStockData.value) {
    const data = filteredStockData.value[symbol]
    if (data?.length) {
      result[symbol] = data[data.length - 1]?.price || 0
    }
  }
  return result
})

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

const getCurrencySymbol = () => (currency.value === 'EUR' ? '€' : '$')


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
    const res = await fetch(`${apiUrl}/api/stocks/${encodeURIComponent(symbol)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
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
          return { date, price: close }
        })
        .filter((p) => p.date && typeof p.price === 'number' && !Number.isNaN(p.price))

    norm.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

    return norm.slice(-1095)
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
  try {
    const Chart = await loadChartJs()
    const canvas = chartRefs.value[symbol]

    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (charts.value[symbol]) {
      charts.value[symbol].stop()
      charts.value[symbol].destroy()
      delete charts.value[symbol]
    }

    const data = filteredStockData.value[symbol] || []
    if (!data.length) return

    const labels = data.map(p => p.date)
    const values = data.map(p => parseFloat(convertPrice(p.price)))

    if (labels.length === 0 || values.length === 0) return

    charts.value[symbol] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: symbol,
          data: values,
          tension: 0.3,
          borderColor: 'rgb(5,99,241)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              title: (items) => {
                const rawDate = items[0]?.label
                if (!rawDate) return ''
                const d = new Date(rawDate)
                return d.toLocaleDateString('de-DE')
              },
              label: (context) => {
                const val = context.parsed.y
                return `${symbol}: ${val.toFixed(2)} ${getCurrencySymbol()}`
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
                return `${value.toFixed(0)} ${getCurrencySymbol()}`
              }
            }
          },
        },
      },
    })
  } catch (error) {
    console.error(`❌ FEHLER in renderChart(${symbol}):`, error)
  }
}

const loadAllStocks = async () => {
  try {
    const config = useRuntimeConfig()
    const apiUrl = config.public.API_URL || 'http://localhost:8080'
    const res = await fetch(`${apiUrl}/api/stocks/all`)
    if (!res.ok) throw new Error(`Fehler beim Laden der Aktienliste: HTTP ${res.status}`)
    const data = await res.json()
    allStocks.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
    allStocks.value = []
  }
}


const loadAllData = async () => {
  const symbols = watchlistItems.value.map(item => item.symbol)

  for (const symbol of symbols) {
    const data = await fetchStockData(symbol)
    stockData.value[symbol] = data
  }

  await nextTick()

  for (const symbol of symbols) {
    await renderChart(symbol)
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

// ============================================================
// Watchers
// ============================================================

let renderTimeout = null

watch(() => selectedTimeRange.value, async () => {
  if (renderTimeout) clearTimeout(renderTimeout)

  renderTimeout = setTimeout(async () => {
    await nextTick()

    const symbols = watchlistItems.value.map(item => item.symbol)

    for (const symbol of symbols) {
      await renderChart(symbol)
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }, 150)
})

watch(() => currency.value, async () => {
  if (renderTimeout) clearTimeout(renderTimeout)

  renderTimeout = setTimeout(async () => {
    await nextTick()

    const symbols = watchlistItems.value.map(item => item.symbol)

    for (const symbol of symbols) {
      await renderChart(symbol)
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }, 150)
})

// ============================================================
// Lifecycle
// ============================================================

onMounted(async () => {
  await fetchExchangeRate()
  await loadAllData()
  await loadWatchlist()
})

onUnmounted(() => {
  if (renderTimeout) {
    clearTimeout(renderTimeout)
  }

  for (const chart of Object.values(charts.value)) {
    if (chart) {
      try {
        chart.stop()
        chart.destroy()
      } catch (e) {
        console.error('Fehler beim Chart-Cleanup:', e)
      }
    }
  }
})
</script>
