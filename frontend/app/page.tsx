"use client";
import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">

<button className="border-2 p-2 rounded-lg  bg-blue-500 text-white"
  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
>
  Sign in with Google
</button>
    </div>
  );
}