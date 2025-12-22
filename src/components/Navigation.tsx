"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const basePath = "/site";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/tools", label: "Инструменты" },
  { href: "/models", label: "Модели" },
  { href: "/games", label: "Игры" },
  { href: "/projects", label: "Проекты" },
  { href: "/about", label: "О сайте" },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href={basePath} className="text-lg font-semibold hover:text-accent transition-colors">
            Lab
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const fullHref = item.href === "/" ? basePath : basePath + item.href;
              const isActive = pathname === item.href || pathname === fullHref;
              return (
                <a
                  key={item.href}
                  href={fullHref}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-card text-foreground"
                      : "text-muted hover:text-foreground hover:bg-card-hover"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-muted hover:text-foreground hover:bg-card-hover"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const fullHref = item.href === "/" ? basePath : basePath + item.href;
                const isActive = pathname === item.href || pathname === fullHref;
                return (
                  <a
                    key={item.href}
                    href={fullHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-card text-foreground"
                        : "text-muted hover:text-foreground hover:bg-card-hover"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
