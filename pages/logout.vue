<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
    <UCard class="max-w-md w-full shadow-2xl">
      <div class="text-center space-y-6 py-8">

        <div class="flex justify-center">
          <div class="bg-red-500 rounded-full p-6 shadow-lg">
            <UIcon name="i-lucide-log-out" class="w-12 h-12 text-white" />
          </div>
        </div>

        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Möchtest du dich abmelden?
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Du wirst von stock overflow abgemeldet und zur Startseite weitergeleitet.
          </p>
        </div>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-yellow-800 dark:text-yellow-300 text-left">
              Deine Watchlist und Einstellungen bleiben gespeichert und sind beim nächsten Login wieder verfügbar.
            </p>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <UButton
              @click="$router.back()"
              size="lg"
              color="gray"
              variant="outline"
              class="flex-1"
          >
            <UIcon name="i-lucide-arrow-left" class="mr-2 w-5 h-5" />
            Zurück
          </UButton>

          <UButton
              @click="handleLogout"
              size="lg"
              color="red"
              class="flex-1"
              :loading="isLoggingOut"
          >
            <UIcon name="i-lucide-log-out" class="mr-2 w-5 h-5" />
            Abmelden
          </UButton>
        </div>

      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "nuxt/app"
import { ref } from 'vue'
import { useRouter } from "vue-router"

const router = useRouter()
const isLoggingOut = ref(false)

const handleLogout = async () => {
  isLoggingOut.value = true

  try {
    // Lösche Okta Token aus LocalStorage
    localStorage.removeItem('okta-token-storage')

    // Optional: API-Call zum Backend für Logout
    // await $fetch('/api/auth/logout', { method: 'POST' })

    // Warte kurz für UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Weiterleitung zur Startseite
    navigateTo('/', { external: true })
  } catch (error) {
    console.error('Logout-Fehler:', error)
  } finally {
    isLoggingOut.value = false
  }
}
</script>
