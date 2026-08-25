import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigPanel } from "@/components/askoe/ConfigPanel";
import { computeMonth, computeKguStats, computeYear, fmt } from "@/lib/askoe/calc";
import { exportRows } from "@/lib/askoe/excel";
import { useAskoe } from "@/lib/askoe/store";
import { MONTHS, YEAR, hourLabel } from "@/lib/askoe/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Аналітика споживання електроенергії та КГУ — АСКОЕ" },
      {
        name: "description",
        content:
          "Зведена річна та помісячна аналітика погодинного споживання електроенергії з розрахунком режимів роботи когенераційних установок.",
      },
      { property: "og:title", content: "Аналітика споживання електроенергії та КГУ — АСКОЕ" },
      {
        property: "og:description",
        content:
          "Річні підсумки споживання, завантаження КГУ, години в нормі, допуску та аварії за звичайним і острівним режимами.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AnalyticsPage() {
  const { state, power } = useAskoe();
  const [month, setMonth] = useState(0);

  const { summaries, kgu } = useMemo(
    () => computeYear(state.data, state.config, power),
    [state.data, state.config, power],
  );

  const monthRows = useMemo(
    () => computeMonth(state.data[month] ?? [], state.config, power),
    [state.data, month, state.config, power],
  );
  const monthKgu = useMemo(() => computeKguStats(monthRows, month), [monthRows, month]);
  const sel = summaries[month];

  const yearTotals = useMemo(() => {
    const totals = kgu.reduce(
      (a, k) => ({
        norm: a.norm + k.norm,
        tol: a.tol + k.tol,
        fail: a.fail + k.fail,
        islandNorm: a.islandNorm + k.islandNorm,
        islandOut: a.islandOut + k.islandOut,
      }),
      { norm: 0, tol: 0, fail: 0, islandNorm: 0, islandOut: 0 },
    );
    const known = totals.norm + totals.tol + totals.fail;
    return {
      ...totals,
      normPct: known ? (totals.norm / known) * 100 : null,
      islandPct: known ? (totals.islandNorm / known) * 100 : null,
    };
  }, [kgu]);

  const yearTotal = summaries.reduce((a, s) => a + s.total, 0);
  const maxIntervals = summaries.map((s) => s.maxInterval).filter((v): v is number => v !== null);
  const minIntervals = summaries.map((s) => s.minInterval).filter((v): v is number => v !== null);
  const avgs = summaries.map((s) => s.avg).filter((v): v is number => v !== null);
  const avgDaily = summaries.map((s) => s.avgDaily).filter((v): v is number => v !== null);

  const exportYear = () => {
    exportRows(
      [
        [
          "Місяць",
          "Загальне кВт·г",
          "Макс інтервал кВт·г",
          "Мін інтервал кВт·г",
          "Середнє кВт·г",
          "Середньодобове кВт·г",
          "Година максимуму",
          "Година мінімуму",
          "Норма (зв., год)",
          "Допуск (зв., год)",
          "Аварія (зв., год)",
          "Норма (остр., год)",
          "Поза межами (остр., год)",
        ],
        ...summaries.map((s, i) => {
          const k = kgu[i];
          return [
            MONTHS[i] ?? "",
            Math.round(s.total),
            s.maxInterval ?? "",
            s.minInterval ?? "",
            s.avg === null ? "" : Number(s.avg.toFixed(1)),
            s.avgDaily === null ? "" : Number(s.avgDaily.toFixed(1)),
            s.maxHour === null ? "" : hourLabel(s.maxHour),
            s.minHour === null ? "" : hourLabel(s.minHour),
            k?.norm ?? 0,
            k?.tol ?? 0,
            k?.fail ?? 0,
            k?.islandNorm ?? 0,
            k?.islandOut ?? 0,
          ];
        }),
      ],
      `ASKOE_Річна_зведена_${YEAR}.xlsx`,
      "Річна зведена",
    );
  };

  const consumptionChart = summaries.map((s, i) => ({
    name: (MONTHS[i] ?? "").slice(0, 3),
    total: Math.round(s.total),
  }));
  const profileChart = monthRows.map((r) => ({
    name: `${String(r.hour).padStart(2, "0")}:00`,
    Середнє: r.avg === null ? null : Math.round(r.avg),
    Макс: r.max,
    Мін: r.min,
  }));

  const pie = (n: number, t: number, f: number) => [
    { name: "Норма", value: n, fill: "var(--success)" },
    { name: "Допуск", value: t, fill: "var(--warning)" },
    { name: "Аварія", value: f, fill: "var(--danger)" },
  ];
  const islandPie = (n: number, o: number) => [
    { name: "Норма (острів)", value: n, fill: "var(--success)" },
    { name: "Поза межами", value: o, fill: "var(--danger)" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Аналітика споживання та роботи КГУ</h1>
          <p className="text-sm text-muted-foreground">
            Рік {YEAR} · Потужність для розрахунку: {fmt(power)} кВт
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportYear}>
            Експорт річної таблиці
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Годин у нормі (рік, зв.)"
          value={String(yearTotals.norm)}
          hint="орієнтир: 24 години на добу"
        />
        <Stat label="Годин у допуску (рік, зв.)" value={String(yearTotals.tol)} hint="орієнтир: 24 години на добу" />
        <Stat label="Годин аварійних (рік, зв.)" value={String(yearTotals.fail)} hint="орієнтир: 24 години на добу" />
        <Stat
          label="Годин у нормі (рік, острів)"
          value={String(yearTotals.islandNorm)}
          hint="орієнтир: 24 години на добу"
        />
      </div>

      <ConfigPanel />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Річна зведена таблиця</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {[
                    "Місяць",
                    "Загальне кВт·г",
                    "Макс інтервал кВт·г",
                    "Мін інтервал кВт·г",
                    "Середнє кВт·г",
                    "Середньодобове кВт·г",
                    "Година максимуму",
                    "Година мінімуму",
                  ].map((t) => (
                    <th key={t} className="whitespace-nowrap p-2 text-left font-medium">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaries.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{MONTHS[i]}</td>
                    <td className="p-2">{fmt(s.total)}</td>
                    <td className="p-2">{fmt(s.maxInterval)}</td>
                    <td className="p-2">{fmt(s.minInterval)}</td>
                    <td className="p-2">{fmt(s.avg, 1)}</td>
                    <td className="p-2">{fmt(s.avgDaily, 1)}</td>
                    <td className="p-2">{s.maxHour === null ? "—" : hourLabel(s.maxHour)}</td>
                    <td className="p-2">{s.minHour === null ? "—" : hourLabel(s.minHour)}</td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/40 font-medium">
                  <td className="p-2">РАЗОМ / СЕРЕДНЄ</td>
                  <td className="p-2">{fmt(yearTotal)}</td>
                  <td className="p-2">{maxIntervals.length ? fmt(Math.max(...maxIntervals)) : "—"}</td>
                  <td className="p-2">{minIntervals.length ? fmt(Math.min(...minIntervals)) : "—"}</td>
                  <td className="p-2">
                    {avgs.length ? fmt(avgs.reduce((a, b) => a + b, 0) / avgs.length, 1) : "—"}
                  </td>
                  <td className="p-2">
                    {avgDaily.length
                      ? fmt(avgDaily.reduce((a, b) => a + b, 0) / avgDaily.length, 1)
                      : "—"}
                  </td>
                  <td className="p-2">—</td>
                  <td className="p-2">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Деталі: {MONTHS[month]}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Загальне споживання" value={`${fmt(sel?.total ?? 0)} кВт·г`} />
          <Stat label="Максимум за годину" value={`${fmt(sel?.maxInterval ?? null)} кВт·г`} />
          <Stat label="Мінімум за годину" value={`${fmt(sel?.minInterval ?? null)} кВт·г`} />
          <Stat label="Середнє погодинне" value={`${fmt(sel?.avg ?? null, 1)} кВт·г`} />
          <Stat
            label="Година пікового навантаження"
            value={sel?.maxHour === null || sel === undefined ? "—" : hourLabel(sel.maxHour!)}
          />
          <Stat
            label="Година мінімального навантаження"
            value={sel?.minHour === null || sel === undefined ? "—" : hourLabel(sel.minHour!)}
          />
          <Stat label="Середньодобове споживання" value={`${fmt(sel?.avgDaily ?? null, 1)} кВт·г`} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Річне споживання по місяцях, кВт·г</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumptionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" name="кВт·г" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Погодинний профіль: {MONTHS[month]}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profileChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={11} interval={2} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Середнє" stroke="var(--primary)" dot={false} />
                <Line type="monotone" dataKey="Макс" stroke="var(--danger)" dot={false} />
                <Line type="monotone" dataKey="Мін" stroke="var(--success)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          { title: "Статуси за рік (звичайний)", data: pie(yearTotals.norm, yearTotals.tol, yearTotals.fail) },
          { title: `Статуси: ${MONTHS[month]} (звичайний)`, data: pie(monthKgu.norm, monthKgu.tol, monthKgu.fail) },
          { title: "Статуси за рік (острів)", data: islandPie(yearTotals.islandNorm, yearTotals.islandOut) },
          {
            title: `Статуси: ${MONTHS[month]} (острів)`,
            data: islandPie(monthKgu.islandNorm, monthKgu.islandOut),
          },
        ].map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={c.data} dataKey="value" nameKey="name" outerRadius={70} label>
                    {c.data.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend fontSize={11} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Річний аналіз роботи КГУ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {[
                    "Місяць",
                    "Норма (зв., год)",
                    "Допуск (зв., год)",
                    "Аварія (зв., год)",
                    "Норма (остр., год)",
                    "Поза межами (остр., год)",
                    "% часу в нормі (зв.)",
                    "% часу в нормі (остр.)",
                  ].map((t) => (
                    <th key={t} className="whitespace-nowrap p-2 text-left font-medium">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kgu.map((k, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{MONTHS[i]}</td>
                    <td className="p-2 text-success">{k.norm}</td>
                    <td className="p-2">{k.tol}</td>
                    <td className="p-2 text-danger">{k.fail}</td>
                    <td className="p-2 text-success">{k.islandNorm}</td>
                    <td className="p-2 text-danger">{k.islandOut}</td>
                    <td className="p-2">{k.normPct === null ? "—" : `${fmt(k.normPct, 1)}%`}</td>
                    <td className="p-2">{k.islandPct === null ? "—" : `${fmt(k.islandPct, 1)}%`}</td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/40 font-medium">
                  <td className="p-2">РІК (РАЗОМ)</td>
                  <td className="p-2">{yearTotals.norm}</td>
                  <td className="p-2">{yearTotals.tol}</td>
                  <td className="p-2">{yearTotals.fail}</td>
                  <td className="p-2">{yearTotals.islandNorm}</td>
                  <td className="p-2">{yearTotals.islandOut}</td>
                  <td className="p-2">
                    {yearTotals.normPct === null ? "—" : `${fmt(yearTotals.normPct, 1)}%`}
                  </td>
                  <td className="p-2">
                    {yearTotals.islandPct === null ? "—" : `${fmt(yearTotals.islandPct, 1)}%`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
