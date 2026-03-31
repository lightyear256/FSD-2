"use client";

import { useRouter } from "next/navigation";
import { useRole } from "@/app/context/RoleContext";

export default function RolePage() {
  const router = useRouter();
  const { setRole } = useRole();

  const handleSelectRole = (role: "INTERVIEWER" | "CANDIDATE") => {
    setRole(role);                              
    localStorage.setItem("selectedRole", role); 
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Select Your Role</h1>
      <div className="flex gap-6">
        <button
          onClick={() => handleSelectRole("INTERVIEWER")}
          className="px-6 py-3 bg-green-600 rounded-lg"
        >
          Interviewer
        </button>
        <button
          onClick={() => handleSelectRole("CANDIDATE")}
          className="px-6 py-3 bg-blue-600 rounded-lg"
        >
          Candidate
        </button>
      </div>
    </div>
  );
}