'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Terminal,
  LayoutDashboard,
  FileCheck2,
  Database,
  History,
  LogOut,
  UserCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '@/components/Providers';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Assessments', href: '/admin/assessments', icon: FileCheck2 },
    { label: 'Question Bank', href: '/admin/questions', icon: Database },
    { label: 'Audit Logs', href: '/admin/audit', icon: History },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0c1222]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                  Tech<span className="text-indigo-400">Assess</span>
                </span>
                <span className="text-[9px] text-slate-400 block -mt-1 font-mono uppercase tracking-wider">
                  Admin Workspace
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/assessments/new"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Assessment</span>
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[150px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-indigo-400 font-mono">
                  {user.role}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
