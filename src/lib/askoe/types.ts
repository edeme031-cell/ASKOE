export type Machine = {
  id: string;
  name: string;
  kw: number;
};

export type Config = {
  machines: (string | null)[]; // 5 slots, catalog ids
  powerMode: "sum" | "separate";
  minNormal: number;
  tolFrom: number;
  maxNormal: number;
  islandMin: number;
  islandMax: number;
  limit: number; // контрактний ліміт, кВт·г
};

/** data[month][hour][day] = кВт·г або null */
export type YearData = (number | null)[][][];

export type AppState = {
  catalog: Machine[];
  config: Config;
  data: YearData;
};

export const MONTHS = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

export const YEAR = 2026;

export function daysInMonth(monthIndex: number, year = YEAR) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function hourLabel(h: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:00-${p(h + 1)}:00`;
}

export const MONTH_SLUGS = [
  "sichen",
  "lyutyi",
  "berezen",
  "kviten",
  "traven",
  "cherven",
  "lypen",
  "serpen",
  "veresen",
  "zhovten",
  "lystopad",
  "hruden",
];
