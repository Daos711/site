"use client";

import { useCallback, useRef } from "react";

export function SprayModelFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const handleLoad = useCallback(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return;

    if (!doc.getElementById("spray-model-overrides")) {
      const style = doc.createElement("style");
      style.id = "spray-model-overrides";
      style.textContent = `
        html, body {
          background: transparent !important;
          margin: 0 !important;
        }
        body h1 { display: none !important; }
      `;
      doc.head.appendChild(style);
    }

    const resize = () => {
      const h = Math.max(
        doc.documentElement.scrollHeight,
        doc.body?.scrollHeight ?? 0,
      );
      if (h > 0) iframe.style.height = h + "px";
    };

    resize();
    requestAnimationFrame(resize);
    setTimeout(resize, 50);
    setTimeout(resize, 200);
    setTimeout(resize, 500);
    setTimeout(resize, 1000);

    observerRef.current?.disconnect();
    const ro = new ResizeObserver(resize);
    ro.observe(doc.documentElement);
    if (doc.body) ro.observe(doc.body);
    observerRef.current = ro;

    win.addEventListener("resize", resize);
  }, []);

  return (
    <iframe
      ref={ref}
      src="/embeds/spray-model.html"
      title="Модель факела распыла форсунки"
      className="w-full block border-0"
      style={{ height: "900px" }}
      onLoad={handleLoad}
    />
  );
}
