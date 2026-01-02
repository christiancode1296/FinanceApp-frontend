<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface Stock {
  symbol: string
  name: string
  price?: number
  change?: number
  changePercent?: number
}

const watchlist = ref<Stock[]>([])
const selectedStock = ref<Stock | null>(null)
const loading = ref(false)
const apiUrl = useRuntimeConfig().public.API_URL

// Demo-Daten für die Watchlist
const loadWatchlist = async () => {
  loading.value = true
  try {
    // Hier könntest du später eine API-Anfrage machen
    // const res = await axios.get(`${apiUrl}/api/watchlist`)
    // watchlist.value = res.data

    // Momentan verwenden wir Demo-Daten
    watchlist.value = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 178.25, change: 2.50, changePercent: 1.42 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: -1.25, changePercent: -0.33 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80, change: 3.15, changePercent: 2.25 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.35, change: 5.40, changePercent: 3.12 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -4.20, changePercent: -1.66 },
    ]

    // Wähle automatisch die erste Aktie aus
    if (watchlist.value.length > 0) {
      selectedStock.value = watchlist.value[0]
    }
  } catch (err) {
    console.error('Fehler beim Laden der Watchlist:', err)
  } finally {
    loading.value = false
  }
}

const selectStock = (stock: Stock) => {
  selectedStock.value = stock
}

const removeStock = (symbol: string) => {
  watchlist.value = watchlist.value.filter(s => s.symbol !== symbol)
  if (selectedStock.value?.symbol === symbol) {
    selectedStock.value = watchlist.value.length > 0 ? watchlist.value[0] : null
  }
}

onMounted(() => {
  loadWatchlist()
})
</script>

<template>
  <div class="flex gap-6 min-h-screen">
    <!-- Linke Sidebar mit Aktienliste -->
    <div class="w-80 border-r border-gray-200 dark:border-gray-800 pr-4">
      <div class="sticky top-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">Meine Watchlist</h2>
          <UButton
            icon="i-humbleicons:plus"
            color="primary"
            variant="ghost"
            size="sm"
            aria-label="Aktie hinzufügen"
          />
        </div>

        <div v-if="loading" class="space-y-3">
          <USkeleton class="h-20 w-full" v-for="i in 5" :key="i" />
        </div>

        <div v-else-if="watchlist.length === 0" class="text-center py-8 text-gray-500">
          <UIcon name="i-humbleicons:pie-chart" class="size-12 mx-auto mb-2 opacity-50" />
          <p>Keine Aktien in der Watchlist</p>
        </div>

        <div v-else class="space-y-2">
          <UCard
            v-for="stock in watchlist"
            :key="stock.symbol"
            :class="[
              'cursor-pointer transition-all hover:shadow-md',
              selectedStock?.symbol === stock.symbol ? 'ring-2 ring-primary' : ''
            ]"
            @click="selectStock(stock)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm">{{ stock.symbol }}</span>
                  <UBadge
                    :color="stock.change && stock.change >= 0 ? 'green' : 'red'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ stock.change && stock.change >= 0 ? '+' : '' }}{{ stock.changePercent?.toFixed(2) }}%
                  </UBadge>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                  {{ stock.name }}
                </p>
                <p class="text-sm font-semibold mt-1">
                  ${{ stock.price?.toFixed(2) }}
                </p>
              </div>

              <UButton
                icon="i-humbleicons:times"
                color="red"
                variant="ghost"
                size="xs"
                @click.stop="removeStock(stock.symbol)"
                aria-label="Entfernen"
              />
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Rechter Bereich mit Details -->
    <div class="flex-1">
      <div v-if="selectedStock">
        <h1 class="text-3xl font-bold mb-2">{{ selectedStock.name }}</h1>
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl font-bold">${{ selectedStock.price?.toFixed(2) }}</span>
          <UBadge
            :color="selectedStock.change && selectedStock.change >= 0 ? 'green' : 'red'"
            size="md"
          >
            {{ selectedStock.change && selectedStock.change >= 0 ? '+' : '' }}{{ selectedStock.change?.toFixed(2) }}
            ({{ selectedStock.change && selectedStock.change >= 0 ? '+' : '' }}{{ selectedStock.changePercent?.toFixed(2) }}%)
          </UBadge>
        </div>

        <!-- Hier kannst du später Charts oder weitere Details einfügen -->
        <UCard>
          <div class="h-96 flex items-center justify-center text-gray-500">
            <div class="text-center">
              <UIcon name="i-humbleicons:activity" class="size-16 mx-auto mb-4 opacity-50" />
              <p>Chart für {{ selectedStock.symbol }} wird hier angezeigt</p>
              <p class="text-sm mt-2">StockCharts-Komponente kann hier integriert werden</p>
            </div>
          </div>
        </UCard>
      </div>

      <div v-else class="h-96 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <UIcon name="i-humbleicons:pie-chart" class="size-16 mx-auto mb-4 opacity-50" />
          <p>Wähle eine Aktie aus der Watchlist</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>