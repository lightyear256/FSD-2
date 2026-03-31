"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { getToken } from "@/app/lib/getToken";

export default function PostAuthPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkUser = async () => {
      const token = getToken(session);
      if (!token) return;

      const res = await fetch("http://localhost:5000/user/me", {
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
       const roleFromUrl = searchParams.get("role");
      const roleFromStorage = localStorage.getItem("selectedRole");

      console.log("5. role from URL:", roleFromUrl);
      console.log("6. role from localStorage:", roleFromStorage);

      const role = roleFromUrl || roleFromStorage;
      console.log("7. final role to set:", role);

      if (!role) {
        router.push("/role");
        return;
      }

      const setRoleRes = await fetch("http://localhost:5000/user/set-role", {
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <p>Setting up your account...</p>
    </div>
  );
}