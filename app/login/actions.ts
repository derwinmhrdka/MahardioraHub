"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogleAction(formData?: FormData) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Google login disabled in development");
  }
  const next = String(formData?.get("next") ?? "/").trim() || "/";
  const safeNext = next.startsWith("/") ? next : "/";
  await signIn("google", { redirectTo: safeNext });
}

export async function signInDevAction(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev login disabled");
  }
  const role = String(formData.get("role") ?? "") === "admin" ? "admin" : "visitor";
  const next = String(formData.get("next") ?? "/").trim() || "/";
  const safeNext = next.startsWith("/") ? next : "/";
  await signIn("dev", { role, redirectTo: safeNext });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
