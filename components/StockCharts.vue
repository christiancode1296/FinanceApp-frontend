<template>
  <div class="space-y-6">

    <!-- Search Section -->
    <UCard>
      <div class="flex flex-col gap-4">

        <!-- Sucheingabe -->
        <div class = "flex gap-2" >
          <UFormGroup label="Aktie suchen" class="flex-1">
            <UInput
                v-model.trim="searchQuery"
                @input="searchStocks"
                placeholder="Name"
                size="lg"
            />
          </UFormGroup>
          <div class="flex items-end">
            <!-- Button -->
            <UButton
                @click="reload()"
                :loading="loading"
                size="lg"
                    icon="i-lucide-refresh-cw"
                class="mt-2"
            >
              Laden
            </UButton>
            <UButton
                @click="currency = currency === 'USD' ? 'EUR' : 'USD'"
                size="lg"
                variant="soft"
            >
              {{ currency }}
            </UButton>
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
              @click="selectSymbol(s)"
              class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {{ s.name }} ({{ s.symbol }}) – {{ s.exchange || 'N/A' }}
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


    <!-- Chart -->
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold">{{ currentCompanyName }}</h2>
          <div class="flex gap-6 text-sm">
            <div>
              <span class="text-gray-500">Tag:</span>
              <span :class="getPerformanceColor(performanceMetrics.day)" class="ml-2 font-semibold">
                {{ performanceMetrics.day !== null ? `${performanceMetrics.day}%` : '–' }}
              </span>
            </div>
            <div>
              <span class="text-gray-500">Monat:</span>
              <span :class="getPerformanceColor(performanceMetrics.month)" class="ml-2 font-semibold">
                {{ performanceMetrics.month !== null ? `${performanceMetrics.month}%` : '–' }}
              </span>
            </div>
            <div>
              <span class="text-gray-500">Jahr:</span>
              <span :class="getPerformanceColor(performanceMetrics.year)" class="ml-2 font-semibold">
                {{ performanceMetrics.year !== null ? `${performanceMetrics.year}%` : '–' }}
              </span>
            </div>
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
          <span class="font-medium"> {{formatDate(entry.date)}} </span>
          <span class="text-lg font-bold text-primary">
          {{ convertPrice(entry.price) }} {{ getCurrencySymbol() }}
          </span>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue"

const symbol = ref("AAPL")
const chartCanvas = ref(null)
const errorMsg = ref("")
const loading = ref(false)
const lastPrices = ref([])
const searchQuery = ref('')
const suggestions = ref([])

const allStocks = ref([]) // Liste aus DB (Top 100)
const allHistoricalPrices = ref([])

const currentCompanyName = computed(() => {
  const stock = allStocks.value.find(s => s.symbol === symbol.value)
  return stock ? `${stock.name} (${stock.symbol})` : symbol.value
})

const performanceMetrics = computed(() => {
  if (allHistoricalPrices.value.length === 0) {
    return { day: null, month: null, year: null }
  }

  const prices = allHistoricalPrices.value
  const currentPrice = prices[prices.length - 1]?.price

  if (!currentPrice) return {day: null, month: null, year: null}

  const calculatePerformance = (startPrice) => {
    if(!startPrice) return null
    return (((currentPrice - startPrice) / startPrice) * 100).toFixed(2)
  }
  return {
    day: prices.length >= 2 ? calculatePerformance(prices[prices.length - 2]?.price) : null,
    month: prices.length >= 20 ? calculatePerformance(prices[Math.max(0, prices.length - 20)]?.price) : null,
    year: prices.length >= 250 ? calculatePerformance(prices[0]?.price) : null,
  }
})

const getPerformanceColor = (value) => {
  if (value === null) return 'text-gray-500'
  return value >= 0 ? 'text-green-500' : 'text-red-500'
}


// Lädt alle Stocks einmalig vom Backend
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
    // Fehler nicht direkt als Alert anzeigen, sondern in Konsole; optional setzen:
    // errorMsg.value = err.message || String(err)
    allStocks.value = []
  }
}

// Lokale Filter-Suche gegen allStocks
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

// Wenn ein Vorschlag geklickt wird:
const selectSymbol = (s) => {
  symbol.value = s.symbol
  // Anzeige in Suchfeld: Name + Kürzel (oder nur Name, je Wunsch)
  suggestions.value = []
  reload()
  searchQuery.value = ''
}

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

    // Speichere ALLE Kurse für Performance\-Berechnung
    allHistoricalPrices.value = validLabels.map((date, i) => ({
      date,
      price: validValues[i]
    }))

    // Nur die letzten 5 für die Anzeige
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
            label: (ctx) => {
              const converted = convertPrice(ctx.parsed.y)
              return `${ctx.dataset.label}: ${converted} ${getCurrencySymbol()}`
            }
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
const currency = ref('USD')
const exchangeRate = ref(1)

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

const convertPrice = (priceUSD) => {
  if (currency.value === 'EUR') {
    return (priceUSD * exchangeRate.value).toFixed(2)
  }
  return priceUSD.toFixed(2)
}

const getCurrencySymbol = () => currency.value === 'EUR' ? '€' : '$'



onMounted(async () => {
  await loadAllStocks()
  await fetchExchangeRate()
  await reload()
  await renderChart(labels, values)
})

const chartData = computed(() => {
  return allHistoricalPrices.value.map(p => ({
    date: p.date,
    price: parseFloat(convertPrice(p.price))
  }))
})

const watchCurrency = watch(() => currency.value, async () => {
  const labels = chartData.value.map(p => p.date)
  const values = chartData.value.map(p => p.price)
  await renderChart(labels, values)
})

onUnmounted(() => {
  if (abortController) abortController.abort()
  if (chart) chart.destroy()
  watchCurrency()
})
</script>