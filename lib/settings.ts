import { prisma } from "./prisma";

export type SettingInput = {
  whatsappNumber: string;
  siteName: string;
  contactEmail?: string | null;
  shopeeAffiliateId?: string | null;
};

export async function getSettings() {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) {
    throw new Error("Settings row missing. Run migrations and seed.");
  }
  return settings;
}

export async function updateSettings(input: SettingInput) {
  return prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      whatsappNumber: input.whatsappNumber,
      siteName: input.siteName,
      contactEmail: input.contactEmail || null,
      shopeeAffiliateId: input.shopeeAffiliateId || null,
    },
    update: {
      whatsappNumber: input.whatsappNumber,
      siteName: input.siteName,
      contactEmail: input.contactEmail || null,
      shopeeAffiliateId: input.shopeeAffiliateId || null,
    },
  });
}

export function buildWhatsAppLink(
  whatsappNumber: string,
  itemTitle: string
): string {
  const text = encodeURIComponent(
    `Hi, I'm interested in: ${itemTitle}`
  );
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}
