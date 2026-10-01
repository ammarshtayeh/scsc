import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SCSC-NNU — Society of Cosmetics and Skin Care, An-Najah National University";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin-only copy: the OG renderer does not shape Arabic glyphs correctly.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0b2d5c 0%, #11488d 55%, #0b3b78 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              background: "linear-gradient(135deg, #f6cf42 0%, #efbb0f 100%)",
              color: "#0b2d5c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800
            }}
          >
            SC
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 4 }}>SCSC-NNU</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
            Society of Cosmetics
          </div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1, color: "#f6cf42" }}>
            and Skin Care
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#dbe7f7", marginTop: 8 }}>
            An-Najah National University
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 24, color: "#dbe7f7" }}>
          {["Membership", "Events", "Education", "Jobs", "Store"].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.28)",
                background: "rgba(255,255,255,0.08)"
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
