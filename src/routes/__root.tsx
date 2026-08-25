import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AskoeProvider } from "@/lib/askoe/store";
import { MONTHS, YEAR } from "@/lib/askoe/types";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "АСКОЕ — облік електроенергії та підбір КГУ" },
      {
        name: "description",
        content:
          "Внутрішній інструмент погодинного обліку споживання електроенергії та розрахунку режимів роботи когенераційних установок.",
      },
      { name: "author", content: "АСКОЕ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const linkClass =
  "block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
const activeClass = "bg-primary/10 font-medium text-primary hover:bg-primary/10";

function Nav() {
  return (
    <nav className="space-y-1 p-3">
      <Link to="/" className={linkClass} activeProps={{ className: `${linkClass} ${activeClass}` }}>
        Аналітика
      </Link>
      <p className="px-3 pb-1 pt-4 text-xs uppercase tracking-wide text-muted-foreground">
        Місяці {YEAR}
      </p>
      {MONTHS.map((m, i) => (
        <Link
          key={m}
          to="/month/$month"
          params={{ month: String(i + 1) }}
          className={linkClass}
          activeProps={{ className: `${linkClass} ${activeClass}` }}
        >
          {m}
        </Link>
      ))}
      <p className="px-3 pb-1 pt-4 text-xs uppercase tracking-wide text-muted-foreground">Сервіс</p>
      <Link
        to="/catalog"
        className={linkClass}
        activeProps={{ className: `${linkClass} ${activeClass}` }}
      >
        Довідник КГУ
      </Link>
      <Link
        to="/settings"
        className={linkClass}
        activeProps={{ className: `${linkClass} ${activeClass}` }}
      >
        Налаштування
      </Link>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AskoeProvider>
        <div className="flex min-h-screen bg-background">
          <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-r bg-card lg:block">
            <div className="border-b p-4">
              <p className="text-sm font-semibold leading-tight">АСКОЕ</p>
              <p className="text-xs text-muted-foreground">Аналітика споживання та КГУ</p>
            </div>
            <Nav />
          </aside>
          <div className="min-w-0 flex-1">
            <div className="border-b bg-card p-3 lg:hidden">
              <details>
                <summary className="cursor-pointer text-sm font-medium">Меню — АСКОЕ</summary>
                <Nav />
              </details>
            </div>
            <main className="min-w-0 p-4 lg:p-6">
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster />
      </AskoeProvider>
    </QueryClientProvider>
  );
}
