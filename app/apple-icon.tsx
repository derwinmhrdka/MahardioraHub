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
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 96,
              height: 36,
              background: "#111",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              width: 88,
              height: 70,
              background: "#fff",
              border: "6px solid #111",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 40,
                background: "#111",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
