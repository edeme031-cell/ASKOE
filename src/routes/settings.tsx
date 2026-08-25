import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigPanel } from "@/components/askoe/ConfigPanel";
import { useAskoe } from "@/lib/askoe/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Налаштування розрахунку — АСКОЕ" },
      {
        name: "description",
        content:
          "Конфігурація когенераційних установок, допустимі діапазони роботи та контрактний ліміт потужності.",
      },
      { property: "og:title", content: "Налаштування розрахунку — АСКОЕ" },
      {
        property: "og:description",
        content: "Параметри КГУ та межі режимів, що впливають на всі місячні розрахунки.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { resetAll } = useAskoe();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Налаштування</h1>
        <p className="text-sm text-muted-foreground">
          Усі зміни застосовуються миттєво до всіх місяців і зведеної аналітики.
        </p>
      </div>
      <ConfigPanel />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Дані</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Дані зберігаються локально у браузері цього комп'ютера й не губляться при перезавантаженні
            сторінки.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Очистити всі дані та налаштування?")) {
                resetAll();
                toast.success("Дані очищено");
              }
            }}
          >
            Скинути всі дані
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
