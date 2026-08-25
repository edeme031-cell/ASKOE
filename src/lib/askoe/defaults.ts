import { daysInMonth, type AppState, type Machine } from "./types";

export const DEFAULT_CATALOG: Machine[] = [
  { id: "m1", name: "g-box 50 EG (MAN)", kw: 50 },
  { id: "m2", name: "agenitor 404 NG", kw: 100 },
  { id: "m3", name: "agenitor 404 EG ct80-1", kw: 160 },
  { id: "m4", name: "agenitor 404 NG ct80-B-1", kw: 180 },
  { id: "m5", name: "agenitor 406 EG", kw: 250 },
  { id: "m6", name: "agenitor 406 EG (275 kW)", kw: 275 },
  { id: "m7", name: "agenitor 408 EG", kw: 360 },
  { id: "m8", name: "agenitor 408 EG (400 kW)", kw: 400 },
  { id: "m9", name: "agenitor 412 EG", kw: 450 },
  { id: "m10", name: "agenitor 412 ct70B EG", kw: 500 },
  { id: "m11", name: "avus 500plus EG", kw: 550 },
  { id: "m12", name: "avus 500plus EG / NG", kw: 600 },
  { id: "m13", name: "2G avus 416plus", kw: 800 },
  { id: "m14", name: "2G avus 1000plus", kw: 1035 },
  { id: "m15", name: "2G avus 1200e EG (0,4 кВ)", kw: 1521 },
  { id: "m16", name: "2G avus 1200e EG (10,5 кВ)", kw: 1516 },
  { id: "m17", name: "Avus 1600e EG (0,4 кВ)", kw: 2028 },
  { id: "m18", name: "Avus 1600e EG (10,5 кВ)", kw: 2026 },
  { id: "m19", name: "Avus 2000e EG (0,4 кВ)", kw: 2538 },
  { id: "m20", name: "Avus 2000e EG (10,5 кВ)", kw: 2535 },
];

export function emptyMonth(monthIndex: number): (number | null)[][] {
  const days = daysInMonth(monthIndex);
  return Array.from({ length: 24 }, () => Array.from({ length: days }, () => null));
}

export function emptyYear(): (number | null)[][][] {
  return Array.from({ length: 12 }, (_, m) => emptyMonth(m));
}

export function defaultState(): AppState {
  return {
    catalog: DEFAULT_CATALOG,
    config: {
      machines: [null, null, null, null, null],
      powerMode: "sum",
      minNormal: 35,
      tolFrom: 35,
      maxNormal: 100,
      islandMin: 35,
      islandMax: 90,
      limit: 0,
    },
    data: emptyYear(),
  };
}
