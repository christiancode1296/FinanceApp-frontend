<template>
  <div>
    <StockCharts />
  </div>
</template>

<script>
import axios from 'axios'; // ← hinzufügen!
import StockCharts from './components/StockCharts.vue';

const apiBase = process.env.VUE_APP_API_URL;
axios.get(`${apiBase}/stocks/AAPL`)
    .then(res => console.log(res.data))
    .catch(err => console.error("Fehler beim Backend-Call:", err));

export default {
  components: {
    StockCharts
  }
}
</script>