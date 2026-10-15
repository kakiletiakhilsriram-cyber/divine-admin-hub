import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export const authButtonClass =
  "w-full min-h-11 bg-[#792323] text-white hover:bg-[#5c1919]";
export function AdminAuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[100dvh] bg-background px-4 py-6 sm:px-6">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Return to temple website
      </Link>
      <div className="mx-auto my-8 w-full max-w-md sm:my-12">
        <header className="mb-6 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full temple-gradient text-3xl"
          >
            🕉
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Sri Ramalayam · Administration
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </header>
        <div className="rounded-2xl border bg-card p-5 shadow-lg sm:p-8">
          {children}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          For authorised temple administrators. Visitors can browse without an
          account.
        </p>
      </div>
    </main>
  );
}
