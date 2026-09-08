import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/settings";

export const alt = "MahardioraHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  let siteName = "MahardioraHub";
  try {
    const settings = await getSettings();
    siteName = settings.siteName;
  } catch {
    // fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#F7F3EB",
          border: "16px solid #111",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 160,
              height: 56,
              background: "#111",
              borderRadius: 6,
            }}
          />
          <div
            style={{
              width: 148,
              height: 110,
              background: "#fff",
              border: "8px solid #111",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 64,
                background: "#111",
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#111",
            letterSpacing: -1,
          }}
        >
          {siteName}
        </div>
      </div>
    ),
    { ...size }
  );
}
