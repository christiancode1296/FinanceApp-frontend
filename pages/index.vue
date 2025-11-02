<template>
  <div>
    <StockCharts />
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const stocks = ref([])
const apiUrl = useRuntimeConfig().public.API_URL

onMounted(async () => {
  try {
    const res = await axios.get(`${apiUrl}/api/stocks/AAPL`)
    stocks.value = res.data
  } catch (err) {
    console.error('Fehler beim Laden der Aktien:', err)
  }
})
</script>
