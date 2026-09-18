"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  ShieldCheck,
  LogOut,
  Building2,
  User,
  ExternalLink,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(userStr));
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-500 font-medium">Carregando painel institucional...</div>
      </div>
    );
  }

  const navItems = [
    { label: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { label: "Emitir Documento", href: "/dashboard/emitir", icon: FilePlus },
    { label: "Documentos Emitidos", href: "/dashboard/documentos", icon: FileText },
    { label: "Auditoria On-Chain", href: "/dashboard/auditoria", icon: ShieldCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Institution Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.institution?.name || "Universidade"}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                {user.institution?.code || "INST-01"}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <User className="w-3.5 h-3.5" /> {user.name} ({user.role})
              </span>
              <span>•</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span>Verificador Público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
