<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
    <div class="max-w-4xl w-full">
      <UCard class="shadow-2xl">
        <div class="text-center space-y-6 py-8">

          <div class="flex justify-center">
            <div class="bg-blue-500 rounded-full p-6 shadow-lg">
              <UIcon name="i-humbleicons:activity" class="w-16 h-16 text-white" />
            </div>
          </div>

          <div>
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Willkommen bei stock overflow
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-300">
              Deine persönliche Aktien-Watchlist
            </p>
          </div>

          <div class="max-w-2xl mx-auto">
            <p class="text-lg text-gray-700 dark:text-gray-300">
              Mit dieser App kannst du ganz einfach nach Aktien suchen,
              ihre Kursentwicklung verfolgen und deine Favoriten in einer
              persönlichen Watchlist speichern.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
            <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div class="flex justify-center mb-4">
                <div class="bg-green-500 rounded-full p-3">
                  <UIcon name="i-lucide-search" class="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 class="text-lg font-semibold mb-2">Suchen</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Finde Aktien schnell und einfach über die Suchfunktion
              </p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div class="flex justify-center mb-4">
                <div class="bg-blue-500 rounded-full p-3">
                  <UIcon name="i-lucide-trending-up" class="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 class="text-lg font-semibold mb-2">Verfolgen</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Analysiere Charts mit verschiedenen Zeiträumen
              </p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div class="flex justify-center mb-4">
                <div class="bg-yellow-500 rounded-full p-3">
                  <UIcon name="i-lucide-star" class="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 class="text-lg font-semibold mb-2">Speichern</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Markiere deine Favoriten für schnellen Zugriff
              </p>
            </div>
          </div>

          <div class="pt-8">
            <UButton
                @click="goToLogin"
                size="xl"
                color="primary"
                class="px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Jetzt starten
              <UIcon name="i-lucide-arrow-right" class="ml-2 w-5 h-5" />
            </UButton>
          </div>

          <div class="pt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>
              💡 Tipp: Nutze den Stern-Button, um Aktien zu deiner Watchlist hinzuzufügen
            </p>
          </div>

        </div>
      </UCard>

      <div class="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p>Aktuelle Kursdaten und historische Charts für deine Investitionsentscheidungen</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "nuxt/app";

const goToLogin = () => {
  navigateTo('/login', { external: true })
}
</script>
