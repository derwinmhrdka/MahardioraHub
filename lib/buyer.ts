import { prisma } from "@/lib/prisma";

export type BuyerInput = {
  name: string;
  whatsapp: string;
  address: string;
};

export type BuyerProfile = BuyerInput;

/** Normalize WA to digits; convert leading 0 → 62. */
export function normalizeWhatsapp(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8") && digits.length >= 9 && digits.length <= 13) {
    digits = `62${digits}`;
  }
  return digits.slice(0, 20);
}

export function parseBuyerInput(input: {
  name?: string | null;
  whatsapp?: string | null;
  address?: string | null;
}): BuyerInput {
  const name = String(input.name ?? "").trim().slice(0, 120);
  const whatsapp = normalizeWhatsapp(String(input.whatsapp ?? ""));
  const address = String(input.address ?? "").trim().slice(0, 500);
  if (!name) throw new Error("Nama wajib diisi");
  if (!whatsapp || whatsapp.length < 10) {
    throw new Error("Nomor WhatsApp tidak valid");
  }
  if (!address) throw new Error("Alamat wajib diisi");
  return { name, whatsapp, address };
}

export async function getUserBuyerProfile(userId: string): Promise<BuyerProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, address: true },
  });
  if (!user) return null;
  if (!user.phone && !user.address && !user.name) return null;
  return {
    name: user.name?.trim() || "",
    whatsapp: user.phone ? normalizeWhatsapp(user.phone) : "",
    address: user.address?.trim() || "",
  };
}

export async function getGuestBuyerProfile(
  whatsappRaw: string
): Promise<BuyerProfile | null> {
  const whatsapp = normalizeWhatsapp(whatsappRaw);
  if (!whatsapp) return null;
  const row = await prisma.guestBuyer.findUnique({ where: { whatsapp } });
  if (!row) return null;
  return {
    name: row.name,
    whatsapp: row.whatsapp,
    address: row.address,
  };
}

/** Lookup autofill by WhatsApp (guest table, then user.phone). */
export async function lookupBuyerByWhatsapp(
  whatsappRaw: string
): Promise<BuyerProfile | null> {
  const whatsapp = normalizeWhatsapp(whatsappRaw);
  if (!whatsapp) return null;

  const guest = await prisma.guestBuyer.findUnique({ where: { whatsapp } });
  if (guest) {
    return {
      name: guest.name,
      whatsapp: guest.whatsapp,
      address: guest.address,
    };
  }

  const user = await prisma.user.findFirst({
    where: { phone: whatsapp },
    select: { name: true, phone: true, address: true },
  });
  if (!user?.phone) return null;
  return {
    name: user.name?.trim() || "",
    whatsapp: normalizeWhatsapp(user.phone),
    address: user.address?.trim() || "",
  };
}

export async function saveBuyerProfile(input: {
  userId?: string | null;
  buyer: BuyerInput;
}) {
  const buyer = input.buyer;
  if (input.userId) {
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        name: buyer.name,
        phone: buyer.whatsapp,
        address: buyer.address,
      },
    });
    return;
  }

  await prisma.guestBuyer.upsert({
    where: { whatsapp: buyer.whatsapp },
    create: {
      whatsapp: buyer.whatsapp,
      name: buyer.name,
      address: buyer.address,
    },
    update: {
      name: buyer.name,
      address: buyer.address,
    },
  });
}
