import type { BuyerInput } from "@/lib/buyer";

export type CheckoutBuyer = BuyerInput & {
  branchId?: number | null;
  shipFromBranch?: string | null;
};

export type CheckoutOwner = {
  ownerKey: string;
  userId: string | null;
  guestId: string | null;
};

export type OrderListTab = "pending" | "progress" | "completed" | "cancel";
