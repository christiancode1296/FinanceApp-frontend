<template xmlns="http://www.w3.org/1999/html">

  <div class="all">

    <div class="header">
      <img  src="../assets/R.png" style="width: 150px; height: 150px;" />
      <h1 id="ueber">FinanceApp by Rami and Christian | 2025 </h1>
    </div>

    <div class="background"></div>

    <div class="search">
      <h2>Stocks Charts</h2>
      <label>
        Symbol:
        <input v-model.trim="symbol" @keyup.enter="reload()" placeholder="AAPL" />
      </label>
      <button @click="reload()" :disabled="loading">Laden</button>
      <span v-if="loading">lädt…</span>
      <span v-if="errorMsg" style="color:#b00;">{{ errorMsg }}</span>
    </div>

    <div class="chart">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <div class="last">
      <h3 style="margin-top:12px;">Letzten Preise:</h3>
      <ul>
        <li v-for="(entry, index) in lastPrices" :key="index">
          {{ entry.date ? formatDate(entry.date) : '-' }} —
          {{ entry.price != null ? entry.price.toFixed(2) : '-' }} USD
        </li>
      </ul>
    </div>

  </div>

</template>


<!-- Hier beginnt die JAVA SCRIPT - Bearbeitung -->
<script>
import { ref, onMounted, onUnmounted } from "vue";

export default {
  name: "StockChart",
  setup() {
    const symbol = ref("AAPL");
    const chartCanvas = ref(null);
    const errorMsg = ref("");
    const loading = ref(false);
    const lastPrices = ref([]);

    let chart;            // Chart.js-Instanz
    let abortController;  // für laufende Fetch-Requests

    // Chart.js nur bei Bedarf laden und nur nötige Komponenten registrieren
    const loadChartJs = async () => {
      const ChartJS = await import("chart.js");
      const {
        Chart,
        LineController, LineElement, PointElement,
        LinearScale, CategoryScale,
        Tooltip, Legend,
      } = ChartJS;
      Chart.register(
          LineController, LineElement, PointElement,
          LinearScale, CategoryScale, Tooltip, Legend
      );
      return Chart;
    };

    // Einzelne Serie laden → Array [{date, close}, ...] (chronologisch aufsteigend)
    const fetchSeries = async (sym) => {
      if (abortController) abortController.abort();
      abortController = new AbortController();
      loading.value = true;
      errorMsg.value = "";
      try {
        // Frontend ruft dein Backend an (Proxy). KEIN direkter FMP-Call
        const url = `/api/stocks/${encodeURIComponent(sym)}`;
        const res = await fetch(url, { signal: abortController.signal });
        if (!res.ok) throw new Error(`${sym}: HTTP ${res.status}`);
        const data = await res.json();

        // Mögliche Response-Formate tolerant behandeln
        let rows = [];
        if (Array.isArray(data?.historical)) rows = data.historical;
        else if (Array.isArray(data?.data)) rows = data.data;
        else if (Array.isArray(data?.results)) rows = data.results;
        else if (
            Array.isArray(data?.historicalStockList) &&
            data.historicalStockList.length > 0 &&
            Array.isArray(data.historicalStockList[0]?.historical)
        ) {
          rows = data.historicalStockList[0].historical;
        } else if (Array.isArray(data)) rows = data;

        // Normalisieren auf {date, close}
        const norm = rows
            .map((p) => {
              const date = p.date || p.formattedDate || p.datetime || p.label || p.timestamp || null;
              const raw = p.close ?? p.adjClose ?? p.price ?? p.value ?? null;
              const close = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : raw;
              return { date, close };
            })
            .filter((p) => p.date && typeof p.close === 'number' && !Number.isNaN(p.close));

        if (!norm.length) {
          throw new Error(`Keine Kursdaten erhalten (Symbol: ${sym}).`);
        }

        // Aufsteigend sortieren und auf 180 Tage begrenzen
        norm.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        const series = norm.slice(-180);

        // Labels/Werte erzeugen
        const labels = series.map((p) => p.date);
        const values = series.map((p) => p.close);

        // Letzte Preise aktualisieren (5 letzte Schlusskurse)
        lastPrices.value = values.slice(-5).reverse();

        return { labels, values };
      } catch (e) {
        if (e.name !== 'AbortError') {
          errorMsg.value = e.message || String(e);
        }
        return { labels: [], values: [] };
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (yyyyMmDd) => {
      if (!yyyyMmDd) return "-"; // Falls leer
      const d = new Date(yyyyMmDd);
      if (isNaN(d)) return yyyyMmDd; // Wenn kein valides Datum
      return new Intl.DateTimeFormat(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit"
      }).format(d);
    };

    const reload = async () => {
      if (abortController) abortController.abort();
      abortController = new AbortController();
      loading.value = true;
      errorMsg.value = "";

      try {
        const { labels, values } = await fetchSeries(symbol.value.toUpperCase());

        // Sicherstellen, dass labels/values gleich lang sind
        const minLength = Math.min(labels.length, values.length);
        const validLabels = labels.slice(-minLength);
        const validValues = values.slice(-minLength);

        // Letzte 5 gültige Datensätze
        const lastEntries = validLabels
            .map((date, i) => {
              const price = validValues[i];
              return price !== undefined && !isNaN(price)
                  ? { date, price }
                  : null;
            })
            .filter(Boolean)
            .slice(-5)
            .reverse();

        lastPrices.value = lastEntries;

        await renderChart(validLabels, validValues);
      } catch (e) {
        errorMsg.value = e.message || String(e);
        await renderChart([], []);
      } finally {
        loading.value = false;
      }
    };


    const renderChart = async (labels, values) => {
      const Chart = await loadChartJs();
      const ctx = chartCanvas.value.getContext("2d");
      if (chart) chart.destroy();
      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: symbol.value,
              data: values,
              tension: 0.2,
              borderColor: '#d40000', // Linienfarbe
              backgroundColor: 'rgba(255,0,0,0.3)', // Fläche unter der Linie
              pointBackgroundColor: '#ffffff', // Punkte
              fill: true, // Fläche unter der Linie ja nein
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "nearest", intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: {
              enabled: true,
              callbacks: {
                title: (items) => (items.length ? formatDate(items[0].label) : ""),
                label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue} USD`,
              },
            },
          },
          scales: {
            x: {
              display: true,
              ticks: {
                callback: (_, idx) => formatDate(labels[idx]),
                maxRotation: 0,
                autoSkip: true,
              },
            },
            y: { display: true },
          },
        },
      });
    };

    onMounted(async () => { await reload(); });
    onUnmounted(() => {
      if (abortController) abortController.abort();
      if (chart) chart.destroy();
    });

    return { symbol, chartCanvas, errorMsg, loading, lastPrices, reload, formatDate };
  },
};
</script>


<!-- Hier beginnt die CSS - Bearbeitung -->
<style scoped>

.all {background-color: black; color: white; display: flex; flex-direction: column; align-items: center; padding: 12px; min-height: 100vh; box-sizing: border-box; opacity: 0.6}


.header {
  display: flex;
  align-items: center;      /* vertikal mittig */
  justify-content: center;  /* zentriert alles zusammen */
  position: relative;       /* erlaubt absolute Positionierung vom Logo */
  height: 500px;
}

.chart {position: relative; width: 500px; height: 300px;z-index: 1}

.search {margin: 12px 0; gap:8px; align-items:center;z-index: 2}

img {margin-right: 10px}

h1 { color: white; text-align: center; }

#ueber { font-size: 36px; margin-bottom: 0; position: static; }

</style>