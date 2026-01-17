<template>
  <div class="space-y-6">

    <!-- Search Section -->
    <UCard>
      <div class="flex flex-col gap-4">
        <!-- Sucheingabe -->
        <div class="flex gap-2">
          <UFormGroup label="Aktie suchen" class="flex-1">
            <UInput
                v-model.trim="searchQuery"
                @input="searchStocks"
                placeholder="Name oder Symbol"
                size="lg"
            />
          </UFormGroup>

          <div class="flex items-end gap-2 justify-center flex-0.7">
            <UButton
                @click="reload()"
                :loading="loading"
                size="lg"
                icon="i-lucide-refresh-cw"
                class="mt-2"
            >
              Laden
            </UButton>

            <div class="flex items-end gap-2">
              <UButton
                  @click="currency = currency === 'USD' ? 'EUR' : 'USD'"
                  size="lg"
                  variant="soft"
              >
                {{ currency }}
              </UButton>

              <div class="relative" ref="infoIconRef">
                <div class="group cursor-help">
                  <UIcon name="i-lucide-info" class="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vorschläge (Auto-Complete) -->
        <div
            v-if="suggestions.length > 0"
            class="border rounded bg-white dark:bg-gray-800 shadow-md max-h-60 overflow-y-auto"
        >
          <div
              v-for="s in suggestions"
              :key="s.symbol"
              class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div
                @click="selectSymbol(s)"
                class="flex-1 cursor-pointer"
            >
              {{ s.name }} ({{ s.symbol }}) – {{ s.exchange || 'N/A' }}
            </div>
          </div>
        </div>

        <UAlert
            v-if="errorMsg"
            color="red"
            variant="soft"
            :title="errorMsg"
            class="mt-4"
        />
      </div>
    </UCard>

    <!-- Tooltip außerhalb der Flexbox über Teleport -->
    <Teleport to="body">
      <div
          v-if="showTooltip"
          :style="tooltipStyle"
          class="fixed px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-[9999] pointer-events-none"
      >
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-alert-circle" class="w-3.5 h-3.5 flex-shrink-0" />
            <span> Die Historischen Werte werden mit dem aktuellen</span>
          </div>
          <span class="ml-5">Wechselkurs von {{ exchangeRate.toFixed(4) }} umgerechnet!</span>
        </div>
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
      </div>
    </Teleport>

    <!-- Chart -->
    <UCard>
      <template #header>
        <div class="flex flex-col gap-4">
          <!-- Erste Zeile: Titel + Performance -->
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-7">
              <h2 class="text-2xl font-bold">{{ currentCompanyName }}</h2>
              <UIcon
                  :name="isInWatchlist(symbol) ? 'i-lucide-star' : 'i-lucide-star-off'"
                  :class="[
              isInWatchlist(symbol) ? 'text-yellow-500' : 'text-gray-400',
              'transition-all duration-300 ease-in-out'
            ]"
                  class="w-5 h-5 cursor-pointer hover:scale-110 active:scale-95"
                  @click="toggleWatchlist({ symbol: symbol, name: currentCompanyName })"
              />
            </div>

            <!-- ✨ Performance nur für ausgewählten Zeitraum -->
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray-500">{{ getTimeRangeLabel }}:</span>
                <span
                    :class="getPerformanceColor(performanceMetrics.selected)"
                    class="ml-2 font-semibold text-lg"
                >
            {{ performanceMetrics.selected !== null ? `${performanceMetrics.selected}%` : '–' }}
          </span>
              </div>
            </div>
          </div>

          <!-- ✨ Zeitraum-Toggle -->
          <div class="flex gap-2">
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
        </div>
      </template>

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
          <span class="font-medium"> {{ formatDate(entry.date) }} </span>
          <span class="text-lg font-bold text-primary">
          {{ convertPrice(entry.price) }} {{ getCurrencySymbol() }}
          </span>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue"
import { useWatchlist } from '@/composables/useWatchlist'

// ============================================================
// State
// ============================================================
const { loadWatchlist } = useWatchlist()
const symbol = useState('currentSymbol', () => "AAPL")
const chartCanvas = ref(null)
const errorMsg = ref("")
const loading = ref(false)
const lastPrices = ref([])
const searchQuery = ref('')
const suggestions = ref([])
const allStocks = ref([])
const allHistoricalPrices = ref([])
const currency = ref('USD')
const exchangeRate = ref(1)
const infoIconRef = ref(null)
const showTooltip = ref(false)
const tooltipStyle = ref({})

// ✨ Zeitraum-State
const selectedTimeRange = ref(365)

const timeRanges = [
  { label: '30 Tage', value: 30 },
  { label: '6 Monate', value: 180 },
  { label: '1 Jahr', value: 365 },
  { label: '3 Jahre', value: 1095 }
]

let chart = null
let abortController = null

// ============================================================
// Computed Properties
// ============================================================

const currentCompanyName = computed(() => {
  const stock = allStocks.value.find(s => s.symbol === symbol.value)
  return stock ? `${stock.name} (${stock.symbol})` : symbol.value
})

