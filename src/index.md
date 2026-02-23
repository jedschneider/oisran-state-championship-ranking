---
title: Oregon XC Ski — Athlete Progress
toc: false
---

# 2025 → 2026 Athlete Progress

Oregon High School XC Ski State Championships · Individual athlete progression across two seasons.

[Methodology](./methodology) · [Data Explorer](./explore)

```js
const data = await FileAttachment("data/athletes.json").json();
```

**Gender** — switch between the boys and girls fields. All three charts update. Only athletes who competed in both 2025 and 2026 are included. Default: Boys.

```js
const gender = view(Inputs.radio(["Boys", "Girls"], {value: "Boys", label: "Gender"}));
```

**Event** — choose which race to analyze. *Combined* sums each athlete's freestyle and classic times (only athletes who finished both races in a given year appear). *Freestyle* and *Classic* show individual race results and include athletes who finished that race even if they missed the other. Default: Combined.

```js
const eventChoice = view(Inputs.radio(
  ["Combined", "Freestyle", "Classic"],
  {value: "Combined", label: "Event"}
));
```

```js
const athletes = gender === "Boys" ? data.boys : data.girls;

const timeKey25 = eventChoice === "Combined" ? "comb25_time" : eventChoice === "Freestyle" ? "fs25_time" : "cl25_time";
const timeKey26 = eventChoice === "Combined" ? "comb26_time" : eventChoice === "Freestyle" ? "fs26_time" : "cl26_time";
const rankKey25 = eventChoice === "Combined" ? "comb25_rank" : eventChoice === "Freestyle" ? "fs25_rank" : "cl25_rank";
const rankKey26 = eventChoice === "Combined" ? "comb26_rank" : eventChoice === "Freestyle" ? "fs26_rank" : "cl26_rank";
const eventLabel = eventChoice === "Combined" ? "Combined (FS + Classic)" : eventChoice === "Freestyle" ? "5K Freestyle" : "4K Classic";

// Athletes with data in both years for the selected event
const withEvent = athletes.filter(a => a[rankKey25] != null && a[rankKey26] != null);
```

**Filter athletes** — narrow all three charts to a specific set of athletes. Hold Cmd/Ctrl to select multiple; click a selected name to deselect it. When empty, all athletes are shown. The reference athlete (below) is always included regardless of this filter. Default: all athletes.

```js
const athleteFilterInput = Inputs.select(
  withEvent.map(a => a.name),
  {label: "Filter athletes", multiple: true, size: 6}
);
const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
clearBtn.style.cssText = "margin-top:4px;display:block;font-size:12px;cursor:pointer;";
clearBtn.addEventListener("click", () => {
  for (const opt of athleteFilterInput.querySelector("select").options) opt.selected = false;
  athleteFilterInput.dispatchEvent(new Event("input", {bubbles: true}));
});
athleteFilterInput.appendChild(clearBtn);
const athleteFilter = view(athleteFilterInput);
```

**Reference athlete** — the athlete used as the baseline in the Gap chart. All other athletes' times are shown as seconds ahead of or behind this person in each year. The net change in that gap from 2025 to 2026 shows relative improvement. This athlete is always visible in all charts even when the filter above is active. Default: Jayvin Lemieux (boys) / Anhelina Hryhorenko (girls), sorted by 2026 finish position.

```js
const refCandidates = athletes
  .filter(a => a[timeKey25] != null && a[timeKey26] != null)
  .sort((a, b) => (a[rankKey26] ?? 999) - (b[rankKey26] ?? 999))
  .map(a => a.name);

const defaultRef = gender === "Boys" ? "Jayvin Lemieux" : "Anhelina Hryhorenko";
const refName = view(Inputs.select(refCandidates, {
  label: "Reference athlete",
  value: refCandidates.includes(defaultRef) ? defaultRef : refCandidates[0]
}));
```

```js
// When a filter is active, always include the reference athlete
const filteredAthletes = athleteFilter.length > 0
  ? withEvent.filter(a => athleteFilter.includes(a.name) || a.name === refName)
  : withEvent;
```

---

## Rank: 2025 → 2026

