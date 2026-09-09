"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogleAction(formData?: FormData) {
  const next = String(formData?.get("next") ?? "/").trim() || "/";
  const safeNext = next.startsWith("/") ? next : "/";
  await signIn("google", { redirectTo: safeNext });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
