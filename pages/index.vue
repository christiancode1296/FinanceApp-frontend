<template>
  <div>
    <!-- Zeige immer die Welcome-Seite auf der Startseite -->
    <Welcome @start="handleStart" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'default'
})

// ============================================================
// Composables
// ============================================================

const router = useRouter()

// ============================================================
// Functions
// ============================================================

/**
 * Wird aufgerufen, wenn User auf "Jetzt starten" klickt
 * Navigiert zur Stocks-Seite (Suche)
 */
const handleStart = () => {
  // Navigiere zur Suche-Seite
  router.push('/stocks')
}
</script>
