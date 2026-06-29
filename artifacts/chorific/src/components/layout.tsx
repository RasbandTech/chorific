import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Wallet, History, Settings, Heart } from "lucide-react";

const SUPPORT_URL = "https://buy.stripe.com/7sY00bgT0edo8c63HW3sI02";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Chores" },
    { href: "/balances", icon: Wallet, label: "Balances" },
    { href: "/history", icon: History, label: "History" },
    { href: "/manage", icon: Settings, label: "Manage" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background max-w-5xl mx-auto md:border-x md:shadow-sm bg-card relative">
      {/* Desktop Header */}
      <header className="hidden md:flex sticky top-0 z-50 bg-card border-b px-6 h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
            C
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">Chorific</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 transition-colors"
          >
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
            Support this app
          </a>
        </nav>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-card border-b px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-lg text-primary tracking-tight">Chorific</span>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 transition-colors"
        >
          <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
          Support
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              <item.icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