Each line is one athlete. Rank 1 at top. Downward slope = improved standing.

```js
const slopeData = filteredAthletes.flatMap(a => [
  {name: a.name, year: 2025, rank: a[rankKey25]},
  {name: a.name, year: 2026, rank: a[rankKey26]}
]);

const rankChange = new Map(filteredAthletes.map(a => [
  a.name,
  a[rankKey25] - a[rankKey26]
]));
```

```js
resize((width) => Plot.plot({
  width,
  height: Math.max(500, filteredAthletes.length * 9),
  marginLeft: 140,
  marginRight: 140,
  x: {
    domain: [2025, 2026],
    tickFormat: d => String(d),
    label: null,
    ticks: [2025, 2026]
  },
  y: {
    reverse: true,
    label: "Rank",
    grid: true
  },
  color: {
    domain: [-1, 0, 1],
    range: ["#ef4444", "#94a3b8", "#22c55e"],
    type: "threshold"
  },
  marks: [
    Plot.line(slopeData, {
      x: "year",
      y: "rank",
      z: "name",
      curve: "bump-x",
      stroke: d => {
        const change = rankChange.get(d.name);
        return change > 0 ? 1 : change < 0 ? -1 : 0;
      },
      strokeWidth: 1.5,
      strokeOpacity: 0.7,
      tip: true,
      title: d => {
        const a = filteredAthletes.find(x => x.name === d.name);
        const change = rankChange.get(d.name);
        return `${d.name}\n2025: #${a[rankKey25]}\n2026: #${a[rankKey26]}\nChange: ${change > 0 ? "+" : ""}${change} places`;
      }
    }),
    Plot.text(slopeData, Plot.selectFirst({
      x: "year",
      y: "rank",
      z: "name",
      text: d => `${rankChange.get(d.name) > 0 ? "▲" : rankChange.get(d.name) < 0 ? "▼" : "—"} ${d.name}`,
      textAnchor: "end",
      dx: -8,
      fontSize: 10,
      fill: d => {
        const c = rankChange.get(d.name);
        return c > 0 ? "#16a34a" : c < 0 ? "#dc2626" : "#64748b";
      }
    })),
    Plot.text(slopeData, Plot.selectLast({
      x: "year",
      y: "rank",
      z: "name",
      text: d => d.name,
      textAnchor: "start",
      dx: 8,
      fontSize: 10,
      fill: d => {
        const c = rankChange.get(d.name);
        return c > 0 ? "#16a34a" : c < 0 ? "#dc2626" : "#64748b";
      }
    }))
  ]
}))
```

---

## Gap to Reference Athlete: ${refName}

Time difference (seconds) vs a reference athlete. Positive = slower; negative = faster. Change in gap shows relative improvement.

```js
const ref = athletes.find(a => a.name === refName);

const dumbbellData = filteredAthletes
  .filter(a => a[timeKey25] != null && a[timeKey26] != null && ref?.[timeKey25] != null && ref?.[timeKey26] != null)
  .sort((a, b) => (a[rankKey26] ?? 999) - (b[rankKey26] ?? 999))
  .map(a => ({
    name: a.name,
    gap25: a[timeKey25] - ref[timeKey25],
    gap26: a[timeKey26] - ref[timeKey26],
    improvement: (a[timeKey25] - ref[timeKey25]) - (a[timeKey26] - ref[timeKey26])
  }));

