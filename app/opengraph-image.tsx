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
            gap: 0,
            transform: "rotate(-2deg)",
          }}
        >
          <div
            style={{
              width: 168,
              height: 58,
              background: "#111",
              borderRadius: "28px 28px 8px 8px",
            }}
          />
          <div
            style={{
              width: 148,
              height: 112,
              background: "#fff",
              border: "8px solid #111",
              borderRadius: 18,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                border: "5px solid #111",
                borderRadius: 6,
                background: "#F7F3EB",
                marginBottom: 36,
              }}
            />
            <div
              style={{
                width: 40,
                height: 64,
                background: "#111",
                borderRadius: "22px 22px 0 0",
              }}
            />
            <div
              style={{
                width: 22,
                height: 22,
                border: "5px solid #111",
                borderRadius: 6,
                background: "#F7F3EB",
                marginBottom: 36,
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
