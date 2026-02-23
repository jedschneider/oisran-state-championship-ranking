---
title: Data Explorer
toc: true
---

# Data Explorer

Ad hoc SQL queries against the full athlete dataset using DuckDB WASM.

---

## Schema

Three tables are loaded into DuckDB:

**`athletes`** — all athletes combined (boys + girls)

| Column | Type | Description |
|--------|------|-------------|
| `gender` | TEXT | `'Boys'` or `'Girls'` |
| `name` | TEXT | Full name |
| `first` | TEXT | First name |
| `last` | TEXT | Last name |
| `fs25_time` | DOUBLE | 2025 freestyle finish time (seconds) |
| `fs25_rank` | INTEGER | 2025 freestyle rank — full field including No Score |
| `cl25_time` | DOUBLE | 2025 classic finish time (seconds) |
| `cl25_rank` | INTEGER | 2025 classic rank — full field |
| `comb25_time` | DOUBLE | 2025 combined time: FS + classic (seconds); `NULL` if either race missing |
| `comb25_rank` | INTEGER | 2025 combined rank; `NULL` if either race missing |
| `fs26_time` | DOUBLE | 2026 freestyle finish time (seconds) |
| `fs26_rank` | INTEGER | 2026 freestyle rank — full field |
| `cl26_time` | DOUBLE | 2026 classic finish time (seconds) |
| `cl26_rank` | INTEGER | 2026 classic rank — full field |
| `comb26_time` | DOUBLE | 2026 combined time: FS + classic (seconds); `NULL` if either race missing |
| `comb26_rank` | INTEGER | 2026 combined rank; `NULL` if either race missing |

**`boys`** and **`girls`** — same schema as `athletes` minus the `gender` column.

> Times are in **seconds** (float). To format as `M:SS.s`: `floor(t/60) || ':' || printf('%04.1f', t % 60)`.

---

## Ad Hoc Query

```js
import {DuckDBClient} from "npm:@observablehq/duckdb";

const data = await FileAttachment("data/athletes.json").json();

const db = await DuckDBClient.of({
  athletes: [
    ...data.boys.map(a => ({...a, gender: "Boys"})),
    ...data.girls.map(a => ({...a, gender: "Girls"}))
  ],
  boys: data.boys,
  girls: data.girls
});
```

```js
const sql = view(Inputs.textarea({
  label: "SQL",
  value:
`SELECT
  gender,
  name,
  comb25_rank                       AS rank_25,
  comb26_rank                       AS rank_26,
  comb25_rank - comb26_rank         AS rank_change,
  round(comb25_time)                AS combined_25s,
  round(comb26_time)                AS combined_26s,
  round(comb25_time - comb26_time)  AS time_delta_s
FROM athletes
WHERE comb25_rank IS NOT NULL
  AND comb26_rank IS NOT NULL
ORDER BY rank_change DESC
LIMIT 30`,
  rows: 10,
  submit: "Run ▶",
  style: "font-family: monospace; font-size: 12px; width: 100%"
}));
```

```js
{
  let result, err;
  try {
    result = await db.query(sql);
  } catch (e) {
    err = e;
  }
  if (err) {
    const box = document.createElement("pre");
    box.textContent = err.message;
    box.style.cssText = "color:#b91c1c;background:#fef2f2;padding:10px 14px;border-radius:6px;font-size:12px;overflow:auto";
    display(box);
  } else {
    display(Inputs.table(result));
  }
}
```

---

## Example Queries

### Most improved — combined rank

Athletes who moved up the most places in combined ranking, broken out by gender.

```sql run=false
SELECT
  gender,
  name,
  comb25_rank                        AS rank_25,
  comb26_rank                        AS rank_26,
  comb25_rank - comb26_rank          AS rank_change,
  round(comb25_time - comb26_time)   AS time_delta_s
FROM athletes
WHERE comb25_rank IS NOT NULL
  AND comb26_rank IS NOT NULL
ORDER BY rank_change DESC
LIMIT 20
```

```js
display(Inputs.table(await db.query(
`SELECT
  gender,
  name,
  comb25_rank                        AS rank_25,
  comb26_rank                        AS rank_26,
  comb25_rank - comb26_rank          AS rank_change,
  round(comb25_time - comb26_time)   AS time_delta_s
FROM athletes
WHERE comb25_rank IS NOT NULL
  AND comb26_rank IS NOT NULL
ORDER BY rank_change DESC
LIMIT 20`)));
```

### Freestyle time improvement

Raw time drop in the 5K freestyle, largest improvements first.

```sql run=false
SELECT
  gender,
  name,
  round(fs25_time)                   AS fs_25s,
  round(fs26_time)                   AS fs_26s,
  round(fs25_time - fs26_time)       AS time_drop_s,
  fs25_rank                          AS rank_25,
  fs26_rank                          AS rank_26
FROM athletes
WHERE fs25_time IS NOT NULL
  AND fs26_time IS NOT NULL
ORDER BY time_drop_s DESC
LIMIT 20
```

```js
display(Inputs.table(await db.query(
`SELECT
  gender,
  name,
  round(fs25_time)                   AS fs_25s,
  round(fs26_time)                   AS fs_26s,
  round(fs25_time - fs26_time)       AS time_drop_s,
  fs25_rank                          AS rank_25,
  fs26_rank                          AS rank_26
