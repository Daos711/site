"use client";

import { useEffect, useRef, useState } from "react";

interface TexProps {
  children: string;
  block?: boolean;
  className?: string;
}

interface KaTeXOptions {
  throwOnError?: boolean;
  displayMode?: boolean;
}

interface KaTeX {
  render(tex: string, element: HTMLElement, options?: KaTeXOptions): void;
}

// Загружаем KaTeX из CDN
function loadKaTeX(): Promise<KaTeX> {
  return new Promise((resolve, reject) => {
    const win = window as unknown as { katex?: KaTeX };

    // Проверяем, загружен ли уже
    if (win.katex) {
      resolve(win.katex);
      return;
    }

    // Создаём script для загрузки KaTeX
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/katex.min.js";
    script.integrity = "sha384-V4Zqq5MsXN1dfQGZJLqHUtRc5/pJmYivlrmFc8l7dcA37tShMEktPO7vH4II7zyP";
    script.crossOrigin = "anonymous";
    script.async = true;

    script.onload = () => {
      const katex = (window as unknown as { katex?: KaTeX }).katex;
      if (katex) {
        resolve(katex);
      } else {
        reject(new Error("KaTeX not found on window"));
      }
    };

    script.onerror = () => reject(new Error("Failed to load KaTeX"));

    document.head.appendChild(script);
  });
}

export function Tex({ children, block = false, className = "" }: TexProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!ref.current || rendered) return;

    loadKaTeX()
      .then((katex) => {
        if (ref.current) {
          katex.render(children, ref.current, {
            throwOnError: false,
            displayMode: block,
          });
          setRendered(true);
        }
      })
      .catch((err) => {
        console.error("KaTeX load error:", err);
        // Fallback: показываем текст как есть
        if (ref.current) {
          ref.current.textContent = children;
        }
      });
  }, [children, block, rendered]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: block ? "block" : "inline" }}
    />
  );
}
