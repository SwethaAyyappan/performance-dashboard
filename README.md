# Real-Time Performance Dashboard (Next.js + Canvas)

A high-performance real-time data visualization dashboard built using **Next.js 14 (App Router)**, **React**, and **HTML Canvas** with **no chart libraries**.  
The system streams live data at **100ms intervals** and supports **multiple interactive chart types** while maintaining **smooth 60 FPS rendering**.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| **Real-Time Streaming** | Generates continuous time-series data (100ms interval) |
| **Multiple Chart Types** | Line, Bar, Scatter, Heatmap (GPU-accelerated canvas) |
| **Time Range Controls** | View recent 1 minute, 5 minutes, or 1 hour activity |
| **Data Aggregation** | Efficient time-bucket grouping for scalable rendering |
| **Virtualized Data Table** | Handles thousands of stream entries without lag |
| **Responsive Layout** | Works on large displays and laptop screens |
| **Performance Overlay** | FPS + Memory usage displayed live |
| **No Chart Libraries Used** | Visualization is custom Canvas rendering |

---

##  Tech Stack

| Layer | Technology |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Rendering | HTML Canvas + optimized draw loops |
| State + Data Flow | React Hooks + memoization |
| Styling | Minimal CSS / inline style system |
| Performance Tools | ResizeObserver, requestAnimationFrame, sliding buffers |

---

##  Installation

```
git clone <your-repo-url>
cd performance-dashboard
npm install
npm run dev
```

Then open the dashboard:

```
http://localhost:3000/dashboard
```

---

##  Project Structure

```
performance-dashboard/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx               # Main dashboard UI
│   │   └── layout.tsx
│   ├── api/
│   │   └── data/
│   │       └── route.ts           # Data stream endpoint (optional extension)
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── ScatterPlot.tsx
│   │   └── Heatmap.tsx
│   ├── ui/
│   │   └── DataTable.tsx
│   ├── controls/
│   │   ├── FilterPanel.tsx        # (Pluggable)
│   │   └── TimeRangeSelector.tsx
│   └── providers/
│       └── DataProvider.tsx       # (Optional global store)
├── hooks/
│   ├── useDataStream.ts
│   ├── useChartRenderer.ts
│   ├── usePerformanceMonitor.ts
│   └── useVirtualization.ts
├── lib/
│   ├── dataGenerator.ts
│   ├── performanceUtils.ts
│   ├── canvasUtils.ts
│   └── types.ts
├── public/
├── README.md
└── PERFORMANCE.md
```

---

##  How It Works

| System Component | Purpose |
|-----------------|---------|
| `useDataStream` | Generates and manages real-time sliding data buffer |
| `aggregateByTime` | Buckets values into time windows for smooth zooming |
| `useChartRenderer` | Handles canvas scaling, DPI, resizing, redraw triggers |
| Canvas charts | Draw directly using `CanvasRenderingContext2D` API |

No React rendering occurs inside animation frames — **Canvas does the drawing**, React updates only when necessary.

---

##  Supported Time Ranges

| Range | Window | Bucket Interval |
|------|--------|----------------|
| **1m** | 60 seconds | 1 second bins |
| **5m** | 5 minutes | 5 second bins |
| **1h** | 60 minutes | 60 second bins |

Selectable via top range selector.

---

##  Benchmarks (MacBook Air M1 / Chrome)

| Test | Result |
|------|--------|
| Live Stream Load | ~10,000 points sustained |
| FPS (All Charts Active) | **54–60 FPS** |
| Memory Stability | **No leak**, ~35–55 MB steady |
| Interaction Latency | < 30ms |

(See **PERFORMANCE.md** for full analysis.)



##  Future Enhancements (Easy Add-Ons)

| Enhancement | Expected Impact |
|------------|----------------|
| Web Workers for aggregation | Zero main-thread processing cost |
| OffscreenCanvas | GPU-offloaded drawing |
| WebSocket live feed | Real production telemetry support |
| Historical data replay | Full timeline analysis |

---

##  License

MIT License — Free to modify and use.

---


