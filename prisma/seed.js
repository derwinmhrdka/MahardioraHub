import { PrismaClient, ProductKind } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.click.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();

  await prisma.setting.create({
    data: {
      id: 1,
      siteName: "MahardioraHub",
      whatsappNumber: "6281234567890",
      contactEmail: "hello@dealhub.local",
      shopeeAffiliateId: null,
    },
  });

  const electronics = await prisma.category.create({
    data: { name: "Electronics", slug: "electronics" },
  });
  const home = await prisma.category.create({
    data: { name: "Home", slug: "home" },
  });
  const kids = await prisma.category.create({
    data: { name: "Kids", slug: "kids" },
  });

  await prisma.product.createMany({
    data: [
      {
        kind: ProductKind.deal,
        title: "Wireless earbuds with case",
        categoryId: electronics.id,
        price: 129000,
        imageUrl: "https://picsum.photos/seed/earbuds/600/600",
        shortNote: "Often under 150k with vouchers",
        storeArea: "Jakarta",
        shopName: "Shopee",
        affiliateLink: "https://shopee.co.id/",
        isActive: true,
      },
      {
        kind: ProductKind.deal,
        title: "USB-C fast charger 20W",
        categoryId: electronics.id,
        price: 45000,
        imageUrl: "https://picsum.photos/seed/charger/600/600",
        shortNote: "Good daily pickup",
        storeArea: "Bandung",
        shopName: "Tokopedia",
        affiliateLink: "https://www.tokopedia.com/",
        isActive: true,
      },
      {
        kind: ProductKind.deal,
        title: "Microfiber mop set",
        categoryId: home.id,
        price: 89000,
        imageUrl: "https://picsum.photos/seed/mop/600/600",
        shortNote: "Replaceable pads included",
        storeArea: "Jakarta",
        shopName: "Shopee",
        affiliateLink: "https://shopee.co.id/",
        isActive: true,
      },
      {
        kind: ProductKind.deal,
        title: "Kids stacking cups",
        categoryId: kids.id,
        price: 35000,
        imageUrl: "https://picsum.photos/seed/cups/600/600",
        shortNote: "Soft plastic, bath-friendly",
        storeArea: "Surabaya",
        shopName: "Shopee",
        affiliateLink: "https://shopee.co.id/",
        isActive: true,
      },
      {
        kind: ProductKind.secondhand,
        title: "Baby carrier (used, clean)",
        categoryId: kids.id,
        price: 150000,
        imageUrl: "https://picsum.photos/seed/carrier/600/600",
        shortNote: "Light wear on straps",
        storeArea: "Jakarta",
        isActive: true,
      },
      {
        kind: ProductKind.secondhand,
        title: "Desk lamp LED",
        categoryId: home.id,
        price: 75000,
        imageUrl: "https://picsum.photos/seed/lamp/600/600",
        shortNote: "Works well, no box",
        storeArea: "Bandung",
        isActive: true,
      },
      {
        kind: ProductKind.secondhand,
        title: "Bluetooth speaker mini",
        categoryId: electronics.id,
        price: 100000,
        imageUrl: "https://picsum.photos/seed/speaker/600/600",
        shortNote: "Battery holds ~4 hours",
        storeArea: "Jakarta",
        isActive: true,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
