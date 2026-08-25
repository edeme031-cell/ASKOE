import type { IslandStatus, LoadZone, NormalStatus } from "@/lib/askoe/calc";
import type { Config } from "@/lib/askoe/types";

export function normalLabel(s: NormalStatus, c: Config) {
  switch (s) {
    case "over":
      return `🔴 Аварія (>${c.maxNormal}%)`;
    case "norm":
      return "✅ Норма";
    case "tol":
      return "🟡 Допуск (≤2год)";
    default:
      return `🔴 Аварія (<${c.tolFrom}%)`;
  }
}

export function islandLabel(s: IslandStatus, c: Config) {
  switch (s) {
    case "over":
      return `🔴 Перевищення (>${c.islandMax}%)`;
    case "norm":
      return "✅ Норма (острів)";
    default:
      return `🔴 Низьке (<${c.islandMin}%)`;
  }
}

export function zoneLabel(z: LoadZone) {
  return z === "peak" ? "🔴 Пік" : z === "min" ? "🟢 Мінімум" : "🟡 Норма";
}

const base = "inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium";

export function StatusBadge({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-success/15 text-success"
      : tone === "warn"
        ? "bg-warning/25 text-warning-foreground"
        : tone === "bad"
          ? "bg-danger/15 text-danger"
          : "bg-muted text-muted-foreground";
  return <span className={`${base} ${cls}`}>{children}</span>;
}

export function normalTone(s: NormalStatus): "ok" | "warn" | "bad" {
  return s === "norm" ? "ok" : s === "tol" ? "warn" : "bad";
}

export function islandTone(s: IslandStatus): "ok" | "bad" {
  return s === "norm" ? "ok" : "bad";
}

export function zoneTone(z: LoadZone): "ok" | "warn" | "bad" {
  return z === "peak" ? "bad" : z === "min" ? "ok" : "warn";
}
