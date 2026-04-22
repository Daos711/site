"use client";

import { useEffect, useRef } from "react";

export function SprayModelFrame() {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;
    let injected: HTMLStyleElement | null = null;
    let onInnerResize: (() => void) | null = null;

    const init = () => {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      injected = doc.createElement("style");
      injected.textContent = `
        html, body {
          background: transparent !important;
          margin: 0 !important;
        }
      `;
      doc.head.appendChild(injected);

      const resize = () => {
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body.scrollHeight,
        );
        iframe.style.height = h + "px";
      };

      resize();

      observer = new ResizeObserver(resize);
      observer.observe(doc.documentElement);
      observer.observe(doc.body);

      onInnerResize = resize;
      win.addEventListener("resize", onInnerResize);
    };

    if (iframe.contentDocument?.readyState === "complete") {
      init();
    } else {
      iframe.addEventListener("load", init);
    }

    return () => {
      iframe.removeEventListener("load", init);
      observer?.disconnect();
      injected?.remove();
      if (onInnerResize && iframe.contentWindow) {
        iframe.contentWindow.removeEventListener("resize", onInnerResize);
      }
    };
  }, []);

  return (
    <iframe
      ref={ref}
      src="/models/spray-model.html"
      title="Модель факела распыла форсунки"
      scrolling="no"
      className="w-full block border-0"
      style={{ height: "900px" }}
    />
  );
}
