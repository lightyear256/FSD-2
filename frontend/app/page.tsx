"use client"
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter()

  return (
    <div>
      <button onClick={() => router.push("/role")}>
        Get Started
      </button>

      <button onClick={() => router.push("/auth")}>
       Already have an account? Login
      </button>
    </div>
  )
}