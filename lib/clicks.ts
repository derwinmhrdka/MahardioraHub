import { prisma } from "./prisma";

export async function logClick(productId: number) {
  return prisma.click.create({
    data: { productId },
  });
}
