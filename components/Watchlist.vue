<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">Meine Watchlist</h1>
          <div class="flex items-center gap-3">
            <UButton
                @click="currency = currency === 'USD' ? 'EUR' : 'USD'"
                size="lg"
                variant="soft"
            >
              {{ currency }}
            </UButton>
            <UBadge color="primary" variant="soft" size="lg">
              {{ watchlistCount }} {{ watchlistCount === 1 ? 'Aktie' : 'Aktien' }}
            </UBadge>
          </div>
        </div>
      </template>

      <!-- Leere-State -->
      <div v-if="watchlistCount === 0" class="text-center py-12">
        <UIcon name="i-lucide-star-off" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-600 mb-2">Noch keine Favoriten</h3>
        <p class="text-gray-500 mb-4">
          Füge Aktien zu deiner Watchlist hinzu, indem du auf den Stern klickst
        </p>
        <UButton to="/stock-charts" icon="i-lucide-trending-up">
          Zu den Charts
        </UButton>
      </div>

      <!-- Watchlist Grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Liste -->
        <div class="space-y-3">
          <h3 class="text-lg font-semibold mb-4">Alle Favoriten</h3>
          <div class="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            <div
                v-for="item in watchlistWithData"
                :key="item.symbol"
                @click="selectStock(item)"
                :class="[
                  'p-4 rounded-lg border-2 transition-all cursor-pointer',
                  selectedSymbol === item.symbol
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                ]"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h4 class="font-semibold">{{ item.name }}</h4>
                  <p class="text-sm text-gray-500">{{ item.symbol }}</p>
                </div>
                <UButton
                    @click.stop="removeFromWatchlist(item.symbol)"
                    icon="i-lucide-trash-2"
                    color="red"
                    variant="ghost"
                    size="xs"
                />
              </div>

              <!-- Kurs + Performance -->
              <div v-if="item.data" class="flex justify-between items-end">
                <div>
                  <span class="text-2xl font-bold">
                    {{ convertPrice(item.data.currentPrice) }} {{ getCurrencySymbol() }}
                  </span>
                </div>
                <div :class="[
                  'text-sm font-semibold',
                  item.data.dayPerformance >= 0 ? 'text-green-500' : 'text-red-500'
                ]">
                  <UIcon
                      :name="item.data.dayPerformance >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                      class="w-4 h-4 inline"
                  />
                  {{ item.data.dayPerformance >= 0 ? '+' : '' }}{{ item.data.dayPerformance }}%
                </div>
              </div>

              <!-- Loading State -->
              <div v-else class="flex items-center gap-2 text-gray-500">
                <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                <span class="text-sm">Lade Kursdaten...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div>
          <UCard v-if="selectedSymbol">
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold">
                  {{ selectedStock?.name || selectedSymbol }}
                </h3>
                <UBadge>{{ selectedSymbol }}</UBadge>
              </div>
            </template>

            <div class="h-[400px]">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </UCard>

          <!-- Kein Chart ausgewählt -->
          <div v-else class="flex flex-col items-center justify-center h-[400px] text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
            <UIcon name="i-lucide-mouse-pointer-click" class="w-12 h-12 mb-4" />
            <p>Wähle eine Aktie aus der Liste</p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from "nuxt/app"
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useWatchlist } from "~/composables/useWatchlist"

// ============================================================
// Composables & State
// ============================================================

const config = useRuntimeConfig()
const { watchlist, watchlistCount, removeFromWatchlist } = useWatchlist()
const selectedSymbol = ref<string | null>(null)
const stockData = ref<Record<string, any>>({})
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const abortController = ref<AbortController | null>(null)

// Currency State
const currency = ref('USD')
const exchangeRate = ref(1)

let chart: any = null

// ============================================================
// Computed: Watchlist mit Live-Daten
// ============================================================

const watchlistWithData = computed(() => {
  return watchlist.value.map((item: { symbol: string; name: string }) => ({
    ...item,
    data: stockData.value[item.symbol] || null
  }))
})

const selectedStock = computed(() => {
  return watchlist.value.find((item: { symbol: string; name: string }) =>
      item.symbol === selectedSymbol.value
  )
})

