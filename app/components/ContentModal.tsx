'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, ExternalLink, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface ContentModalProps {
  item: {
    titre_auto?: string;
    resume_auto?: string;
    contenu?: string;
    contenu_md?: string;
    images?: string[];
    url_source?: string;
    url?: string;
    tags?: string[];
    created_at: string;
    statut?: string;
  };
  gradient: string;
  badge: string;
  badgeText: string;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ContentModal({ item, gradient, badge, badgeText, onClose }: ContentModalProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const images = item.images ?? [];
  const content = item.contenu_md || item.contenu || '';
  const url = item.url_source || item.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-br ${gradient} p-6 rounded-t-2xl flex items-start justify-between flex-shrink-0`}>
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-white leading-snug">{item.titre_auto}</h2>
            <p className="text-white/80 text-sm mt-1 line-clamp-2">{item.resume_auto}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 flex-shrink-0">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Image gallery */}
          {images.length > 0 && (
            <div className="relative bg-slate-900">
              <img
                src={images[imgIndex]}
                alt=""
                className="w-full object-cover max-h-72"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                    disabled={imgIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                    disabled={imgIndex === images.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setImgIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                  <span className="absolute top-2 right-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                    {imgIndex + 1}/{images.length}
                  </span>
                </>
              )}
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.statut && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge} ${badgeText}`}>{item.statut}</span>
              )}
              {item.tags?.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{tag}</span>
              ))}
              <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(item.created_at)}
              </span>
            </div>

            {/* URL */}
            {url && (
              <a href={url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline truncate">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            )}

            {/* Content */}
            {content && (
              <div className="bg-slate-50 rounded-xl p-5 prose prose-sm max-w-none
                prose-headings:text-slate-900 prose-headings:font-bold
                prose-h2:text-lg prose-h3:text-base
                prose-p:text-slate-700 prose-p:leading-relaxed
                prose-strong:text-slate-900
                prose-li:text-slate-700
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
