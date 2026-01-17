<script setup lang="ts">
</script>
<template>
  <div class="container mx-auto px-4 py-8">
    <UCard class="shadow-2xl">
      <div class="space-y-8">

        <div class="text-center">
          <div class="flex justify-center mb-4">
            <div class="bg-blue-500 rounded-full p-3 shadow-lg">
              <UIcon name="i-lucide-book-open" class="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
            Quick Start: stock overflow
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            So nutzt du stock overflow optimal für deine Übersicht
          </p>
        </div>

        <div class="space-y-6">

          <div class="border-l-4 border-green-500 pl-4">
            <h2 class="text-2xl font-semibold mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-search" class="w-6 h-6 text-green-500" />
              1. Aktien suchen
            </h2>
            <p class="text-gray-700 dark:text-gray-300 mb-2">
              Nutze die Suchleiste oben, um nach Aktien zu suchen. Suche nach folgenden Informationen:
            </p>
            <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Firmennamen (z.B. "Apple", "Tesla")</li>
              <li>Tickersymbolen (z.B. "AAPL", "TSLA")</li>
            </ul>
          </div>

          <div class="border-l-4 border-blue-500 pl-4">
            <h2 class="text-2xl font-semibold mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-trending-up" class="w-6 h-6 text-blue-500" />
              2. Charts analysieren
            </h2>
            <p class="text-gray-700 dark:text-gray-300 mb-2">
              Klicke auf eine Aktie, um detaillierte Informationen zu sehen:
            </p>
            <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Aktueller Kurs und Tagesänderung</li>
              <li>Historische Charts (30 Tage, 6 Monate, 1 Jahr, 3 Jahre)</li>
              <li>Kursdaten in EUR und USD erhältlich</li>
            </ul>
          </div>

          <div class="border-l-4 border-yellow-500 pl-4">
            <h2 class="text-2xl font-semibold mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-star" class="w-6 h-6 text-yellow-500" />
              3. Watchlist erstellen
            </h2>
            <p class="text-gray-700 dark:text-gray-300 mb-2">
              Speichere deine Lieblingsaktien:
            </p>
            <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Klicke auf den Stern neben einer Aktie</li>
              <li>Finde alle gespeicherten Aktien in deiner Watchlist</li>
              <li>Entferne Aktien jederzeit mit erneutem Klick auf den Stern oder in der Watchlist</li>
            </ul>
          </div>
        </div>

        <div class="bg-blue-50 dark:bg-gray-800 p-6 rounded-lg text-center">
          <h3 class="text-xl font-semibold mb-3 flex items-center gap-2 justify-center">
            <UIcon name="i-lucide-lightbulb" class="w-6 h-6 text-blue-500" />
            Tipps & Tricks
          </h3>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300">
            <li> ✨  Nutze die Dark Mode-Funktion für angenehmeres Arbeiten am Abend</li>
            <li> 📊  Vergleiche verschiedene Zeiträume, um Trends zu erkennen</li>
          </ul>
        </div>

        <div class="text-center pt-4">
          <UButton
              @click="$router.push('/stocks')"
              size="lg"
              color="primary"
              class="px-8"
          >
            Zur Aktiensuche
            <UIcon name="i-lucide-arrow-right" class="ml-2 w-5 h-5" />
          </UButton>
        </div>

      </div>
    </UCard>
  </div>
</template>
