import axios from 'axios'
import { useAuth } from '@okta/okta-vue'
import { useRuntimeConfig } from 'nuxt/app'

interface WatchlistItem {
    symbol: string
    name: string
}

export const useWatchlist = () => {
    const auth = useAuth()
    const config = useRuntimeConfig()
    const apiUrl = config.public.API_URL
    const watchlist = useState<WatchlistItem[]>('watchlist', () => [])

    const watchlistSymbols = computed(() =>
        watchlist.value.map(item => item.symbol)
    )

    const watchlistCount = computed(() =>
        watchlist.value.length
    )

    const isInWatchlist = (stockSymbol: string): boolean => {
        return watchlistSymbols.value.includes(stockSymbol)
    }

    const loadWatchlist = async () => {
        try {
            const user = await auth.getUser()
            const userId = user?.sub
            if (!userId) {
                console.error('Benutzer nicht authentifiziert')
                return
            }

            // Watchlist-Daten laden
            const res = await axios.get(`${apiUrl}/api/watchlist/${userId}`)
            const watchlistData = res.data

            // Alle verfügbaren Aktien laden
            const allStocksRes = await axios.get(`${apiUrl}/api/stocks/all`)
            const allStocks = Array.isArray(allStocksRes.data) ? allStocksRes.data : []

            // Namen ergänzen
            watchlist.value = watchlistData.map((item: { symbol: string }) => {
                const stock = allStocks.find(s => s.symbol === item.symbol)
                return {
                    symbol: item.symbol,
                    name: stock?.name || 'Unbekannt' // Fallback, falls kein Name gefunden wird
                }
            })

            console.log(`📋 Watchlist geladen: ${watchlist.value.length} Einträge`)
        } catch (error) {
            console.error('Fehler beim Laden der Watchlist:', error)
        }
    }

    const addToWatchlist = async (stock: { symbol: string; name: string }) => {
        if (isInWatchlist(stock.symbol)) {
            console.warn(`⚠️ ${stock.symbol} ist bereits in der Watchlist`)
            return
        }

        try {
            const user = await auth.getUser()
            const userId = user?.sub
            if (!userId) {
                console.error('Benutzer nicht authentifiziert')
                return
            }

            await axios.post(`${apiUrl}/api/watchlist/${userId}`, { symbol: stock.symbol, name: stock.name })
            watchlist.value.push({
                symbol: stock.symbol,
                name: stock.name
            })
            console.log(`✅ ${stock.symbol} zur Watchlist hinzugefügt`)
        } catch (error) {
            console.error(`❌ Fehler beim Hinzufügen von ${stock.symbol} zur Watchlist`, error)
        }
    }

    const removeFromWatchlist = async (stockSymbol: string) => {
        const index = watchlist.value.findIndex(item => item.symbol === stockSymbol)
        if (index === -1) {
            console.warn(`⚠️ ${stockSymbol} nicht in Watchlist gefunden`)
            return
        }

        try {
            const user = await auth.getUser()
            const userId = user?.sub
            if (!userId) {
                console.error('Benutzer nicht authentifiziert')
                return
            }

            console.log(`Sende DELETE-Anfrage an: ${apiUrl}/api/watchlist/${userId}/${stockSymbol}`)

            await axios.delete(`${apiUrl}/api/watchlist/${userId}/${stockSymbol}`)
            watchlist.value.splice(index, 1)
            console.log(`❌ ${stockSymbol} aus Watchlist entfernt`)
        } catch (error) {
            // @ts-ignore
            console.error('❌ Fehler beim Entfernen von', stockSymbol, error.response?.data || error)
        }
    }


    const toggleWatchlist = async (stock: { symbol: string; name: string }) => {
        if (isInWatchlist(stock.symbol)) {
            await removeFromWatchlist(stock.symbol)
        } else {
            await addToWatchlist(stock)
        }
    }

    const clearWatchlist = async () => {
        try {
            const user = await auth.getUser()
            const userId = user?.sub
            if (!userId) {
                console.error('Benutzer nicht authentifiziert')
                return
            }

            await axios.delete(`${apiUrl}/api/watchlist/${userId}`)
            watchlist.value = []
            console.log(`🗑️ Watchlist geleert`)
        } catch (error) {
            console.error('Fehler beim Leeren der Watchlist:', error)
        }
    }

    return {
        watchlist,
        watchlistSymbols,
        watchlistCount,
        isInWatchlist,
        loadWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        clearWatchlist
    }
}
