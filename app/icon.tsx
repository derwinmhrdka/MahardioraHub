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
          borderRadius: 9,
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
              width: 20,
              height: 8,
              background: "#111",
              borderRadius: "8px 8px 2px 2px",
            }}
          />
          <div
            style={{
              width: 17,
              height: 13,
              background: "#fff",
              border: "2px solid #111",
              borderRadius: 3,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 5,
                height: 8,
                background: "#111",
                borderRadius: "5px 5px 0 0",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
