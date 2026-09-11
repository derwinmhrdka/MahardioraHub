/**
 * Node-only boot hooks. Kept separate so Edge/webpack instrumentation
 * analysis does not try to bundle `crypto` / `fs` / Prisma.
 */
import { startOrderExpiryScheduler } from "@/lib/orders/scheduler";

startOrderExpiryScheduler();
