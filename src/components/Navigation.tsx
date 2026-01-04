"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/tools", label: "Инструменты" },
  { href: "/models", label: "Модели" },
  { href: "/games", label: "Игры" },
  { href: "/apps", label: "Приложения" },
  { href: "/projects", label: "Проекты" },
  { href: "/about", label: "О сайте" },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, signIn, signOut } = useAuth();

  const handleSignIn = () => {
    signIn(window.location.href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="text-lg font-semibold hover:text-accent transition-colors">
            Lab
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
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

            {/* Auth button */}
            <div className="ml-2 pl-2 border-l border-border">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
              ) : user ? (
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors"
                  title={`Выйти (${user.email || user.name})`}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <LogOut size={18} />
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors"
                  title="Войти через Google"
                >
                  <LogIn size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Auth + Menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Auth button */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
            ) : user ? (
              <button
                onClick={signOut}
                className="p-2 rounded-md text-muted hover:text-foreground hover:bg-card-hover"
                title={`Выйти (${user.email || user.name})`}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <LogOut size={20} />
                )}
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="p-2 rounded-md text-muted hover:text-foreground hover:bg-card-hover"
                title="Войти через Google"
              >
                <LogIn size={20} />
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="p-2 rounded-md text-muted hover:text-foreground hover:bg-card-hover"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
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
