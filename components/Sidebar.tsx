'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Globe, MessageSquare, FlaskConical, ChevronRight, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/linkedin', label: 'LinkedIn', icon: Layers },
  { href: '/web', label: 'Web', icon: Globe },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/a-tester', label: 'À tester', icon: FlaskConical },
];

const linkedinCategories = [
  { href: '/linkedin/Publicit%C3%A9', label: 'Publicité' },
  { href: '/linkedin/E-commerce', label: 'E-commerce' },
  { href: '/linkedin/IA', label: 'IA' },
  { href: '/linkedin/Claude', label: 'Claude' },
];

export function Sidebar() {
  const pathname = usePathname();
  const isLinkedInActive = pathname.startsWith('/linkedin');

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">RAG</h1>
            <p className="text-xs text-slate-500 mt-1">Content Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/linkedin'
            ? isLinkedInActive
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", isActive && "rotate-90 text-primary", !isActive && "text-slate-300")} />
              </Link>

              {/* LinkedIn sub-categories */}
              {item.href === '/linkedin' && isLinkedInActive && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {linkedinCategories.map((cat) => {
                    const catActive = pathname === cat.href || pathname.startsWith(cat.href);
                    return (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                          catActive ? "text-primary font-semibold bg-primary/5" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        )}
                      >
                        <Folder className="w-3.5 h-3.5" />
                        {cat.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
