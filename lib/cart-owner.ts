import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const GUEST_COOKIE = "dh_guest";
export const GUEST_HEADER = "x-dh-guest";

export function userOwnerKey(userId: string) {
  return `u_${userId}`;
}

export function guestOwnerKey(guestId: string) {
  return `g_${guestId}`;
}

export function parseOwnerKey(ownerKey: string): {
  userId: string | null;
  guestId: string | null;
} {
  if (ownerKey.startsWith("u_")) {
    return { userId: ownerKey.slice(2), guestId: null };
  }
  if (ownerKey.startsWith("g_")) {
    return { userId: null, guestId: ownerKey.slice(2) };
  }
  return { userId: null, guestId: null };
}

function isValidGuestId(raw: string) {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(raw);
}

async function readGuestId(): Promise<string | null> {
  const hdrs = await headers();
  const fromHeader = hdrs.get(GUEST_HEADER)?.trim() ?? "";
  if (isValidGuestId(fromHeader)) return fromHeader;

  const jar = await cookies();
  const raw = jar.get(GUEST_COOKIE)?.value?.trim() ?? "";
  if (isValidGuestId(raw)) return raw;
  return null;
}

export async function ensureGuestId(): Promise<string> {
  const existing = await readGuestId();
  if (existing) return existing;
  // Middleware should always provide one; keep a stable-looking fallback.
  return "guestfallback0001";
}

export async function getGuestId(): Promise<string | null> {
  return readGuestId();
}

/** Merge anonymous cart into logged-in user cart, then drop guest lines. */
async function mergeGuestCartToUser(userId: string, guestId: string) {
  const fromKey = guestOwnerKey(guestId);
  const toKey = userOwnerKey(userId);
  const guestItems = await prisma.cartItem.findMany({ where: { ownerKey: fromKey } });
  if (guestItems.length === 0) return;

  for (const item of guestItems) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        ownerKey_productId: { ownerKey: toKey, productId: item.productId },
      },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + item.quantity,
          selected: existing.selected || item.selected,
        },
      });
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { ownerKey: toKey },
      });
    }
  }
}

export type CartOwner = {
  ownerKey: string;
  userId: string | null;
  guestId: string | null;
};

/** Resolve cart owner for current request (login preferred). */
export async function resolveCartOwner(): Promise<CartOwner> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = await readGuestId();

  if (userId) {
    if (guestId) {
      try {
        await mergeGuestCartToUser(userId, guestId);
      } catch {
        // ignore merge errors
      }
    }
    return {
      ownerKey: userOwnerKey(userId),
      userId,
      guestId,
    };
  }

  const id = guestId ?? (await ensureGuestId());
  return {
    ownerKey: guestOwnerKey(id),
    userId: null,
    guestId: id,
  };
}
