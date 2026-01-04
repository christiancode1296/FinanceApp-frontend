interface WatchlistItem {
    symbol: string
    name: string
}

export const useWatchlist = () => {
    // ✅ KORRIGIERT: Key + Factory-Funktion
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

    const addToWatchlist = (stock: { symbol: string; name: string }) => {
        if (isInWatchlist(stock.symbol)) {
            console.warn(`⚠️ ${stock.symbol} ist bereits in der Watchlist`)
            return
        }

        watchlist.value.push({
            symbol: stock.symbol,
            name: stock.name
        })

        console.log(`✅ ${stock.symbol} zur Watchlist hinzugefügt`)
    }

    const removeFromWatchlist = (stockSymbol: string) => {
        const index = watchlist.value.findIndex(
            item => item.symbol === stockSymbol
        )

        if (index === -1) {
            console.warn(`⚠️ ${stockSymbol} nicht in Watchlist gefunden`)
            return
        }

        watchlist.value.splice(index, 1)
        console.log(`❌ ${stockSymbol} aus Watchlist entfernt`)
    }

    const toggleWatchlist = (stock: { symbol: string; name: string }) => {
        if (isInWatchlist(stock.symbol)) {
            removeFromWatchlist(stock.symbol)
        } else {
            addToWatchlist(stock)
        }
    }

    const setWatchlist = (items: WatchlistItem[]) => {
        watchlist.value = items
        console.log(`📋 Watchlist geladen: ${items.length} Einträge`)
    }

    const clearWatchlist = () => {
        watchlist.value = []
        console.log(`🗑️ Watchlist geleert`)
    }

    return {
        watchlist,
        watchlistSymbols,
        watchlistCount,
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        setWatchlist,
        clearWatchlist
    }
}
