import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          border: "2px solid #111",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <div
            style={{
              width: 18,
              height: 7,
              background: "#111",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: 16,
              height: 12,
              background: "#fff",
              border: "2px solid #111",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 5,
                height: 7,
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
