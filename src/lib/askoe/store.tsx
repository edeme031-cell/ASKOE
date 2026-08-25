import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultState, emptyMonth } from "./defaults";
import type { AppState, Config, Machine } from "./types";
import { totalPower } from "./calc";

const KEY = "askoe-state-v1";

type Ctx = {
  state: AppState;
  ready: boolean;
  power: number;
  setConfig: (patch: Partial<Config>) => void;
  setCatalog: (catalog: Machine[]) => void;
  setCell: (month: number, hour: number, day: number, value: number | null) => void;
  setMonthData: (month: number, data: (number | null)[][]) => void;
  clearMonth: (month: number) => void;
  resetAll: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<AppState>;
  return {
    catalog: Array.isArray(s.catalog) && s.catalog.length ? s.catalog : base.catalog,
    config: { ...base.config, ...(s.config ?? {}) },
    data:
      Array.isArray(s.data) && s.data.length === 12
        ? base.data.map((m, i) => {
            const src = s.data![i];
            if (!Array.isArray(src)) return m;
            return m.map((row, h) =>
              row.map((_, d) => {
                const v = src[h]?.[d];
                return typeof v === "number" && Number.isFinite(v) ? v : null;
              }),
            );
          })
        : base.data,
  };
}

export function AskoeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => defaultState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(migrate(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const value = useMemo<Ctx>(() => {
    return {
      state,
      ready,
      power: totalPower(state.config, state.catalog),
      setConfig: (patch) => setState((s) => ({ ...s, config: { ...s.config, ...patch } })),
      setCatalog: (catalog) => setState((s) => ({ ...s, catalog })),
      setCell: (month, hour, day, val) =>
        setState((s) => {
          const data = s.data.map((m, mi) =>
            mi !== month
              ? m
              : m.map((row, hi) => (hi !== hour ? row : row.map((c, di) => (di === day ? val : c)))),
          );
          return { ...s, data };
        }),
      setMonthData: (month, md) =>
        setState((s) => ({ ...s, data: s.data.map((m, i) => (i === month ? md : m)) })),
      clearMonth: (month) =>
        setState((s) => ({
          ...s,
          data: s.data.map((m, i) => (i === month ? emptyMonth(month) : m)),
        })),
      resetAll: () => setState(defaultState()),
    };
  }, [state, ready]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAskoe() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAskoe must be used within AskoeProvider");
  return ctx;
}
