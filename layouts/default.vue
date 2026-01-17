<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuth } from '@okta/okta-vue'
import { navigateTo } from "nuxt/app"
import {computed, onMounted, ref, watch } from "vue"


const auth = useAuth()
const isAuthenticated = ref(false)

// Authentifizierungsstatus prüfen
onMounted(async () => {
  isAuthenticated.value = await auth.isAuthenticated()
})

// Reaktiv auf Authentifizierungsänderungen reagieren
watch(() => auth.authState, async () => {
  isAuthenticated.value = await auth.isAuthenticated()
}, { deep: true })

// Navigation-Handler für geschützte Routen
const handleProtectedNavigation = (event: Event, to: string) => {
  if (!isAuthenticated.value) {
    event.preventDefault()
    // Optional: Toast oder Hinweis anzeigen
  }
}

// Öffentliche Items (immer klickbar)
const publicItems: NavigationMenuItem[] = [
  {
    label: 'Guide',
    to: '/howto',
    icon: 'i-humbleicons:info-circle',
  }
]

// Geschützte Items (nur wenn eingeloggt klickbar)
const protectedItems = computed(() => [
  {
    label: 'Suche',
    to: isAuthenticated.value ? '/stocks' : undefined,
    icon: 'i-humbleicons:search',
    disabled: !isAuthenticated.value,
    class: !isAuthenticated.value ? 'opacity-50 cursor-not-allowed' : ''
  },
  {
    label: 'Watchlist',
    to: isAuthenticated.value ? '/watchlist' : undefined,
    icon: 'i-humbleicons:pie-chart',
    disabled: !isAuthenticated.value,
    class: !isAuthenticated.value ? 'opacity-50 cursor-not-allowed' : ''
  }
])

// Abmelden Item (nur wenn eingeloggt klickbar)
const logoutItem = computed(() => ({
  label: isAuthenticated.value ? 'Abmelden' : 'Anmelden',
  to: isAuthenticated.value ? '/logout' : undefined,
  icon: isAuthenticated.value ? 'i-humbleicons:logout' : 'i-humbleicons:logout'
}))
const handleLoginClick = () => {
  if (!isAuthenticated.value) {
    navigateTo('/login', {external: true})
  }
}
// Alle Items kombiniert
const items = computed<NavigationMenuItem[]>(() => [
  ...protectedItems.value,
  ...publicItems,
  logoutItem.value
])
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="font-bold flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <UIcon name="i-humbleicons:activity" class="size-8" />
          <span>stock overflow</span>
        </NuxtLink>
      </template>

      <template #default>
        <nav class="flex items-center gap-1">
          <template v-for="item in items" :key="item.label">
            <UButton
                v-if="item.disabled"
                :icon="item.icon"
                variant="ghost"
                color="neutral"
                :class="item.class"
                @click.prevent
            >
              {{ item.label }}
            </UButton>
            <UButton
                v-else
                :to="item.to"
                :icon="item.icon"
                variant="ghost"
                color="neutral"
            >
              {{ item.label }}
            </UButton>
          </template>
        </nav>
      </template>

      <template #right>
        <UColorModeButton />
        <UButton
            color="neutral"
            variant="ghost"
            to="https://github.com/christiancode1296"
            target="_blank"
            icon="i-simple-icons-github"
            aria-label="GitHub"
        />
      </template>

      <template #body>
        <nav class="flex flex-col gap-1">
          <template v-for="item in items" :key="item.label">
            <UButton
                v-if="item.disabled"
                :icon="item.icon"
                variant="ghost"
                color="neutral"
                :class="item.class"
                block
                @click.prevent
            >
              {{ item.label }}
            </UButton>
            <UButton
                v-else-if="item.label === 'Anmelden'"
                :icon="item.icon"
                variant="ghost"
                color="neutral"
                @click="handleLoginClick"
            >
              {{ item.label }}
            </UButton>
            <UButton
                v-else
                :to="item.to"
                :icon="item.icon"
                variant="ghost"
                color="neutral"
                block
            >
              {{ item.label }}
            </UButton>
          </template>
        </nav>
      </template>
    </UHeader>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2026 stock overflow - Deine persönliche Aktien-Watchlist</p>
          <p>© Rami Eter und Christian Püschel</p>
          <p>Projekt Webtechnologien HTW Berlin</p>
        </div>
      </div>
    </footer>
  </div>
</template>
