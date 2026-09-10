"use client";

import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
 * Framing — the only place these values live. Tune here.
 *
 * The game paints itself bright blue and purple and sizes its own canvas to
 * the viewport, so the frame gives it a fixed height and otherwise stays out
 * of its way: a dark page, a rounded panel, a soft outward shadow tinted
 * toward the game's own palette so the contrast reads as deliberate.
 * ────────────────────────────────────────────────────────────────────────── */
const FRAME = {
  /** Breathing room between the panel and the left/right screen edges. */
  edgeGap: "1.5rem",
  /** The panel never grows wider than this. */
  maxWidth: "1800px",
  /** Corner rounding of the panel. */
  radius: "20px",
  /** Soft outward shadow. The first layer is the blue/purple glow. */
  shadow:
    "0 40px 90px -30px rgba(88, 80, 236, 0.45), 0 18px 50px -20px rgba(0, 0, 0, 0.85)",
  /** Hairline between the bright game and the dark page. */
  border: "1px solid rgba(140, 150, 235, 0.16)",
  /** Shown while the game loads, before its own background paints. */
  panelBackground: "#0b0b12",
  /**
   * Vertical space handed back to the rest of the layout: the sticky header
   * (4rem), the main element's py-8 (4rem in total) and the footer (~4rem).
   * The panel gets `100dvh` minus this. Lower it to make the game taller and
   * let the page scroll.
   */
  reserved: "12rem",
  /** Floor for short viewports and the loading state, so the canvas stays usable. */
  minHeight: 420,
} as const;

function ElkaFrame({ src }: { src: string }) {
  const stableHeight = `max(${FRAME.minHeight}px, calc(100dvh - ${FRAME.reserved}))`;

  return (
    <iframe
      src={src}
      title="Ёлка"
      allow="autoplay; fullscreen; gamepad"
      allowFullScreen
      scrolling="no"
      className="w-full block border-0"
      style={{ height: stableHeight, overflow: "hidden" }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * The gate.
 *
 * Static export cannot check anything on a server, so this is a threshold and
 * not a lock. What it does: the word is not in this repository, and the folder
 * the assets sit in is derived from the word, so a visitor without the word
 * has no address to fetch. What it does not do: stop anyone who reads the
 * network tab of a browser that has already been let in, or anyone willing to
 * guess words against the digest below. Treat a leaked word as a leaked game.
 *
 * Both values come from the ELKA_PASSWORD secret at build time — see the
 * "Elka embed" block in .github/workflows/deploy.yml. The prefixes are what
 * keep the digest from revealing the folder.
 * ────────────────────────────────────────────────────────────────────────── */
const PATH_TAG = "elka-path:";
const GATE_TAG = "elka-gate:";
const DIR_LENGTH = 32;
const EMBED_ROOT = "/embeds/elka";
const SESSION_KEY = "elka.dir";

/**
 * Query parameters the gate forwards to the simulator.
 *
 * The iframe URL is built here, so `?dev=1` typed on the gate's own address never reached the
 * frame — the owner had to open devtools and copy the frame URL by hand to get the developer
 * strip. Forwarded as an allow-list rather than by passing `location.search` through: the gate's
 * URL is also where the folder word is typed, and nothing about that may be handed to the frame.
 */
const FORWARDED_PARAMS = ["dev", "seed"] as const;

/** `?dev=1&seed=…` for the iframe, or an empty string when neither was given. */
function forwardedQuery(search: string): string {
  const incoming = new URLSearchParams(search);
  const forwarded = new URLSearchParams();
  for (const key of FORWARDED_PARAMS) {
    const value = incoming.get(key);
    if (value !== null) forwarded.set(key, value);
  }
  const query = forwarded.toString();
  return query ? `?${query}` : "";
}

/** Empty in the source tree; filled in by the deploy workflow. */
const DIGEST = process.env.NEXT_PUBLIC_ELKA_DIGEST ?? "";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ElkaGate() {
  const [dir, setDir] = useState<string | null>(null);
  // Read once on mount rather than during render: `location` does not exist while Next is
  // rendering this on the server, and the value cannot change without a navigation anyway.
  const [query, setQuery] = useState("");
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Survive a reload within the same tab, so a refresh mid-game does not
  // mean typing the word again. Cleared when the tab closes.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved && new RegExp(`^[0-9a-f]{${DIR_LENGTH}}$`).test(saved)) {
        setDir(saved);
      }
    } catch {
      // Private mode with storage disabled — just ask for the word.
    }
  }, []);

  useEffect(() => {
    setQuery(forwardedQuery(window.location.search));
  }, []);

  useEffect(() => {
    if (!dir) inputRef.current?.focus();
  }, [dir]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const candidate = word.trim().normalize("NFC");
    if (!candidate || checking) return;

    if (typeof crypto === "undefined" || !crypto.subtle) {
      setError("Браузер не даёт доступ к Web Crypto — нужен https.");
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const [gate, path] = await Promise.all([
        sha256Hex(GATE_TAG + candidate),
        sha256Hex(PATH_TAG + candidate),
      ]);
      if (gate !== DIGEST) {
        setError("Не то слово.");
        setWord("");
        inputRef.current?.focus();
        return;
      }
      const next = path.slice(0, DIR_LENGTH);
      try {
        sessionStorage.setItem(SESSION_KEY, next);
      } catch {
        // Not being able to remember it is not a reason to refuse entry.
      }
      setDir(next);
    } finally {
      setChecking(false);
    }
  }

  if (!DIGEST) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-muted">
          Раздел не собран: при сборке не был задан ELKA_PASSWORD.
        </p>
      </div>
    );
  }

  if (!dir) {
    return (
      <div className="max-w-md mx-auto py-16">
        <h1 className="text-2xl font-bold mb-2">Ёлка</h1>
        <p className="text-muted mb-6">Нужно слово.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            value={word}
            onChange={(e) => {
              setWord(e.target.value);
              setError(null);
            }}
            autoComplete="off"
            spellCheck={false}
            aria-label="Слово"
            aria-invalid={error ? true : undefined}
            className="w-full px-4 py-3 rounded-md bg-card border border-border text-foreground outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!word.trim() || checking}
            className="px-4 py-3 rounded-md bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent"
          >
            {checking ? "…" : "Войти"}
          </button>
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted min-h-[1.25rem]"
          >
            {error}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div
      className="relative left-1/2 -translate-x-1/2"
      style={{
        width: `min(calc(100vw - ${FRAME.edgeGap} * 2), ${FRAME.maxWidth})`,
      }}
    >
      <div
        style={{
          borderRadius: FRAME.radius,
          border: FRAME.border,
          boxShadow: FRAME.shadow,
          background: FRAME.panelBackground,
          overflow: "hidden",
        }}
      >
        <ElkaFrame src={`${EMBED_ROOT}/${dir}/index.html${query}`} />
      </div>
    </div>
  );
}
