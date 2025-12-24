"use client";

import { useEffect, useRef } from "react";

interface TexProps {
  children: string;
  block?: boolean;
  className?: string;
}

export function Tex({ children, block = false, className = "" }: TexProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Динамический импорт katex на клиенте
    import("katex").then((katex) => {
      if (ref.current) {
        katex.default.render(children, ref.current, {
          throwOnError: false,
          displayMode: block,
        });
      }
    });
  }, [children, block]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: block ? "block" : "inline" }}
    />
  );
}