FROM athletes
WHERE fs25_time IS NOT NULL
  AND fs26_time IS NOT NULL
ORDER BY time_drop_s DESC
LIMIT 20`)));
```

### 2026 leaderboard by gender and event

Top finishers in each event for 2026 with formatted times.

```sql run=false
SELECT
  gender,
  comb26_rank                        AS combined_rank,
  name,
  floor(fs26_time/60) || ':' || printf('%04.1f', fs26_time % 60)     AS freestyle,
  floor(cl26_time/60) || ':' || printf('%04.1f', cl26_time % 60)     AS classic,
  floor(comb26_time/60) || ':' || printf('%04.1f', comb26_time % 60) AS combined
FROM athletes
WHERE comb26_rank IS NOT NULL
ORDER BY gender, comb26_rank
LIMIT 30
```

```js
display(Inputs.table(await db.query(
`SELECT
  gender,
  comb26_rank                        AS combined_rank,
  name,
  floor(fs26_time/60) || ':' || printf('%04.1f', fs26_time % 60)     AS freestyle,
  floor(cl26_time/60) || ':' || printf('%04.1f', cl26_time % 60)     AS classic,
  floor(comb26_time/60) || ':' || printf('%04.1f', comb26_time % 60) AS combined
FROM athletes
WHERE comb26_rank IS NOT NULL
ORDER BY gender, comb26_rank
LIMIT 30`)));
```

### Athletes missing a combined rank

Athletes who finished at least one event in each year but are excluded from combined rankings — likely a DNS in one race.

```sql run=false
SELECT
  gender,
  name,
  fs25_rank,  cl25_rank,  comb25_rank,
  fs26_rank,  cl26_rank,  comb26_rank
FROM athletes
WHERE (fs25_rank IS NOT NULL OR cl25_rank IS NOT NULL)
  AND (fs26_rank IS NOT NULL OR cl26_rank IS NOT NULL)
  AND (comb25_rank IS NULL OR comb26_rank IS NULL)
ORDER BY gender, name
```

```js
display(Inputs.table(await db.query(
`SELECT
  gender,
  name,
  fs25_rank,  cl25_rank,  comb25_rank,
  fs26_rank,  cl26_rank,  comb26_rank
FROM athletes
WHERE (fs25_rank IS NOT NULL OR cl25_rank IS NOT NULL)
  AND (fs26_rank IS NOT NULL OR cl26_rank IS NOT NULL)
  AND (comb25_rank IS NULL OR comb26_rank IS NULL)
ORDER BY gender, name`)));
```

### Average times by event and year

Field-wide averages across both genders for each race and year.

```sql run=false
SELECT
  gender,
  round(avg(fs25_time))    AS avg_fs_25s,
  round(avg(fs26_time))    AS avg_fs_26s,
  round(avg(cl25_time))    AS avg_cl_25s,
  round(avg(cl26_time))    AS avg_cl_26s,
  round(avg(comb25_time))  AS avg_comb_25s,
  round(avg(comb26_time))  AS avg_comb_26s
FROM athletes
GROUP BY gender
ORDER BY gender
```

```js
display(Inputs.table(await db.query(
`SELECT
  gender,
  round(avg(fs25_time))    AS avg_fs_25s,
  round(avg(fs26_time))    AS avg_fs_26s,
  round(avg(cl25_time))    AS avg_cl_25s,
  round(avg(cl26_time))    AS avg_cl_26s,
  round(avg(comb25_time))  AS avg_comb_25s,
  round(avg(comb26_time))  AS avg_comb_26s
FROM athletes
GROUP BY gender
ORDER BY gender`)));
```

### Gap to top finisher (SQL version of dumbbell chart)

Replicates the gap-to-reference logic in SQL. Swap the name in the `ref` CTE for any reference athlete.

```sql run=false
WITH ref AS (
  SELECT
    comb25_time AS ref_25,
    comb26_time AS ref_26
  FROM athletes
  WHERE name = 'Jayvin Lemieux'
    AND gender = 'Boys'
)
SELECT
  a.name,
  round(a.comb25_time - r.ref_25)                                     AS gap_25s,
  round(a.comb26_time - r.ref_26)                                     AS gap_26s,
  round((a.comb25_time - r.ref_25) - (a.comb26_time - r.ref_26))     AS net_change_s
FROM athletes a, ref r
WHERE a.gender = 'Boys'
  AND a.comb25_time IS NOT NULL
  AND a.comb26_time IS NOT NULL
ORDER BY net_change_s DESC
LIMIT 20
```

```js
display(Inputs.table(await db.query(
`WITH ref AS (
  SELECT
    comb25_time AS ref_25,
    comb26_time AS ref_26
  FROM athletes
  WHERE name = 'Jayvin Lemieux'
    AND gender = 'Boys'
)
SELECT
  a.name,
  round(a.comb25_time - r.ref_25)                                     AS gap_25s,
  round(a.comb26_time - r.ref_26)                                     AS gap_26s,
  round((a.comb25_time - r.ref_25) - (a.comb26_time - r.ref_26))     AS net_change_s
FROM athletes a, ref r
WHERE a.gender = 'Boys'
  AND a.comb25_time IS NOT NULL
  AND a.comb26_time IS NOT NULL
ORDER BY net_change_s DESC
LIMIT 20`)));
```
