import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export type BranchInput = {
  name: string;
  isActive?: boolean;
};

function normalizeBranch(input: BranchInput) {
  const name = input.name.trim().slice(0, 120);
  if (!name) throw new Error("Nama cabang wajib diisi");
  return {
    name,
    isActive: input.isActive ?? true,
  };
}

export async function listBranches() {
  return prisma.branch.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

export async function listActiveBranches() {
  return prisma.branch.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

/** Feature on + at least one active branch → show “Dikirim dari”. */
export async function getCheckoutBranches() {
  const settings = await getSettings();
  if (!settings.branchesEnabled) return [];
  return listActiveBranches();
}

export async function createBranch(input: BranchInput) {
  const data = normalizeBranch(input);
  const max = await prisma.branch.aggregate({ _max: { sortOrder: true } });
  return prisma.branch.create({
    data: {
      ...data,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function deleteBranch(id: number) {
  return prisma.branch.delete({ where: { id } });
}

export async function setBranchActive(id: number, isActive: boolean) {
  return prisma.branch.update({
    where: { id },
    data: { isActive },
  });
}

export async function setBranchesFeatureEnabled(enabled: boolean) {
  return prisma.setting.update({
    where: { id: 1 },
    data: { branchesEnabled: enabled },
  });
}

/**
 * Resolve branch for checkout.
 * Returns null when feature off / no active branches (selector hidden).
 * Throws when selector is shown but selection missing/invalid.
 */
export async function resolveCheckoutBranch(branchIdRaw: unknown): Promise<{
  branchId: number;
  shipFromBranch: string;
} | null> {
  const branches = await getCheckoutBranches();
  if (branches.length === 0) return null;

  const branchId = Number(branchIdRaw);
  if (!Number.isFinite(branchId)) {
    throw new Error("Pilih cabang pengiriman");
  }
  const branch = branches.find((row) => row.id === branchId);
  if (!branch) {
    throw new Error("Cabang tidak valid");
  }
  return { branchId: branch.id, shipFromBranch: branch.name };
}
