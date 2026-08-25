import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigPanel } from "@/components/askoe/ConfigPanel";
import {
  StatusBadge,
  islandLabel,
  islandTone,
  normalLabel,
  normalTone,
  zoneLabel,
  zoneTone,
} from "@/components/askoe/status";
import { computeMonth, computeMonthSummary, fmt } from "@/lib/askoe/calc";
import { exportMonth, parseMonthFile } from "@/lib/askoe/excel";
import { useAskoe } from "@/lib/askoe/store";
import { MONTHS, YEAR, daysInMonth, hourLabel } from "@/lib/askoe/types";

export const Route = createFileRoute("/month/$month")({
  beforeLoad: ({ params }) => {
    const n = Number(params.month);
    if (!Number.isInteger(n) || n < 1 || n > 12) throw notFound();
  },
  head: ({ params }) => {
    const name = MONTHS[Number(params.month) - 1] ?? "Місяць";
    return {
      meta: [
        { title: `${name} ${YEAR} — погодинне споживання | АСКОЕ` },
        {
          name: "description",
          content: `Погодинний облік споживання електроенергії за ${name.toLowerCase()} ${YEAR} та розрахунок завантаження КГУ.`,
        },
        { property: "og:title", content: `${name} ${YEAR} — погодинне споживання | АСКОЕ` },
        {
          property: "og:description",
          content: `Таблиця час × дата, середні/макс/мін значення та статуси роботи КГУ за ${name.toLowerCase()}.`,
        },
      ],
    };
  },
  component: MonthPage,
});

function MonthPage() {
  const { month } = Route.useParams();
  const mi = Number(month) - 1;
  const { state, power, setCell, setMonthData, clearMonth } = useAskoe();
  const fileRef = useRef<HTMLInputElement>(null);
  const days = daysInMonth(mi);
  const monthData = state.data[mi] ?? [];

  const rows = useMemo(
    () => computeMonth(monthData, state.config, power),
    [monthData, state.config, power],
  );
  const summary = useMemo(() => computeMonthSummary(mi, monthData), [mi, monthData]);

  const onImport = async (file: File) => {
    try {
      const parsed = await parseMonthFile(file, mi);
      setMonthData(mi, parsed);
      toast.success(`Дані за ${MONTHS[mi]} завантажено`);
    } catch (e) {
      toast.error(`Не вдалося прочитати файл: ${(e as Error).message}`);
    }
  };

  const onExport = () => {
    exportMonth(mi, monthData, [
      ["Година", "Середнє", "Макс", "Мін", "Ліміт", "Перевищення, %", "Зона", "% завантаження", "Статус (зв.)", "Статус (острів)"],
      ...rows.map((r) => [
        hourLabel(r.hour),
        r.avg ?? "",
        r.max ?? "",
        r.min ?? "",
        r.limit,
        r.excessPct === null ? "" : Number(r.excessPct.toFixed(1)),
        r.zone ? zoneLabel(r.zone) : "",
        r.loadPct === null ? "" : Number(r.loadPct.toFixed(1)),
        r.status ? normalLabel(r.status, state.config) : "",
        r.islandStatus ? islandLabel(r.islandStatus, state.config) : "",
      ]),
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {MONTHS[mi]} {YEAR}
          </h1>
          <p className="text-sm text-muted-foreground">
            Погодинне споживання, кВт·г — {days} днів · Загалом {fmt(summary.total)} кВт·г
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Завантажити дані
          </Button>
          <Button variant="outline" onClick={onExport}>
            Експорт у Excel
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Очистити дані за ${MONTHS[mi]}?`)) clearMonth(mi);
            }}
          >
            Очистити місяць
          </Button>
        </div>
      </div>

      <ConfigPanel />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Таблиця «Час × Дата» (кВт·г)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-auto">
            <table className="border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-30 w-28 border-b border-r bg-muted p-2 text-left font-medium">
                    Час
                  </th>
                  {Array.from({ length: days }, (_, d) => (
                    <th
                      key={d}
                      className="sticky top-0 z-20 min-w-[62px] border-b bg-muted p-2 text-center font-medium"
                    >
                      {d + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 24 }, (_, h) => (
                  <tr key={h}>
                    <th className="sticky left-0 z-10 whitespace-nowrap border-b border-r bg-card p-2 text-left font-normal text-muted-foreground">
                      {hourLabel(h)}
                    </th>
                    {Array.from({ length: days }, (_, d) => {
                      const v = monthData[h]?.[d] ?? null;
                      return (
                        <td key={d} className="border-b p-0">
                          <input
                            inputMode="numeric"
                            value={v ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              const num = Number(raw.replace(",", "."));
                              setCell(
                                mi,
                                h,
                                d,
                                raw === "" || !Number.isFinite(num) ? null : Math.round(num),
                              );
                            }}
                            className="h-8 w-full min-w-[62px] bg-transparent px-1 text-center outline-none focus:bg-primary/10"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Погодинний розрахунок</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {[
                    "Година",
                    "Середнє, кВт·г",
                    "Макс, кВт·г",
                    "Мін, кВт·г",
                    "Ліміт, кВт·г",
                    "Перевищення, %",
                    "Зона навантаження",
                    "% завантаження",
                    "Статус (звичайний)",
                    "Статус (острів)",
                  ].map((t) => (
                    <th key={t} className="whitespace-nowrap p-2 text-left font-medium">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.hour} className="border-t">
                    <td className="whitespace-nowrap p-2 text-muted-foreground">
                      {hourLabel(r.hour)}
                    </td>
                    <td className="p-2">{fmt(r.avg, 1)}</td>
                    <td className="p-2">{fmt(r.max)}</td>
                    <td className="p-2">{fmt(r.min)}</td>
                    <td className="p-2">{fmt(r.limit)}</td>
                    <td className="p-2">{r.excessPct === null ? "—" : `${fmt(r.excessPct, 1)}%`}</td>
                    <td className="p-2">
                      {r.zone ? (
                        <StatusBadge tone={zoneTone(r.zone)}>{zoneLabel(r.zone)}</StatusBadge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 font-medium">
                      {r.loadPct === null ? "—" : `${fmt(r.loadPct, 1)}%`}
                    </td>
                    <td className="p-2">
                      {r.status ? (
                        <StatusBadge tone={normalTone(r.status)}>
                          {normalLabel(r.status, state.config)}
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="muted">немає даних</StatusBadge>
                      )}
                    </td>
                    <td className="p-2">
                      {r.islandStatus ? (
                        <StatusBadge tone={islandTone(r.islandStatus)}>
                          {islandLabel(r.islandStatus, state.config)}
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="muted">немає даних</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
