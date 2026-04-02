"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getToken } from "@/app/lib/getToken";
import { Copy, Check } from "lucide-react";
import { signOut } from "next-auth/react";


// ✅ CopyButton is OUTSIDE DashboardPage
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white/80"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [createdRoomId, setCreatedRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status]);

  useEffect(() => {
    const init = async () => {
      const token = getToken(session);
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = await res.json();
      setCurrentRole(user.role);
      setRoleLoading(false);
    };

    init();
  }, [session]);

const handleCreateRoom = async () => {
    try {
      setLoading(true);
      const token = getToken(session);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/room/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setCreatedRoomId(data.roomId);

      // ✅ auto copy with error handling
      try {
        await navigator.clipboard.writeText(data.roomId);
        console.log("✅ Room ID copied to clipboard:", data.roomId);
      } catch (clipErr) {
        console.error("❌ Clipboard copy failed:", clipErr);
      }

    } catch (err) {
      console.error("Error creating room:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCreatedRoom = () => {
    if (!createdRoomId) return;
    router.push(`/room/${createdRoomId}`);
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) return;
    router.push(`/room/${joinRoomId}`);
  };


  const handleLogout = () => {
    // Clear any locally stored JWT if you persist it
    localStorage.removeItem("token"); // adjust key to match yours
    signOut({ callbackUrl: "/login" });
  };

  if (roleLoading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-white/70">
          <span className="h-4 w-4 animate-spin rounded-full border border-white/30 border-t-white" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-5xl">
        
        <div className="mb-6 flex items-center justify-between">
  <div>
    <p className="mono text-xs uppercase tracking-[0.14em] text-white/55">Dashboard</p>
    <h1 className="mt-2 text-3xl font-medium text-white">Interview control center</h1>
  </div>
  <button
    onClick={() => signOut({ callbackUrl: "/auth" })}
    className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
  >
    Sign out
  </button>
</div>

        <div className="grid gap-5 md:grid-cols-2">
          {currentRole === "INTERVIEWER" && (
            <article className="panel p-6">
              <p className="mono text-xs uppercase tracking-[0.12em] text-white/50">Interviewer</p>
              <h2 className="mt-2 text-xl font-medium text-white">Create private room</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Generate a room and share the ID with one candidate.
              </p>

              <button
                onClick={handleCreateRoom}
                className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Room"}
              </button>

              {createdRoomId && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/45">Room ID</p>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/2 px-3 py-2">
                    <span className="flex-1 break-all text-sm text-white/80">{createdRoomId}</span>
                    <CopyButton text={createdRoomId} />
                  </div>
                  <button
                    onClick={handleEnterCreatedRoom}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/35"
                  >
                    Enter Room
                  </button>
                </div>
              )}
            </article>
          )}

          {currentRole === "CANDIDATE" && (
            <article className="panel p-6">
              <p className="mono text-xs uppercase tracking-[0.12em] text-white/50">Candidate</p>
              <h2 className="mt-2 text-xl font-medium text-white">Join interview room</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Paste the room ID shared by your interviewer.
              </p>

              <input
                type="text"
                placeholder="Enter Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="mt-5 w-full rounded-lg border border-white/15 bg-white/2 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
              />

              <button
                onClick={handleJoinRoom}
                className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                Join Room
              </button>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}