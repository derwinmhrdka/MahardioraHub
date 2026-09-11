/** Shared upload limits (safe for client + server). */

/** Preferred max size after client compress / for hints. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Raw upload accepted by server (phone photos often 8–15MB). */
export const MAX_UPLOAD_INPUT_BYTES = 20 * 1024 * 1024;

export const MAX_UPLOAD_COUNT = 8;
export const MAX_IMAGE_EDGE = 1600;
export const WEBP_QUALITY = 78;

/** Client: shrink until roughly under this size. */
export const CLIENT_COMPRESS_TARGET_BYTES = 1.2 * 1024 * 1024;
export const CLIENT_COMPRESS_MAX_EDGE = 1600;
export const CLIENT_COMPRESS_MIN_QUALITY = 0.52;
