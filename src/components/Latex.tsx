"use client";

import { useEffect, useRef } from "react";

// Типизация глобального window.katex
declare global {
  interface Window {
    katex?: {
      render: (tex: string, el: HTMLElement, opts?: {
        displayMode?: boolean;
        throwOnError?: boolean;
        strict?: string;
      }) => void;
    };
  }
}

interface LatexProps {
  tex: string;
  block?: boolean;
  className?: string;
}

export function Latex({ tex, block = false, className }: LatexProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ждём, пока подгрузится katex (strategy="beforeInteractive" должен загрузить быстро)
    let tries = 0;
    const tick = () => {
      if (window.katex) {
        window.katex.render(tex, el, {
          displayMode: block,
          throwOnError: false,
          strict: "ignore",
        });
      } else if (tries++ < 60) {
        requestAnimationFrame(tick); // ~1 сек ожидания максимум
      } else {
        el.textContent = tex; // fallback если не загрузился
      }
    };
    tick();
  }, [tex, block]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: block ? "block" : "inline" }}
    />
  );
}
