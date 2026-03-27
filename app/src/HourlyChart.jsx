// ─── HourlyChart.jsx ──────────────────────────────────────────────────────────
// Graphique Chart.js animé pour les prévisions horaires.
// Double courbe : température + probabilité de précipitations.

import { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler, Legend,
} from "chart.js";
import { useWeatherCtx, toDisplayTemp } from "./WeatherContext.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

export default function HourlyChart() {
  const { hourly, prefs } = useWeatherCtx();
  const T   = (c) => toDisplayTemp(c, prefs.unit);
  const sym = prefs.unit === "F" ? "°F" : "°C";

  if (!hourly.length) return null;

  const labels = hourly.map(h => h.time);
  const temps  = hourly.map(h => T(h.temp));
  const precip = hourly.map(h => h.precipProb ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label:           `Température (${sym})`,
        data:            temps,
        yAxisID:         "yTemp",
        borderColor:     "#5bb1ff",
        backgroundColor: "rgba(91,177,255,0.12)",
        borderWidth:     2.5,
        pointRadius:     0,
        pointHoverRadius:5,
        pointHoverBackgroundColor:"#5bb1ff",
        pointHoverBorderColor:"#fff",
        pointHoverBorderWidth:2,
        fill:            true,
        tension:         0.4,
      },
      {
        label:           "Probabilité pluie (%)",
        data:            precip,
        yAxisID:         "yPrecip",
        borderColor:     "rgba(197,192,255,0.6)",
        backgroundColor: "rgba(197,192,255,0.06)",
        borderWidth:     1.5,
        borderDash:      [4, 3],
        pointRadius:     0,
        pointHoverRadius:4,
        pointHoverBackgroundColor:"#c5c0ff",
        fill:            true,
        tension:         0.4,
      },
    ],
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    animation:           { duration:800, easing:"easeOutQuart" },
    interaction:         { mode:"index", intersect:false },
    plugins: {
      legend: {
        display:  true,
        position: "top",
        align:    "end",
        labels: {
          color:     "#9baad6",
          font:      { size:11, family:"Inter" },
          boxWidth:  12,
          boxHeight: 2,
          padding:   16,
          usePointStyle: true,
          pointStyle: "line",
        },
      },
      tooltip: {
        backgroundColor: "rgba(12,25,52,0.95)",
        titleColor:      "#dee5ff",
        bodyColor:       "#9baad6",
        borderColor:     "rgba(91,177,255,0.3)",
        borderWidth:     1,
        padding:         10,
        callbacks: {
          label: ctx => ctx.datasetIndex === 0
            ? ` ${ctx.raw}${sym}`
            : ` ${ctx.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color:"rgba(255,255,255,0.04)", drawBorder:false },
        ticks: { color:"#9baad6", font:{size:10,family:"Inter"}, maxTicksLimit:8 },
      },
      yTemp: {
        position: "left",
        grid:     { color:"rgba(255,255,255,0.04)", drawBorder:false },
        ticks:    { color:"#5bb1ff", font:{size:10,family:"Inter"}, callback: v=>`${v}°` },
      },
      yPrecip: {
        position: "right",
        min: 0, max: 100,
        grid:     { display:false },
        ticks:    { color:"rgba(197,192,255,0.6)", font:{size:10,family:"Inter"}, callback: v=>`${v}%` },
      },
    },
  };

  return (
    <div style={{
      background:           "rgba(12,25,52,0.5)",
      backdropFilter:       "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius:          24,
      border:               "1px solid rgba(255,255,255,0.06)",
      padding:               24,
    }}>
      <p style={{
        fontSize:12, fontWeight:700, color:"#9baad6",
        textTransform:"uppercase", letterSpacing:"0.1em",
        margin:"0 0 16px",
      }}>
        Température & précipitations — 24h
      </p>
      <div style={{ height:200 }}>
        <Line data={data} options={options}/>
      </div>
    </div>
  );
}
