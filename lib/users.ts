import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const row = await prisma.adminAllowlist.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });
  return Boolean(row);
}

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const admin = await isAdminEmail(email);
  const role = admin ? UserRole.admin : UserRole.visitor;

  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: input.name?.trim() || null,
      image: input.image?.trim() || null,
      role,
    },
    update: {
      name: input.name?.trim() || null,
      image: input.image?.trim() || null,
      role,
    },
  });
}

export async function listAdminAllowlist() {
  const rows = await prisma.adminAllowlist.findMany({
    orderBy: { email: "asc" },
  });
  const emails = rows.map((r) => r.email);
  const users = emails.length
    ? await prisma.user.findMany({
        where: { email: { in: emails } },
      })
    : [];
  const byEmail = new Map(users.map((u) => [u.email, u]));

  return rows.map((row) => {
    const user = byEmail.get(row.email);
    return {
      id: row.id,
      email: row.email,
      name: user?.name ?? null,
      image: user?.image ?? null,
      hasLogin: Boolean(user),
    };
  });
}

export async function listVisitorUsers() {
  return prisma.user.findMany({
    where: { role: UserRole.visitor },
    orderBy: { updatedAt: "desc" },
  });
}

export async function grantAdminByEmail(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email");
  }

  await prisma.adminAllowlist.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  await prisma.user.updateMany({
    where: { email },
    data: { role: UserRole.admin },
  });
}

export async function revokeAdminByEmail(emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  if (!email) throw new Error("Invalid email");

  const remaining = await prisma.adminAllowlist.count({
    where: { email: { not: email } },
  });
  if (remaining === 0) {
    throw new Error("Last admin");
  }

  await prisma.adminAllowlist.deleteMany({ where: { email } });
  await prisma.user.updateMany({
    where: { email },
    data: { role: UserRole.visitor },
  });
}
