"use client";
import { SessionProvider } from "next-auth/react";
import { RoleProvider } from "@/app/context/RoleContext";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider> <RoleProvider>{children} </RoleProvider></SessionProvider>;
}