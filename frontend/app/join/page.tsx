"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function normalizeRoomInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.includes("/room/")) {
    const parts = trimmed.split("/room/");
    return parts[parts.length - 1].replaceAll("/", "").trim();
  }

  return trimmed;
}

export default function JoinPage() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState("");

  const roomId = normalizeRoomInput(roomInput);
  const canJoin = roomId.length > 0;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canJoin) return;
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
      <section className="panel w-full max-w-lg p-7 sm:p-8">
        <p className="mono text-xs uppercase tracking-[0.14em] text-white/55">Join room</p>
        <h1 className="mt-3 text-3xl font-medium text-white">Enter interview room</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Paste a room link or room ID to join instantly.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-3">
          <input
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="Paste room link or room ID"
            className="w-full rounded-lg border border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
          />

          <button
            type="submit"
            disabled={!canJoin}
            className="w-full rounded-lg bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Join Room
          </button>
        </form>

        <p className="mt-5 text-xs leading-6 text-white/45">You will appear as a guest until authenticated.</p>
      </section>
    </main>
  );
}
