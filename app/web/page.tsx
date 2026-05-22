export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Folder, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { slug: 'Publicité',  label: 'Publicité',  gradient: 'from-blue-400 to-blue-600',    light: 'bg-blue-50',    text: 'text-blue-700' },
  { slug: 'E-commerce', label: 'E-commerce', gradient: 'from-emerald-400 to-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700' },
  { slug: 'IA',         label: 'IA',         gradient: 'from-violet-400 to-violet-600',  light: 'bg-violet-50',  text: 'text-violet-700' },
  { slug: 'Claude',     label: 'Claude',     gradient: 'from-orange-400 to-orange-600',  light: 'bg-orange-50',  text: 'text-orange-700' },
];

async function getCategoryCounts() {
  const { data } = await supabase
    .from('content_web')
    .select('categorie');

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.categorie) counts[row.categorie] = (counts[row.categorie] ?? 0) + 1;
  }
  return counts;
}

export default async function WebContentPage() {
  let counts: Record<string, number> = {};
  try { counts = await getCategoryCounts(); } catch { /* Supabase not configured */ }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Web</h1>
          <p className="text-slate-500 mt-1">Ressources web organisées par thématique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CATEGORIES.map((cat) => {
          const count = counts[cat.slug] ?? 0;
          return (
            <Link key={cat.slug} href={`/web/${encodeURIComponent(cat.slug)}`} className="group block">
              <div className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`bg-gradient-to-br ${cat.gradient} p-6 flex items-center justify-center`}>
                  <Folder className="w-12 h-12 text-white/90" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-lg">{cat.label}</h3>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${cat.light} ${cat.text}`}>
                    {count} élément{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
