'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentModal } from '@/app/components/ContentModal';

interface ContentItem {
  id: string;
  contenu: string;
  contenu_md?: string;
  images?: string[];
  url_source: string;
  titre_auto: string;
  resume_auto: string;
  statut: string;
  tags: string[];
  created_at: string;
  categorie: string;
}

const CATEGORY_STYLES: Record<string, { gradient: string; badge: string; badgeText: string }> = {
  'Publicité':  { gradient: 'from-blue-400 to-blue-600',      badge: 'bg-blue-100',    badgeText: 'text-blue-700' },
  'E-commerce': { gradient: 'from-emerald-400 to-emerald-600', badge: 'bg-emerald-100', badgeText: 'text-emerald-700' },
  'IA':         { gradient: 'from-violet-400 to-violet-600',   badge: 'bg-violet-100',  badgeText: 'text-violet-700' },
  'Claude':     { gradient: 'from-orange-400 to-orange-600',   badge: 'bg-orange-100',  badgeText: 'text-orange-700' },
};

const STATUTS = ['à recycler', 'brouillon', 'publié'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CategorieContentPage({ params }: { params: Promise<{ categorie: string }> }) {
  const { categorie: rawCategorie } = React.use(params);
  const categorie = decodeURIComponent(rawCategorie);
  const style = CATEGORY_STYLES[categorie] ?? CATEGORY_STYLES['Publicité'];

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<ContentItem | null>(null);

  const [form, setForm] = useState({ url_source: '', contenu: '', statut: 'à recycler', tags: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/linkedin?categorie=${encodeURIComponent(categorie)}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    setLoading(false);
  }, [categorie]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/content/linkedin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url_source: form.url_source || undefined,
        contenu: form.contenu || undefined,
        categorie,
        statut: form.statut,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ url_source: '', contenu: '', statut: 'à recycler', tags: '' });
    load();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/linkedin" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{categorie}</h1>
            <p className="text-slate-500 mt-1">{items.length} élément{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-200" />
              <div className="p-5 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus className="w-8 h-8" />
          </div>
          <p className="font-semibold">Aucun contenu dans ce dossier</p>
          <p className="text-sm">Cliquez sur &ldquo;Ajouter&rdquo; pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left group"
            >
              <div className={`bg-gradient-to-br ${style.gradient} p-5 flex items-center justify-between`}>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
                  {item.statut}
                </span>
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
                  {item.titre_auto || item.contenu.slice(0, 60)}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {item.resume_auto || item.contenu.slice(0, 100)}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-1 flex-wrap">
                    {item.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge} ${style.badgeText}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Ajouter du contenu — {categorie}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">URL du post LinkedIn <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <input
                  type="url"
                  value={form.url_source}
                  onChange={e => setForm(f => ({ ...f, url_source: e.target.value }))}
                  placeholder="https://www.linkedin.com/posts/..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contenu <span className="text-slate-400 font-normal">(optionnel si URL fournie)</span></label>
                <textarea
                  rows={5}
                  value={form.contenu}
                  onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                  placeholder="Collez le texte du post ici, ou laissez vide si vous avez mis l'URL..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">Claude va analyser et générer un titre + résumé automatiquement.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Statut</label>
                  <select
                    value={form.statut}
                    onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Tags
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="hook, viral, cta"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || (!form.contenu && !form.url_source)}
                className={cn('btn-primary w-full flex items-center justify-center gap-2', saving && 'opacity-60')}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyse en cours...
                  </>
                ) : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <ContentModal
          item={selected}
          gradient={style.gradient}
          badge={style.badge}
          badgeText={style.badgeText}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
