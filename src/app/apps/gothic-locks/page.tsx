import type { Metadata, Viewport } from "next";
import GothicLocks from "./GothicLocks";

export const metadata: Metadata = {
  title: "Gothic Remake — Замки | Lab",
  description: "Русскоязычный справочник замков Gothic 1 Remake. Поиск сундуков, безопасный расчёт и пошаговые подсказки.",
  manifest: "/apps/gothic-locks.webmanifest",
  appleWebApp: { capable: true, title: "Замки Gothic", statusBarStyle: "black-translucent" },
  icons: { apple: "/apps/gothic-locks-icons/icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#171711" };

export default function GothicLocksPage() {
  return <GothicLocks />;
}