// ============================================================
// Currency Helpers
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

const convertPrice = (priceUSD: number) => {
  if (currency.value === 'EUR') {
    return (priceUSD * exchangeRate.value).toFixed(2)
  }
  return priceUSD.toFixed(2)
}

const getCurrencySymbol = () => currency.value === 'EUR' ? '€' : '$'

// ============================================================
// API: Kursdaten laden
// ============================================================

const fetchStockData = async (symbol: string) => {
  try {
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
        .map((p: any) => {
          const date = p.date || p.formattedDate || p.datetime || p.label || p.timestamp || null
          const raw = p.close ?? p.adjClose ?? p.price ?? p.value ?? null
          const close = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : raw
          return { date, close }
        })
        .filter((p: any) => p.date && typeof p.close === 'number' && !isNaN(p.close))

    if (!norm.length) return null

    norm.sort((a: any, b: any) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    const series = norm.slice(-360)

    const currentPrice = series[series.length - 1]?.close || 0
    const yesterdayPrice = series[series.length - 2]?.close || currentPrice
    const dayPerformance = yesterdayPrice
        ? (((currentPrice - yesterdayPrice) / yesterdayPrice) * 100).toFixed(2)
        : '0.00'

    return {
      currentPrice,
      dayPerformance: parseFloat(dayPerformance),
      historical: series
    }
  } catch (err) {
    console.error(`Fehler beim Laden von ${symbol}:`, err)
    return null
  }
}

// ============================================================
// Chart-Logik
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

const renderChart = async (symbol: string, data: any) => {
  if (!chartCanvas.value || !data?.historical) return

  const Chart = await loadChartJs()
  const ctx = chartCanvas.value.getContext('2d')

  if (chart) chart.destroy()

  const labels = data.historical.map((p: any) => p.date)
  const values = data.historical.map((p: any) => p.close)

  // Konvertiere Werte basierend auf Currency
  const convertedValues = values.map((v: number) => parseFloat(convertPrice(v)))

  chart = new Chart(ctx!, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: symbol,
          data: convertedValues,
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
        legend: { display: true },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (items) => (items.length ? formatDate(items[0]?.label ?? '') : ''),
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} ${getCurrencySymbol()}`
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            callback: (_: any, idx: number) => formatDate(labels[idx]),
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

// ============================================================
// Actions
// ============================================================

const selectStock = async (item: { symbol: string; name: string }) => {
  selectedSymbol.value = item.symbol

  if (!stockData.value[item.symbol]) {
    const data = await fetchStockData(item.symbol)
    if (data) {
      stockData.value[item.symbol] = data
    }
  }

  // ✅ FIX: Warte bis DOM aktualisiert ist
  await nextTick()
  await renderChart(item.symbol, stockData.value[item.symbol])
}

const loadAllStockData = async () => {
  for (const item of watchlist.value) {
    if (!stockData.value[item.symbol]) {
      const data = await fetchStockData(item.symbol)
      if (data) {
        stockData.value[item.symbol] = data
      }
    }
  }
}

// ============================================================
// Helpers
// ============================================================

const formatPrice = (price: number) => price?.toFixed(2) || '0.00'

const formatDate = (yyyyMmDd: string) => {
  if (!yyyyMmDd) return '-'
  const d = new Date(yyyyMmDd)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

// ============================================================
// Watchers
// ============================================================

watch(() => currency.value, async () => {
  if (selectedSymbol.value && stockData.value[selectedSymbol.value]) {
    await renderChart(selectedSymbol.value, stockData.value[selectedSymbol.value])
  }
})

// ============================================================
// Lifecycle
// ============================================================

onMounted(async () => {
  await fetchExchangeRate()
  await loadAllStockData()

  if (watchlist.value.length > 0) {
    // ✅ FIX: nextTick garantiert, dass Canvas existiert
    await nextTick()
    await selectStock(watchlist.value[0])
  }
})

onUnmounted(() => {
  if (abortController.value) abortController.value.abort()
  if (chart) chart.destroy()
})
</script>
