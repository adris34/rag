'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, ExternalLink, Calendar, Globe, FileText, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TesterItem {
  id: string;
  url_source: string;
  contenu: string;
  source_type: string;
  titre_auto: string;
  resume_auto: string;
  tags: string[];
  created_at: string;
}

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ElementType; gradient: string; badge: string; badgeText: string }> = {
  linkedin: { label: 'LinkedIn', icon: Link2,    gradient: 'from-blue-500 to-blue-700', badge: 'bg-blue-100', badgeText: 'text-blue-700' },
  web:      { label: 'Web',      icon: Globe,    gradient: 'from-emerald-400 to-teal-600', badge: 'bg-emerald-100', badgeText: 'text-emerald-700' },
  autre:    { label: 'Texte',    icon: FileText, gradient: 'from-slate-400 to-slate-600', badge: 'bg-slate-100', badgeText: 'text-slate-700' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ATesterPage() {
  const [items, setItems] = useState<TesterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<TesterItem | null>(null);
  const [form, setForm] = useState({ url_source: '', contenu: '', tags: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/content/a-tester');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/content/a-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url_source: form.url_source || undefined,
        contenu: form.contenu || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ url_source: '', contenu: '', tags: '' });
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/linkedin" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">À tester</h1>
            <p className="text-slate-500 mt-1">{items.length} élément{items.length !== 1 ? 's' : ''} — toutes sources</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-200" />
              <div className="p-5 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
            <Plus className="w-8 h-8 text-rose-400" />
          </div>
          <p className="font-semibold">Rien à tester pour l&apos;instant</p>
          <p className="text-sm">Collez une URL LinkedIn, un article, ou du texte libre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const src = SOURCE_CONFIG[item.source_type] ?? SOURCE_CONFIG.autre;
            const Icon = src.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left group"
              >
                <div className={`bg-gradient-to-br ${src.gradient} p-5 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white/80" />
                    <span className="text-xs font-bold text-white">{src.label}</span>
                  </div>
                  {item.url_source && (
                    <a
                      href={item.url_source}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </a>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">
                    {item.titre_auto || item.contenu?.slice(0, 60) || item.url_source}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {item.resume_auto || item.contenu?.slice(0, 100)}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-1 flex-wrap">
                      {item.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${src.badge} ${src.badgeText}`}>{tag}</span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ajouter dans À tester</h2>
                <p className="text-sm text-slate-400 mt-0.5">Post LinkedIn, article web, ou texte libre</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">URL <span className="text-slate-400 font-normal">(LinkedIn, article, vidéo...)</span></label>
                <input
                  type="url"
                  value={form.url_source}
                  onChange={e => setForm(f => ({ ...f, url_source: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">ou</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Texte libre</label>
                <textarea
                  rows={4}
                  value={form.contenu}
                  onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                  placeholder="Collez du texte, une idée, un extrait..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="hook, storytelling, cta"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <p className="text-xs text-slate-400">Claude va détecter la source et générer un titre + résumé automatiquement.</p>
              <button
                type="submit"
                disabled={saving || (!form.url_source && !form.contenu)}
                className={cn('btn-primary w-full flex items-center justify-center gap-2', saving && 'opacity-60')}
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analyse en cours...</>
                ) : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (() => {
        const src = SOURCE_CONFIG[selected.source_type] ?? SOURCE_CONFIG.autre;
        const Icon = src.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
              <div className={`bg-gradient-to-br ${src.gradient} p-6 rounded-t-2xl flex items-start justify-between`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-white/80" />
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wide">{src.label}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white leading-snug">{selected.titre_auto}</h2>
                  <p className="text-white/80 text-sm mt-1">{selected.resume_auto}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 ml-4 flex-shrink-0">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {selected.url_source && (
                  <a href={selected.url_source} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="w-4 h-4" /> {selected.url_source}
                  </a>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.tags?.map(tag => (
                    <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${src.badge} ${src.badgeText}`}>{tag}</span>
                  ))}
                  <span className="text-xs text-slate-400 ml-auto">{formatDate(selected.created_at)}</span>
                </div>
                {selected.contenu && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{selected.contenu}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
