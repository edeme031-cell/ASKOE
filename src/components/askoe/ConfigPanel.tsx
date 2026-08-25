import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAskoe } from "@/lib/askoe/store";
import { fmt } from "@/lib/askoe/calc";
import type { Config } from "@/lib/askoe/types";

const NONE = "__none__";

function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="pr-9"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ConfigPanel() {
  const { state, setConfig, power } = useAskoe();
  const { config, catalog } = state;

  const setMachine = (idx: number, id: string | null) => {
    const machines = config.machines.slice();
    machines[idx] = id;
    setConfig({ machines });
  };

  const patch = (k: keyof Config) => (n: number) => setConfig({ [k]: n } as Partial<Config>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Конфігурація КГУ (діє на всі місяці)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => {
            const id = config.machines[i] ?? null;
            const machine = catalog.find((m) => m.id === id);
            return (
              <div key={i} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Машина {i + 1}</Label>
                <Select
                  value={id ?? NONE}
                  onValueChange={(v) => setMachine(i, v === NONE ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="не використовується" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value={NONE}>не використовується</SelectItem>
                    {catalog.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {m.kw} кВт
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Потужність: {machine ? `${fmt(machine.kw)} кВт` : "—"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Сума потужностей (1–5)</p>
            <p className="text-xl font-semibold">{fmt(power)} кВт</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Режим аналізу потужності</Label>
            <Select
              value={config.powerMode}
              onValueChange={(v) => setConfig({ powerMode: v as Config["powerMode"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Разом (сума 1–5)</SelectItem>
                <SelectItem value="separate">Окремо по машинах</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Потужність для розрахунку</p>
            <p className="text-xl font-semibold text-primary">{fmt(power)} кВт</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <NumField
            label="Звичайний — мін. норма"
            value={config.minNormal}
            onChange={patch("minNormal")}
            suffix="%"
          />
          <NumField
            label="Звичайний — допуск від"
            value={config.tolFrom}
            onChange={patch("tolFrom")}
            suffix="%"
          />
          <NumField
            label="Звичайний — максимум"
            value={config.maxNormal}
            onChange={patch("maxNormal")}
            suffix="%"
          />
          <NumField
            label="Острів — мінімум"
            value={config.islandMin}
            onChange={patch("islandMin")}
            suffix="%"
          />
          <NumField
            label="Острів — максимум"
            value={config.islandMax}
            onChange={patch("islandMax")}
            suffix="%"
          />
          <NumField
            label="Контрактний ліміт"
            value={config.limit}
            onChange={patch("limit")}
            suffix="кВт·г"
          />
        </div>
      </CardContent>
    </Card>
  );
}
