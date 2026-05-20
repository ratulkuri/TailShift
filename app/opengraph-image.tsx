import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TailShift — Convert Tailwind CSS classes between v3 and v4";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background:
            "linear-gradient(135deg, #0b1220 0%, #1e293b 60%, #2563eb 100%)",
          color: "white",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ fontSize: 48, fontWeight: 700 }}>TailShift</div>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Convert Tailwind classes
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#93c5fd",
          }}
        >
          v3 ↔ v4
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 28,
            color: "#cbd5e1",
            maxWidth: 900,
          }}
        >
          Free, instant, accessible. Built by Kowshik Kuri.
        </div>
      </div>
    ),
    size
  );
}
