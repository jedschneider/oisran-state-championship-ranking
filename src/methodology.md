---
title: Methodology & Data Sources
---

# Methodology & Data Sources

## Organization

Race results are published by the **Oregon Interscholastic Ski Racing Association Network (OISRAN)**, the governing body for high school Nordic ski racing in Oregon. More information at [oisran.org](https://oisran.org/).

## Data Source

Results for both championship years were retrieved from **Webscorer**, the timing platform used by OISRAN to publish official race results. The OISRAN organizer page is at [webscorer.com/oisran](https://www.webscorer.com/oisran).

The four result sets used:

| Year | Event | Distance |
|------|-------|----------|
| 2025 | State Championship Freestyle | 5 km |
| 2025 | State Championship Classic | 4 km |
| 2026 | State Championship Freestyle | 5 km |
| 2026 | State Championship Classic | 4 km |

## Athlete Categories

Each result set contains several competition categories. This analysis includes only:

- **High School Boys** — athletes competing for team points in the boys division
- **High School Girls** — athletes competing for team points in the girls division
- **No Score Boys / No Score Girls** — athletes who skied the full race course under the same conditions but whose results do not count toward team scoring, typically due to eligibility rules

**Short Course** athletes are excluded — they ski a shorter variant of the course and are not directly comparable.

## Athlete Matching Across Years

Athletes are matched between 2025 and 2026 results by first and last name. Parenthetical team codes that timing software occasionally appends to names (e.g. "Jane Smith (RVR)") are stripped before matching. Athletes who did not appear in both years' results are excluded from progression analysis.

## Combined Ranking

Each athlete skis two races over consecutive days. The combined result is the **sum of both race times**. Athletes are ranked within their gender by combined time, with the fastest combined time ranked first.

An athlete must have a recorded finish time in **both** the freestyle and classic races within a given year to receive a combined ranking for that year. A DNS (did not start) or missing result in either race excludes the athlete from the combined ranking for that year, though they may still appear in individual event views.

## Ranks

All ranks are computed from the **full field** for each event and year — including No Score athletes — not just the subset shown in any filtered view. This means an athlete's rank reflects their actual placement on race day.

## Gap to Reference Athlete

The gap metric measures the time difference (in seconds) between each athlete's finish time and a chosen reference athlete's finish time, within the same event and year.

**Net change** is the difference in that gap from 2025 to 2026:

```
net change = gap₂₀₂₅ − gap₂₀₂₆
```

A positive net change means the athlete closed ground on the reference — either by improving more, or declining less. A negative net change means the reference athlete gained ground. Because times are not comparable across years (different snow conditions, course set, and weather), gaps are always computed within a single year.

## Limitations

- Name changes or variations between years may cause an athlete to be treated as two separate people and excluded from multi-year analysis.
- No Score athletes may switch to or from High School scoring status between years; their times are included regardless of scoring status.
- Rankings reflect placement within the full field of athletes who started and finished each race; they do not account for differences in field size between years.
