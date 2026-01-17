<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items: NavigationMenuItem[] = [
  {
    label: 'Suche',
    to: '/stocks',
    icon: 'i-humbleicons:search'
  },
  {
    label: 'Watchlist',
    to: '/watchlist',
    icon: 'i-humbleicons:pie-chart'
  },
  {
    label: 'Guide',
    to: '/howto',
    icon: 'i-humbleicons:info-circle',
  },
  {
    label: 'Abmelden',
    to: '/logout',
    icon: 'i-humbleicons:logout',
  }
]
</script>

<template>
  <div>
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="font-bold flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <UIcon name="i-humbleicons:activity" class="size-8" />
          <span>stock overflow</span>
        </NuxtLink>
      </template>

      <UNavigationMenu :items="items" />

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
        <UNavigationMenu
            :items="items"
            orientation="vertical"
        />
      </template>
    </UHeader>

    <main>
      <slot />
    </main>

    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2026 stock overflow - Deine persönliche Aktien-Watchlist</p>
          <p>© Rami Eter und Christian Püschel </p>
          <p> Projekt Webtechnologien HTW Berlin </p>
        </div>
      </div>
    </footer>
  </div>
</template>
