"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getToken } from "@/app/lib/getToken";

export default function PostAuthPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const token = getToken(session);
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = await res.json();
      console.log("3. user from /me:", user);
      console.log("4. user.role:", user.role);

      if (user.role) {
        console.log("✅ Role exists, going to dashboard");
        localStorage.removeItem("selectedRole");
        router.push("/dashboard");
        return;
      }

      const roleFromStorage = localStorage.getItem("selectedRole");

      console.log("6. role from localStorage:", roleFromStorage);

      const role = roleFromStorage;
      console.log("7. final role to set:", role);

      if (!role) {
        router.push("/role");
        return;
      }

      const setRoleRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/set-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const setRoleData = await setRoleRes.json();
      console.log("8. set-role response:", setRoleData);
      localStorage.removeItem("selectedRole");
      router.push("/dashboard");
    };

    checkUser();
  }, [session]);

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border border-white/30 border-t-white" />
        <p className="mt-4 text-sm text-white/70">Setting up your account...</p>
      </div>
    </main>
  );
}
