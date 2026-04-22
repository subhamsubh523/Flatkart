import { useState } from "react";

export default function ImageSlider({ images, image, height = "190px", noImgSize = "3rem", onImageClick }) {
  const [idx, setIdx] = useState(0);
  const all = images?.length ? images : image ? [image] : [];

  const isUrl = (s) => s?.startsWith("http");
  const src = (s) => isUrl(s) ? s : `http://localhost:5000/uploads/${s}`;

  if (!all.length) return (
    <div style={{ height, background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: noImgSize }}>🏠</div>
  );

  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => (i - 1 + all.length) % all.length); };
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => (i + 1) % all.length); };

  return (
    <div style={{ position: "relative", height, overflow: "hidden", flexShrink: 0 }}>
      <img
        src={src(all[idx])}
        alt="flat"
        onClick={onImageClick ? (e) => { e.preventDefault(); e.stopPropagation(); onImageClick(all.map(src), idx); } : undefined}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: onImageClick ? "zoom-in" : "default" }}
      />
      {all.length > 1 && (
        <>
          <button onClick={prev} style={{ ...arrow, left: "6px" }}>❮</button>
          <button onClick={next} style={{ ...arrow, right: "6px" }}>❯</button>
          <div style={dots}>
            {all.map((_, i) => (
              <span key={i} style={{ ...dot, background: i === idx ? "#fff" : "rgba(255,255,255,0.45)" }}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const arrow = { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, padding: 0 };
const dots = { position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px", zIndex: 2 };
const dot = { width: "6px", height: "6px", borderRadius: "50%", cursor: "pointer", transition: "background 0.2s" };
