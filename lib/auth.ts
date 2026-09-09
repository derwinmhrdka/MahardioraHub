import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function isAdminSession() {
  const session = await auth();
  return session?.user?.role === "admin";
}
