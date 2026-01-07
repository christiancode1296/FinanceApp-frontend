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
    label: 'How To',
    to: '/howto',
    icon: 'i-humbleicons:info-circle',
  },
  {
    label: 'Abmelden',
    to: '/abmelden',
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

    <!-- HIER FEHLT DER SLOT! -->
    <main class="container mx-auto p-6">
      <slot />
    </main>
  </div>
</template>
