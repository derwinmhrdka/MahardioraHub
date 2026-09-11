export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startOrderExpiryScheduler } = await import("@/lib/orders/scheduler");
  startOrderExpiryScheduler();
}
