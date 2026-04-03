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
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-12">
      <section className="panel w-full max-w-2xl p-8 sm:p-10">
        <p className="mono text-xs uppercase tracking-[0.14em] text-white/55">Role setup</p>
        <h1 className="mt-3 text-3xl font-medium text-white sm:text-4xl">Choose your interview role</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">
          We use this selection to tailor your room flow. You can continue with Google or email in the next step.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => handleSelectRole("INTERVIEWER")}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-5 text-left transition hover:border-white/20 hover:bg-white/[0.04] cursor-pointer"
          >
            <p className="text-base font-medium text-white">Interviewer</p>
            <p className="mt-1 text-sm leading-6 text-white/60">Create private rooms and host technical sessions.</p>
          </button>

          <button
            onClick={() => handleSelectRole("CANDIDATE")}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-5 text-left transition hover:border-white/20 hover:bg-white/[0.04] cursor-pointer"
          >
            <p className="text-base font-medium text-white">Candidate</p>
            <p className="mt-1 text-sm leading-6 text-white/60">Join interview rooms and collaborate in real time.</p>
          </button>
        </div>
      </section>
    </main>
  );
}
