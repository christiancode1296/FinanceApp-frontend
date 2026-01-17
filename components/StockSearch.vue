<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRuntimeConfig } from "nuxt/app"
import { useAuth } from '@okta/okta-vue';
import { useWatchlist } from '@/composables/useWatchlist'

interface Stock {
  symbol: string
  name: string
  exchange?: string
  isFavorite?: boolean
}

const { loadWatchlist } = useWatchlist()
const searchQuery = ref('')
const allStocks = ref<Stock[]>([])
const loading = ref(false)
const config = useRuntimeConfig()
const apiUrl = config.public.API_URL
const auth = useAuth();
const favorites = ref(new Set<string>());

const loadFavorites = async () => {
  const userId = auth.authState?.idToken?.claims?.sub; // Okta-User-ID
  if (!userId) {
    console.error('Benutzer nicht authentifiziert');
    return;
  }

  try {
    const res = await axios.get(`${apiUrl}/api/watchlist/${userId}`);
    const symbols = res.data.map((item: { symbol: string }) => item.symbol);
    favorites.value = new Set(symbols); // Watchlist aus Backend setzen
  } catch (error) {
    console.error('Fehler beim Laden der Watchlist:', error);
  }
};

// Gefilterte Suchergebnisse
const suggestions = computed(() => {
  const q = searchQuery.value.trim()
  if (q.length < 1) return []

  const up = q.toUpperCase()
  return allStocks.value
    .filter(s =>
      (s.name || '').toUpperCase().includes(up) ||
      (s.symbol || '').toUpperCase().includes(up)
    )
    .slice(0, 20)
    .map(s => ({
      ...s,
      isFavorite: favorites.value.has(s.symbol)
    }))
})

// Alle Aktien laden
const loadAllStocks = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${apiUrl}/api/stocks/all`)
    allStocks.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('Fehler beim Laden der Aktien:', err)
    allStocks.value = []
  } finally {
    loading.value = false
  }
}

// Favorit togglen
const toggleFavorite = async (stock: Stock) => {
  const userId = auth.authState?.idToken?.claims?.sub;
  if (!userId) {
    console.error('Benutzer nicht authentifiziert');
    return;
  }

  try {
    if (favorites.value.has(stock.symbol)) {
      console.log(`Entferne ${stock.symbol} aus der Watchlist`);
      await axios.delete(`${apiUrl}/api/watchlist/${userId}/${stock.symbol}`);
      favorites.value.delete(stock.symbol);
    } else {
      console.log(`Füge ${stock.symbol} zur Watchlist hinzu`);
      await axios.post(`${apiUrl}/api/watchlist/${userId}`, { symbol: stock.symbol });
      favorites.value.add(stock.symbol);
    }
    console.log('Aktualisierte Watchlist:', Array.from(favorites.value));
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Watchlist:', error);
  }
};

onMounted(() => {
  loadFavorites();
});
onMounted(async () => {
  await loadWatchlist()
})

// Initial laden
loadAllStocks()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-xl font-bold">Aktiensuche</h2>
    </template>

    <div class="space-y-4">
      <UFormGroup label="Suche nach Name oder Symbol">
        <UInput
          v-model.trim="searchQuery"
          placeholder="z.B. Apple oder AAPL"
          size="lg"
          icon="i-humbleicons:search"
        />
      </UFormGroup>

      <div v-if="loading" class="text-center py-4 text-gray-500">
        Lade Aktien...
      </div>

      <div v-else-if="suggestions.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
        <UCard
          v-for="stock in suggestions"
          :key="stock.symbol"
          class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm">{{ stock.symbol }}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400 truncate">
                {{ stock.name }}
              </div>
              <div v-if="stock.exchange" class="text-xs text-gray-500 mt-1">
                {{ stock.exchange }}
              </div>
            </div>

            <UButton
              :icon="stock.isFavorite ? 'i-humbleicons:star' : 'i-humbleicons:star-outline'"
              :color="stock.isFavorite ? 'yellow' : 'gray'"
              variant="ghost"
              size="lg"
              @click="toggleFavorite(stock)"
              :aria-label="stock.isFavorite ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'"
            />
          </div>
        </UCard>
      </div>

      <div v-else-if="searchQuery.length > 0" class="text-center py-8 text-gray-500">
        <UIcon name="i-humbleicons:search" class="size-12 mx-auto mb-2 opacity-50" />
        <p>Keine Aktien gefunden für "{{ searchQuery }}"</p>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <UIcon name="i-humbleicons:search" class="size-12 mx-auto mb-2 opacity-50" />
        <p>Gib einen Suchbegriff ein, um Aktien zu finden</p>
        <p class="text-xs mt-2">Markiere Aktien mit einem Stern ⭐, um sie zur Watchlist hinzuzufügen</p>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
</style>

