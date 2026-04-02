"use client";

import { useRouter } from "next/navigation";

const features = [
  {
    title: "Focused 1:1 video",
    detail: "A calm room optimized for one interviewer and one candidate.",
  },
  {
    title: "Live interview chat",
    detail: "Share links, snippets, and quick notes without leaving the call.",
  },
  {
    title: "Join by link",
    detail: "Open a private room from a single URL, no setup friction.",
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-10 pt-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-white/90 text-black flex items-center justify-center text-xs font-semibold">
              PR
            </div>
            <p className="mono text-sm tracking-tight text-white/95">PeerRoom</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/auth")}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push("/role")}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
            >
              Get started
            </button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mono text-xs uppercase tracking-[0.16em] text-white/60">1:1 technical interview platform</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-6xl">
              Interview rooms designed for clarity, speed, and trust.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              PeerRoom brings video, chat, and role-based interview flow into one minimal workspace that feels calm under pressure.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push("/role")}
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
              >
                Start interview flow
              </button>
              <button
                onClick={() => router.push("/join")}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
              >
                Join with link
              </button>
            </div>
          </div>

          <div className="panel p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <p className="mono text-xs uppercase tracking-[0.14em] text-white/55">Room preview</p>
              <div className="flex items-center gap-2 text-xs text-white/55">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Connected
              </div>
            </div>

            <div className="space-y-4">
              {features.map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-medium text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/60">{item.detail}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-6 text-white/50">
              Rooms are intentionally limited to two participants for private, focused interviews.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
