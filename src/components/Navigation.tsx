"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading, signIn, signOut } = useAuth();

  const handleSignIn = () => {
    signIn(window.location.href);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Закрыть меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

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
            <div className="ml-2 pl-2 border-l border-border relative" ref={userMenuRef}>
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
              ) : user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs text-white">
                        {(user.name || user.email || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </button>
                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50">
                      <div className="px-3 py-2 border-b border-border">
                        <div className="text-sm font-medium text-foreground truncate">
                          {user.name || "Пользователь"}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                    </div>
                  )}
                </>
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
            <div className="relative" ref={userMenuRef}>
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
              ) : user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-1 rounded-md text-muted hover:text-foreground hover:bg-card-hover"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs text-white">
                        {(user.name || user.email || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </button>
                  {/* Mobile Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50">
                      <div className="px-3 py-2 border-b border-border">
                        <div className="text-sm font-medium text-foreground truncate">
                          {user.name || "Пользователь"}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Выйти
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="p-2 rounded-md text-muted hover:text-foreground hover:bg-card-hover"
                  title="Войти через Google"
                >
                  <LogIn size={20} />
                </button>
              )}
            </div>

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
