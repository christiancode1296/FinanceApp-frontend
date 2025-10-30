<template>
  <div>
    <StockCharts />
  </div>
</template>

<script>
import StockCharts from './components/StockCharts.vue';

const apiBase = process.env.VUE_APP_API_URL;
axios.get(`${apiBase}/stocks/AAPL`);

export default {
  components: {
    StockCharts
  }
}
</script>
