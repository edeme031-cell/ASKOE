import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAskoe } from "@/lib/askoe/store";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Довідник КГУ — АСКОЕ" },
      {
        name: "description",
        content: "Довідник когенераційних установок 2G Energy з електричною потужністю у кВт.",
      },
      { property: "og:title", content: "Довідник КГУ — АСКОЕ" },
      {
        property: "og:description",
        content: "Редагований довідник моделей когенераційних установок та їх потужності.",
      },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { state, setCatalog } = useAskoe();
  const [name, setName] = useState("");
  const [kw, setKw] = useState("");

  const add = () => {
    if (!name.trim() || !Number(kw)) return;
    setCatalog([
      ...state.catalog,
      { id: `c${Date.now()}`, name: name.trim(), kw: Math.round(Number(kw)) },
    ]);
    setName("");
    setKw("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Довідник КГУ (БАЗА_КГУ)</h1>
        <p className="text-sm text-muted-foreground">
          Моделі когенераційних установок та їх електрична потужність.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Додати модель</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Input
            placeholder="Назва моделі"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-xs"
          />
          <Input
            type="number"
            placeholder="Потужність, кВт"
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            className="max-w-[180px]"
          />
          <Button onClick={add}>Додати</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="w-14 p-2 text-left font-medium">№</th>
                <th className="p-2 text-left font-medium">Модель</th>
                <th className="w-48 p-2 text-left font-medium">Ел. потужність, кВт</th>
                <th className="w-16 p-2" />
              </tr>
            </thead>
            <tbody>
              {state.catalog.map((m, i) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-1">
                    <Input
                      value={m.name}
                      onChange={(e) =>
                        setCatalog(
                          state.catalog.map((c) =>
                            c.id === m.id ? { ...c, name: e.target.value } : c,
                          ),
                        )
                      }
                      className="h-8 border-transparent bg-transparent hover:border-input focus:border-input"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number"
                      value={m.kw}
                      onChange={(e) =>
                        setCatalog(
                          state.catalog.map((c) =>
                            c.id === m.id ? { ...c, kw: Number(e.target.value) } : c,
                          ),
                        )
                      }
                      className="h-8"
                    />
                  </td>
                  <td className="p-1 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCatalog(state.catalog.filter((c) => c.id !== m.id))}
                      aria-label="Видалити модель"
                    >
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
