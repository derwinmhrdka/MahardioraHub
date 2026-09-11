import { prisma } from "@/lib/prisma";

export type BankAccountInput = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  isActive?: boolean;
};

function normalizeAccount(input: BankAccountInput) {
  const bankName = input.bankName.trim().slice(0, 80);
  const accountName = input.accountName.trim().slice(0, 120);
  const accountNumber = input.accountNumber.trim().replace(/\s+/g, "").slice(0, 40);
  if (!bankName || !accountName || !accountNumber) {
    throw new Error("Rekening tidak lengkap");
  }
  if (!/^\d+$/.test(accountNumber)) {
    throw new Error("Nomor rekening harus angka");
  }
  return {
    bankName,
    accountName,
    accountNumber,
    isActive: input.isActive ?? true,
  };
}

export async function listBankAccounts() {
  return prisma.bankAccount.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function listActiveBankAccounts() {
  return prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function countActiveBankAccounts() {
  return prisma.bankAccount.count({ where: { isActive: true } });
}

export async function getBankAccount(id: number) {
  return prisma.bankAccount.findUnique({ where: { id } });
}

export async function createBankAccount(input: BankAccountInput) {
  const data = normalizeAccount(input);
  const max = await prisma.bankAccount.aggregate({ _max: { sortOrder: true } });
  return prisma.bankAccount.create({
    data: {
      ...data,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function updateBankAccount(id: number, input: BankAccountInput) {
  const data = normalizeAccount(input);
  return prisma.bankAccount.update({
    where: { id },
    data,
  });
}

export async function deleteBankAccount(id: number) {
  return prisma.bankAccount.delete({ where: { id } });
}

export async function setBankAccountActive(id: number, isActive: boolean) {
  return prisma.bankAccount.update({
    where: { id },
    data: { isActive },
  });
}
