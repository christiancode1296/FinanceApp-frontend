<template>
  <div>
    <h2>{{ symbol }} Chart</h2>
    <canvas ref="chartCanvas"></canvas>

    <h3>Die Letzten 12 Preise:</h3>
    <ul>
      <li v-for="(price, index) in lastPrices" :key="index">
        {{ index + 1 }}. {{ price }} USD
      </li>
    </ul>
  </div>
</template>

<script>
import { Chart } from 'chart.js/auto'
import axios from 'axios'

export default {
  name: 'StockCharts',
  data() {
    return {
      chart: null,
      symbol: 'DAX',
      lastPrices: [] // <- Liste für v-for
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      const API_KEY = 'FD4P53J29BMD6SES';
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${this.symbol}&interval=5min&apikey=${API_KEY}`;

      try {
        const response = await axios.get(url);
        const timeSeries = response.data['Time Series (5min)'];

        if (!timeSeries) {
          console.error("Time series not found:", response.data);
          return;
        }

        const timestamps = Object.keys(timeSeries).reverse();
        const prices = timestamps.map(t => parseFloat(timeSeries[t]['4. close']));


        this.lastPrices = prices.slice(0, 12);

        const chartData = {
          labels: timestamps,
          datasets: [{
            label: `${this.symbol} Preis`,
            data: prices,
            borderColor: 'red',
            tension: 0.3,
          }],
        };

        const config = {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            scales: {
              x: {
                ticks: {
                  maxTicksLimit: 10,
                }
              }
            }
          },
        };

        this.chart = new Chart(this.$refs.chartCanvas, config);
      } catch (error) {
        console.error("API error:", error);
      }
    }
  }
}
</script>
