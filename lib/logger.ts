type Level = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

function emit(level: Level, message: string, meta?: LogMeta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

/** Lightweight structured logger (JSON lines → stdout/stderr). */
export const log = {
  debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === "production" && process.env.LOG_DEBUG !== "1") {
      return;
    }
    emit("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    emit("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    emit("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    emit("error", message, meta);
  },
};
