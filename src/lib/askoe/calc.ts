import type { Config, Machine, YearData } from "./types";
import { daysInMonth } from "./types";

export type LoadZone = "peak" | "normal" | "min";
export type NormalStatus = "over" | "norm" | "tol" | "under";
export type IslandStatus = "over" | "norm" | "under";

export type HourRow = {
  hour: number;
  avg: number | null;
  max: number | null;
  min: number | null;
  limit: number;
  excessPct: number | null;
  zone: LoadZone | null;
  loadPct: number | null;
  status: NormalStatus | null;
  islandStatus: IslandStatus | null;
  count: number;
};

export function totalPower(config: Config, catalog: Machine[]) {
  return config.machines.reduce((sum, id) => {
    const m = catalog.find((c) => c.id === id);
    return sum + (m?.kw ?? 0);
  }, 0);
}

export function percentile(sortedValues: number[], p: number): number | null {
  if (sortedValues.length === 0) return null;
  const idx = (sortedValues.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const a = sortedValues[lo] ?? 0;
  const b = sortedValues[hi] ?? a;
  if (lo === hi) return a;
  return a + (b - a) * (idx - lo);
}

function classifyNormal(loadPct: number, c: Config): NormalStatus {
  if (loadPct > c.maxNormal) return "over";
  if (loadPct >= c.minNormal) return "norm";
  if (loadPct >= c.tolFrom) return "tol";
  return "under";
}

function classifyIsland(loadPct: number, c: Config): IslandStatus {
  if (loadPct > c.islandMax) return "over";
  if (loadPct >= c.islandMin) return "norm";
  return "under";
}

export function computeMonth(
  monthData: (number | null)[][],
  config: Config,
  power: number,
): HourRow[] {
  const base = Array.from({ length: 24 }, (_, hour) => {
    const values = (monthData[hour] ?? []).filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );
    const count = values.length;
    const avg = count ? values.reduce((a, b) => a + b, 0) / count : null;
    const max = count ? Math.max(...values) : null;
    const min = count ? Math.min(...values) : null;
    return { hour, avg, max, min, count };
  });

  const avgs = base
    .map((r) => r.avg)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const p75 = percentile(avgs, 0.75);
  const p25 = percentile(avgs, 0.25);

  return base.map((r) => {
    const excessPct =
      r.avg !== null && config.limit > 0 && r.avg > config.limit
        ? ((r.avg - config.limit) / config.limit) * 100
        : r.avg !== null && config.limit > 0
          ? 0
          : null;
    const zone: LoadZone | null =
      r.avg === null || p75 === null || p25 === null
        ? null
        : r.avg >= p75
          ? "peak"
          : r.avg <= p25
            ? "min"
            : "normal";
    const loadPct = r.avg !== null && power > 0 ? (r.avg / power) * 100 : null;
    return {
      ...r,
      limit: config.limit,
      excessPct,
      zone,
      loadPct,
      status: loadPct === null ? null : classifyNormal(loadPct, config),
      islandStatus: loadPct === null ? null : classifyIsland(loadPct, config),
    };
  });
}

export type MonthSummary = {
  month: number;
  total: number;
  maxInterval: number | null;
  minInterval: number | null;
  avg: number | null;
  avgDaily: number | null;
  maxHour: number | null;
  minHour: number | null;
  hasData: boolean;
};

export function computeMonthSummary(
  monthIndex: number,
  monthData: (number | null)[][],
): MonthSummary {
  const flat: number[] = [];
  for (const row of monthData) {
    for (const v of row) if (typeof v === "number" && Number.isFinite(v)) flat.push(v);
  }
  const total = flat.reduce((a, b) => a + b, 0);
  const hasData = flat.length > 0;
  const hourAvgs = Array.from({ length: 24 }, (_, h) => {
    const vals = (monthData[h] ?? []).filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });
  const known = hourAvgs
    .map((v, h) => ({ v, h }))
    .filter((x): x is { v: number; h: number } => x.v !== null);
  const maxHour = known.length
    ? known.reduce((a, b) => (b.v > a.v ? b : a)).h
    : null;
  const minHour = known.length
    ? known.reduce((a, b) => (b.v < a.v ? b : a)).h
    : null;

  const daysWithData = new Set<number>();
  for (let h = 0; h < 24; h++) {
    (monthData[h] ?? []).forEach((v, d) => {
      if (typeof v === "number" && Number.isFinite(v)) daysWithData.add(d);
    });
  }

  return {
    month: monthIndex,
    total,
    maxInterval: hasData ? Math.max(...flat) : null,
    minInterval: hasData ? Math.min(...flat) : null,
    avg: hasData ? total / flat.length : null,
    avgDaily: daysWithData.size ? total / daysWithData.size : null,
    maxHour,
    minHour,
    hasData,
  };
}

export type MonthKguStats = {
  month: number;
  norm: number;
  tol: number;
  fail: number;
  islandNorm: number;
  islandOut: number;
  normPct: number | null;
  islandPct: number | null;
};

export function computeKguStats(rows: HourRow[], month: number): MonthKguStats {
  let norm = 0,
    tol = 0,
    fail = 0,
    islandNorm = 0,
    islandOut = 0,
    known = 0;
  for (const r of rows) {
    if (r.status === null) continue;
    known++;
    if (r.status === "norm") norm++;
    else if (r.status === "tol") tol++;
    else fail++;
    if (r.islandStatus === "norm") islandNorm++;
    else islandOut++;
  }
  return {
    month,
    norm,
    tol,
    fail,
    islandNorm,
    islandOut,
    normPct: known ? (norm / known) * 100 : null,
    islandPct: known ? (islandNorm / known) * 100 : null,
  };
}

export function computeYear(data: YearData, config: Config, power: number) {
  const summaries = data.map((md, i) => computeMonthSummary(i, md));
  const kgu = data.map((md, i) => computeKguStats(computeMonth(md, config, power), i));
  return { summaries, kgu };
}

export function monthDayCount(monthIndex: number) {
  return daysInMonth(monthIndex);
}

export function fmt(n: number | null | undefined, digits = 0) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("uk-UA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
