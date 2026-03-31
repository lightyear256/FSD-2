"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";


export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [createdRoomId, setCreatedRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Create Room
  const handleCreateRoom = async () => {
    try {
      setLoading(true);
      const token = session?.backendToken
      console.log(token);
      const res = await fetch("http://localhost:5000/room/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });

      const data = await res.json();

      setCreatedRoomId(data.roomId);

      navigator.clipboard.writeText(data.roomId);
    } catch (err) {
      console.error("Error creating room:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Enter Created Room
  const handleEnterCreatedRoom = () => {
    if (!createdRoomId) return;
    router.push(`/room/${createdRoomId}`);
  };

  // 🔹 Join Existing Room
  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) return;
    router.push(`/room/${joinRoomId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">

        {/* 🔹 CREATE ROOM */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-green-400">
            Create Room (Interviewer)
          </h2>

          <button
            onClick={handleCreateRoom}
            className="px-4 py-2 bg-green-600 rounded-lg"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Room"}
          </button>

          {createdRoomId && (
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-sm text-gray-400">Room ID:</p>

              <div className="bg-gray-800 px-3 py-2 rounded break-all">
                {createdRoomId}
              </div>

              <button
                onClick={handleEnterCreatedRoom}
                className="px-4 py-2 bg-blue-600 rounded-lg"
              >
                Enter Room
              </button>
            </div>
          )}
        </div>

        {/* 🔹 JOIN ROOM */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-blue-400">
            Join Room (Candidate)
          </h2>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 border border-gray-700"
          />

          <button
            onClick={handleJoinRoom}
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            Join Room
          </button>
        </div>

      </div>
    </div>
  );
}