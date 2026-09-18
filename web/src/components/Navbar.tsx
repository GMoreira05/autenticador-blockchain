"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, FileCheck, BookOpen, User, LogIn, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setHasToken(!!token);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-lg leading-tight flex items-center gap-1.5">
              CertChain <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">Acadêmico</span>
            </div>
            <div className="text-xs text-slate-500">Autenticador Blockchain Zero-Storage</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Verificar</span>
          </Link>

          <Link
            href="/como-funciona"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/como-funciona"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Como Funciona</span>
          </Link>

          {hasToken ? (
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-900 text-white hover:bg-slate-800 shadow-sm`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900`}
            >
              <LogIn className="w-4 h-4" />
              <span>Acesso Institucional</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
