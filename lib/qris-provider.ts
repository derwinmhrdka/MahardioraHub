import { OrderPayProvider } from "@prisma/client";
import { midtransConfigured, isMidtransSandbox } from "@/lib/midtrans";
import { getSettings } from "@/lib/settings";
import { isXenditTestMode, xenditConfigured } from "@/lib/xendit";

export type QrisProvider = "midtrans" | "xendit";

/** Active QRIS PSP from admin Settings → Payment. */
export async function getQrisProvider(): Promise<QrisProvider> {
  const settings = await getSettings();
  return settings.qrisProvider === OrderPayProvider.xendit
    ? "xendit"
    : "midtrans";
}

export async function qrisConfigured() {
  const provider = await getQrisProvider();
  if (provider === "xendit") return xenditConfigured();
  return midtransConfigured();
}

/** Show Sim button for sandbox/test of the order's provider. */
export function qrisCanSimulate(payProvider: string | null | undefined) {
  if (payProvider === "xendit") return isXenditTestMode();
  if (payProvider === "midtrans") return isMidtransSandbox();
  // Unknown order: prefer Midtrans sandbox check (default provider)
  return isMidtransSandbox() || isXenditTestMode();
}
