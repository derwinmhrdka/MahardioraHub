import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F3EB",
          border: "8px solid #111",
          borderRadius: 40,
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
              width: 108,
              height: 42,
              background: "#111",
              borderRadius: "22px 22px 6px 6px",
            }}
          />
          <div
            style={{
              width: 92,
              height: 72,
              background: "#fff",
              border: "6px solid #111",
              borderRadius: 14,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 14,
              paddingBottom: 0,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: "4px solid #111",
                borderRadius: 4,
                background: "#F7F3EB",
                marginBottom: 22,
              }}
            />
            <div
              style={{
                width: 26,
                height: 42,
                background: "#111",
                borderRadius: "14px 14px 0 0",
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                border: "4px solid #111",
                borderRadius: 4,
                background: "#F7F3EB",
                marginBottom: 22,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
