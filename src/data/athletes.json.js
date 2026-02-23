import { readFileSync } from "fs";

function parseTime(s) {
  if (!s) return null;
  s = s.trim();
  if (s === "DNS" || s === "-" || s === "") return null;
  const m = s.match(/^(\d+):(\d+\.?\d*)$/);
  if (!m) return null;
  return +m[1] * 60 + +m[2];
}

function clean(s) {
  return (s || "").replace(/\s*\([^)]*\)/g, "").trim();
}

function athleteKey(first, last) {
  return `${clean(first).toLowerCase()}|${clean(last).toLowerCase()}`;
}

function parseRaceFile(path) {
  const content = readFileSync(path, "utf8");
  const seen = new Set();
  const rows = [];
  for (const line of content.split("\n")) {
    const f = line.split("\t");
    if (f.length < 10) continue;
    const bib = parseInt(f[1]);
    if (isNaN(bib)) continue;
    // Deduplicate by bib — files repeat each athlete in Overall + per-category sections
    if (seen.has(bib)) continue;
    seen.add(bib);
    const category = (f[7] || "").trim();
    if (/short course/i.test(category)) continue;
    if (!/high school|no score/i.test(category)) continue;
    const gender = (f[8] || "").trim();
    if (gender !== "Male" && gender !== "Female") continue;
    const first = clean(f[3]);
    const last = clean(f[4]);
    if (!first || !last) continue;
    rows.push({
      first,
      last,
      key: athleteKey(first, last),
      gender,
      category,
      time: parseTime(f[9])
    });
  }
  return rows;
}

function buildRankMap(rows) {
  const sorted = rows.filter(r => r.time != null).sort((a, b) => a.time - b.time);
  const map = new Map();
  sorted.forEach((r, i) => map.set(r.key, i + 1));
  return map;
}

function buildLookup(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.key)) map.set(r.key, r);
  }
  return map;
}

function buildCombinedRanks(fsMap, clMap, keys) {
  const combined = [];
  for (const k of keys) {
    const fs = fsMap.get(k);
    const cl = clMap.get(k);
    if (fs?.time != null && cl?.time != null) {
      combined.push({ key: k, time: fs.time + cl.time });
    }
  }
  combined.sort((a, b) => a.time - b.time);
  const map = new Map();
  combined.forEach((r, i) => map.set(r.key, { rank: i + 1, time: r.time }));
  return map;
}

const fs25 = parseRaceFile("data/2025 State Championship 5k Freestyle.txt");
const cl25 = parseRaceFile("data/2025 State Championship 4k Classic.txt");
const fs26 = parseRaceFile("data/2026 STATE FRIDAY 5K FS.txt");
const cl26 = parseRaceFile("data/2026 STATE SATURDAY 4K CLASSIC.txt");

function buildGender(gender) {
  const fs25g = fs25.filter(r => r.gender === gender);
  const cl25g = cl25.filter(r => r.gender === gender);
  const fs26g = fs26.filter(r => r.gender === gender);
  const cl26g = cl26.filter(r => r.gender === gender);

  const fs25ranks = buildRankMap(fs25g);
  const cl25ranks = buildRankMap(cl25g);
  const fs26ranks = buildRankMap(fs26g);
  const cl26ranks = buildRankMap(cl26g);

  const fs25map = buildLookup(fs25g);
  const cl25map = buildLookup(cl25g);
  const fs26map = buildLookup(fs26g);
  const cl26map = buildLookup(cl26g);

  const keys25 = new Set([...fs25g.map(r => r.key), ...cl25g.map(r => r.key)]);
  const keys26 = new Set([...fs26g.map(r => r.key), ...cl26g.map(r => r.key)]);

  const comb25ranks = buildCombinedRanks(fs25map, cl25map, keys25);
  const comb26ranks = buildCombinedRanks(fs26map, cl26map, keys26);

  const bothKeys = [...keys25].filter(k => keys26.has(k));

  const result = [];
  for (const k of bothKeys) {
    const ref = fs25map.get(k) || cl25map.get(k) || fs26map.get(k) || cl26map.get(k);
    const comb25 = comb25ranks.get(k) ?? null;
    const comb26 = comb26ranks.get(k) ?? null;

    result.push({
      name: `${ref.first} ${ref.last}`,
      first: ref.first,
      last: ref.last,
      fs25_time: fs25map.get(k)?.time ?? null,
      fs25_rank: fs25ranks.get(k) ?? null,
      cl25_time: cl25map.get(k)?.time ?? null,
      cl25_rank: cl25ranks.get(k) ?? null,
      comb25_time: comb25?.time ?? null,
      comb25_rank: comb25?.rank ?? null,
      fs26_time: fs26map.get(k)?.time ?? null,
      fs26_rank: fs26ranks.get(k) ?? null,
      cl26_time: cl26map.get(k)?.time ?? null,
      cl26_rank: cl26ranks.get(k) ?? null,
      comb26_time: comb26?.time ?? null,
      comb26_rank: comb26?.rank ?? null
    });
  }

  return result.sort((a, b) => (a.comb26_rank ?? 9999) - (b.comb26_rank ?? 9999));
}

const output = {
  boys: buildGender("Male"),
  girls: buildGender("Female")
};

process.stdout.write(JSON.stringify(output));
