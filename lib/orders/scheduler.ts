import { expireAllOverdueOrders } from "@/lib/orders/expire";
import { log } from "@/lib/logger";

const DEFAULT_INTERVAL_MS = 60_000;
let started = false;

/** In-process periodic expiry (single Docker replica). */
export function startOrderExpiryScheduler() {
  if (started) return;
  if (process.env.ORDER_EXPIRY_SCHEDULER === "0") return;

  started = true;
  const intervalMs = Number(process.env.ORDER_EXPIRY_INTERVAL_MS);
  const ms =
    Number.isFinite(intervalMs) && intervalMs >= 15_000
      ? intervalMs
      : DEFAULT_INTERVAL_MS;

  log.info("orders.expiry_scheduler_started", { intervalMs: ms });

  const tick = () => {
    void expireAllOverdueOrders().catch((err) => {
      log.error("orders.expiry_scheduler_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  };

  // Delay first tick so boot isn't blocked.
  setTimeout(tick, 5_000);
  setInterval(tick, ms);
}
