export async function register() {
  // Only load Node scheduler on the Node.js runtime (not Edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // webpackIgnore: keep Edge instrumentation graph free of Node builtins.
    await import(/* webpackIgnore: true */ "./instrumentation.node");
  }
}