const performanceMetrics = computed(() => {
  const prices = filteredHistoricalData.value

  if (prices.length === 0) {
    return { selected: null }
  }

  const currentPrice = prices[prices.length - 1]?.price
  if (!currentPrice) return { selected: null }

  const startPrice = prices[0]?.price
  if (!startPrice) return { selected: null }

  const performance = (((currentPrice - startPrice) / startPrice) * 100).toFixed(2)

  return { selected: performance }
})

const getTimeRangeLabel = computed(() => {
  const range = timeRanges.find(r => r.value === selectedTimeRange.value)
  return range?.label || 'Zeitraum'
})

const filteredHistoricalData = computed(() => {
  if (!allHistoricalPrices.value.length) return []

  const data = allHistoricalPrices.value
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

  const filtered = data.filter(p => {
    const priceDate = new Date(p.date)
    return priceDate >= startDate
  })

  return filtered
})

const chartData = computed(() => {
  return filteredHistoricalData.value.map(p => ({
    date: p.date,
    price: parseFloat(convertPrice(p.price))
  }))
})

// ============================================================
// Helper Functions
// ============================================================

const getPerformanceColor = (value) => {
  if (value === null) return 'text-gray-500'
  return value >= 0 ? 'text-green-500' : 'text-red-500'
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

const convertPrice = (priceUSD) => {
  if (currency.value === 'EUR') {
    return (priceUSD * exchangeRate.value).toFixed(2)
  }
  return priceUSD.toFixed(2)
}

const getCurrencySymbol = () => currency.value === 'EUR' ? '€' : '$'

const updateTooltipPosition = () => {
  if (!infoIconRef.value) return

  const rect = infoIconRef.value.getBoundingClientRect()
  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.bottom + 8}px`,
    transform: 'translateX(-50%)'
  }
}

// ============================================================
// API Functions
// ============================================================

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

const fetchSeries = async (sym) => {
  if (abortController) abortController.abort()
  abortController = new AbortController()
  loading.value = true
  errorMsg.value = ""

  try {
    const config = useRuntimeConfig()
    const apiUrl = config.public.API_URL || 'http://localhost:8080'
    const url = `${apiUrl}/api/stocks/${encodeURIComponent(sym)}`

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

    const series = norm.slice(-1095)
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

// ============================================================
// Search Functions
// ============================================================

const searchStocks = () => {
  const q = (searchQuery.value || "").trim()
  if (q.length < 1) {
    suggestions.value = []
    return
  }
  const up = q.toUpperCase()
  suggestions.value = allStocks.value
      .filter(s => ((s.name || "").toUpperCase().includes(up) || (s.symbol || "").toUpperCase().includes(up)))
      .slice(0, 10)
}

const selectSymbol = (s) => {
  symbol.value = s.symbol
  suggestions.value = []
  reload()
  searchQuery.value = ''
}

// ============================================================
// Chart Functions
// ============================================================

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

    allHistoricalPrices.value = validLabels.map((date, i) => ({
      date,
      price: validValues[i]
    }))

    const lastEntries = validLabels
        .map((date, i) => {
          const price = validValues[i]
          return price !== undefined && !isNaN(price)
              ? { date, price }
              : null
        })
        .filter(Boolean)
        .slice(-5)
        .reverse()

    lastPrices.value = lastEntries
    await renderChart()
  } catch (e) {
    errorMsg.value = e.message || String(e)
  } finally {
    loading.value = false
  }
}

const renderChart = async () => {
  const Chart = await loadChartJs()
  const ctx = chartCanvas.value?.getContext("2d")

  if (!ctx) return

  // ✅ Sicher Chart zerstören
  if (chart) {
    chart.destroy()
    chart = null
  }

  const labels = chartData.value.map(p => p.date)
  const values = chartData.value.map(p => p.price)

  if (labels.length === 0 || values.length === 0) return

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: symbol.value,
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
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: true },
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
              return `${symbol.value}: ${val.toFixed(2)} ${getCurrencySymbol()}`
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
            maxTicksLimit: 8,
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
              return `${value.toFixed(2)} ${getCurrencySymbol()}`
            }
          }
        },
      },
    },
  })
}

// ============================================================
// Watchers - NUR EINMAL!
// ============================================================

watch(() => selectedTimeRange.value, async () => {
  await renderChart()
})

watch(() => currency.value, async () => {
  await renderChart()
})

// ============================================================
// Lifecycle
// ============================================================

onMounted(async () => {
  await loadAllStocks()
  await fetchExchangeRate()
  await reload()
  await loadWatchlist()

  const icon = infoIconRef.value?.querySelector('.group')
  if (icon) {
    icon.addEventListener('mouseenter', () => {
      showTooltip.value = true
      updateTooltipPosition()
    })
    icon.addEventListener('mouseleave', () => {
      showTooltip.value = false
    })
  }
})

onUnmounted(() => {
  if (abortController) abortController.abort()
  if (chart) chart.destroy()
})

// ============================================================
// Watchlist Integration
// ============================================================

const { isInWatchlist, toggleWatchlist } = useWatchlist()
</script>