"use client";

import katex from "katex";
import { useMemo } from "react";

interface MathProps {
  children: string;
  display?: boolean;
  className?: string;
}

export function Tex({ children, display = false, className = "" }: MathProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
      });
    } catch {
      return children;
    }
  }, [children, display]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
