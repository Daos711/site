"use client";

import { useEffect, useRef, useState } from "react";

export function SprayModelFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "spray-model-height" ||
        typeof data.height !== "number"
      ) {
        return;
      }
      if (ref.current && event.source !== ref.current.contentWindow) return;
      setHeight(Math.ceil(data.height));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      src="/embeds/spray-model.html"
      title="Модель факела распыла форсунки"
      className="w-full block border-0"
      style={{ height: height + "px" }}
    />
  );
}
