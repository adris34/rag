'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Calendar, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageItem {
  id: string;
  contact: string;
  profil_url: string;
  mon_message: string;
  reponse_recue: string;
  statut: string;
  secteur: string;
  screenshots: string[];
  analyse_ai: string;
  created_at: string;
}

const STATUTS = ['en attente', 'répondu', 'pas de réponse', 'ghosté', 'converti'];
const SECTEURS = ['Immobilier', 'Recouvrement', 'E-commerce', 'IA / Tech', 'Autre'];

const STATUT_STYLES: Record<string, string> = {
  'répondu':        'bg-green-100 text-green-700',
  'converti':       'bg-blue-100 text-blue-700',
  'en attente':     'bg-yellow-100 text-yellow-700',
  'pas de réponse': 'bg-orange-100 text-orange-700',
  'ghosté':         'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MessagesPage() {
  const [items, setItems] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<MessageItem | null>(null);
  const [form, setForm] = useState({
    contact: '', profil_url: '', mon_message: '', reponse_recue: '',
    statut: 'en attente', secteur: 'Autre',
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/content/messages');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/content/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ contact: '', profil_url: '', mon_message: '', reponse_recue: '', statut: 'en attente', secteur: 'Autre' });
    load();
  }

  const ghostCount = items.filter(i => i.statut === 'ghosté' || i.statut === 'pas de réponse').length;
  const convertedCount = items.filter(i => i.statut === 'converti').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/linkedin" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messages LinkedIn</h1>
            <p className="text-slate-500 mt-1">{items.length} conversation{items.length !== 1 ? 's' : ''} archivée{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Stats rapides */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: items.length, bg: 'bg-slate-50', text: 'text-slate-900' },
            { label: 'Ghost / Sans réponse', value: ghostCount, bg: 'bg-red-50', text: 'text-red-700' },
            { label: 'Convertis', value: convertedCount, bg: 'bg-green-50', text: 'text-green-700' },
          ].map(s => (
            <div key={s.label} className={`glass-card rounded-2xl p-5 ${s.bg}`}>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-200" />
              <div className="p-5 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus className="w-8 h-8" />
          </div>
          <p className="font-semibold">Aucun message archivé</p>
          <p className="text-sm">Stockez vos conversations pour identifier les patterns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left group"
            >
              <div className="bg-gradient-to-br from-violet-500 to-purple-700 p-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{item.contact || 'Contact'}</p>
                  {item.secteur && <p className="text-white/70 text-xs mt-0.5">{item.secteur}</p>}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white capitalize`}>
                  {item.statut}
                </span>
              </div>
              <div className="p-5 space-y-2">
                <p className="text-sm text-slate-700 font-medium line-clamp-2">
                  {item.mon_message?.slice(0, 100) || 'Message non renseigné'}
                </p>
                {item.analyse_ai && (
                  <p className="text-xs text-slate-500 line-clamp-2 italic">{item.analyse_ai}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', STATUT_STYLES[item.statut] ?? 'bg-slate-100 text-slate-600')}>
                    {item.statut}
                  </span>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">Archiver une conversation</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Contact</label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="Prénom Nom"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Secteur</label>
                  <select
                    value={form.secteur}
                    onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mon message</label>
                <textarea
                  required
                  rows={4}
                  value={form.mon_message}
                  onChange={e => setForm(f => ({ ...f, mon_message: e.target.value }))}
                  placeholder="Collez votre message envoyé..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Réponse reçue <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <textarea
                  rows={3}
                  value={form.reponse_recue}
                  onChange={e => setForm(f => ({ ...f, reponse_recue: e.target.value }))}
                  placeholder="Réponse du contact ou vide si pas de réponse..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Profil LinkedIn</label>
                  <input
                    type="url"
                    value={form.profil_url}
                    onChange={e => setForm(f => ({ ...f, profil_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-slate-500">
                <Upload className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Les screenshots seront bientôt supportés via upload direct.</p>
              </div>
              <p className="text-xs text-slate-400">Claude va analyser la conversation et générer des insights automatiquement.</p>
              <button
                type="submit"
                disabled={saving}
                className={cn('btn-primary w-full flex items-center justify-center gap-2', saving && 'opacity-60')}
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analyse en cours...</>
                ) : 'Archiver la conversation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
            <div className="bg-gradient-to-br from-violet-500 to-purple-700 p-6 rounded-t-2xl flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.contact}</h2>
                <p className="text-white/70 text-sm mt-0.5">{selected.secteur}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 ml-4">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', STATUT_STYLES[selected.statut] ?? 'bg-slate-100 text-slate-600')}>
                  {selected.statut}
                </span>
                <span className="text-xs text-slate-400 ml-auto">{formatDate(selected.created_at)}</span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mon message</p>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{selected.mon_message}</p>
                </div>
              </div>

              {selected.reponse_recue && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Réponse reçue</p>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{selected.reponse_recue}</p>
                  </div>
                </div>
              )}

              {selected.analyse_ai && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Analyse Claude</p>
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                    <p className="text-sm text-violet-900 whitespace-pre-wrap">{selected.analyse_ai}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