const dumbbellLong = dumbbellData.flatMap(a => [
  {name: a.name, gap: a.gap25, year: "2025", improvement: a.improvement},
  {name: a.name, gap: a.gap26, year: "2026", improvement: a.improvement}
]);
```

```js
resize((width) => Plot.plot({
  width,
  height: Math.max(400, dumbbellData.length * 18 + 60),
  marginLeft: 150,
  marginRight: 20,
  x: {
    label: "Seconds behind/ahead of reference athlete",
    grid: true,
    tickFormat: d => d > 0 ? `+${d}s` : `${d}s`
  },
  y: {
    domain: [...dumbbellData.map(d => d.name)].reverse(),
    label: null
  },
  color: {
    domain: ["2025", "2026"],
    range: ["#94a3b8", "#3b82f6"],
    legend: true
  },
  marks: [
    Plot.ruleX([0], {stroke: "#e2e8f0", strokeWidth: 2}),
    Plot.link(dumbbellData, {
      x1: "gap25",
      x2: "gap26",
      y: "name",
      stroke: d => d.improvement > 0 ? "#bbf7d0" : d.improvement < 0 ? "#fecaca" : "#e2e8f0",
      strokeWidth: 2
    }),
    Plot.dot(dumbbellLong, {
      x: "gap",
      y: "name",
      fill: "year",
      r: 4,
      tip: true,
      title: d => {
        const a = dumbbellData.find(x => x.name === d.name);
        const delta = a.improvement;
        return `${d.name}\nGap to ${refName}: ${d.gap > 0 ? "+" : ""}${d.gap.toFixed(1)}s (${d.year})\nNet change: ${delta > 0 ? "+" : ""}${delta.toFixed(1)}s`;
      }
    }),
    Plot.text(dumbbellData, {
      x: d => Math.max(d.gap25, d.gap26) + 2,
      y: "name",
      text: d => {
        const delta = d.improvement;
        return delta > 0 ? `+${delta.toFixed(0)}s` : `${delta.toFixed(0)}s`;
      },
      fill: d => d.improvement > 0 ? "#16a34a" : d.improvement < 0 ? "#dc2626" : "#94a3b8",
      fontSize: 9,
      textAnchor: "start"
    })
  ]
}))
```

---

## Year-over-Year Scatter

Each dot is an athlete. X = 2025 rank, Y = 2026 rank. Athletes **above** the diagonal improved. Hover for details.

```js
// maxRank uses the full field so axis scale stays stable when filtering
const maxRank = withEvent.length > 0
  ? Math.max(...withEvent.map(a => Math.max(a[rankKey25], a[rankKey26])))
  : 10;
```

```js
resize((width) => {
  const size = Math.min(width, 600);
  return Plot.plot({
    width: size,
    height: size,
    marginBottom: 40,
    x: {label: `2025 ${eventLabel} Rank`, grid: true, domain: [1, maxRank + 2]},
    y: {label: `2026 ${eventLabel} Rank`, grid: true, domain: [-(maxRank + 2), -1], tickFormat: d => String(-d)},
    marks: [
      Plot.line(
        [{x: 1, y: -1}, {x: maxRank + 2, y: -(maxRank + 2)}],
        {stroke: "#cbd5e1", strokeDasharray: "4 3", strokeWidth: 1}
      ),
      Plot.text([{x: maxRank * 0.6, y: -(maxRank * 0.6) + 1.5}], {
        x: "x", y: "y",
        text: ["no change"],
        fill: "#94a3b8",
        fontSize: 10,
        rotate: 45
      }),
      Plot.dot(filteredAthletes, {
        x: rankKey25,
        y: d => -d[rankKey26],
        r: 5,
        fill: d => d[rankKey25] > d[rankKey26] ? "#22c55e" : d[rankKey25] < d[rankKey26] ? "#ef4444" : "#94a3b8",
        fillOpacity: 0.8,
        stroke: "white",
        strokeWidth: 0.5,
        tip: true,
        title: d => {
          const change = d[rankKey25] - d[rankKey26];
          return `${d.name}\n2025: #${d[rankKey25]} (${formatTime(d[timeKey25])})\n2026: #${d[rankKey26]} (${formatTime(d[timeKey26])})\n${change > 0 ? "↑ Improved" : change < 0 ? "↓ Declined" : "→ Same"} ${Math.abs(change)} places`;
        }
      }),
      Plot.text(filteredAthletes.filter(a => Math.abs(a[rankKey25] - a[rankKey26]) >= 10), {
        x: rankKey25,
        y: d => -d[rankKey26],
        text: "name",
        dy: -8,
        fontSize: 9,
        fill: "#475569"
      })
    ]
  });
})
```

```js
function formatTime(seconds) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}
```

<style>
.hero { display: none; }
</style>
