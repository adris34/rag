import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get('categorie');

  let query = supabase
    .from('content_web')
    .select('*')
    .order('created_at', { ascending: false });

  if (categorie) query = query.eq('categorie', categorie);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, contenu, source, tags, categorie } = body;

  if (!contenu && !url) {
    return NextResponse.json({ error: 'contenu ou url requis' }, { status: 400 });
  }

  let fetchedText = '';
  if (url) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(8000),
      });
      const html = await res.text();
      fetchedText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000);
    } catch { /* ignore */ }
  }

  const textToAnalyze = contenu || fetchedText || url || '';

  let titre_auto = '';
  let resume_auto = '';

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analyse ce contenu web et génère en JSON:
- "titre": un titre court et percutant (max 8 mots, en français)
- "resume": un résumé de 1-2 phrases maximum (en français)

${url ? `URL: ${url}\n` : ''}${textToAnalyze ? `Contenu: ${textToAnalyze.slice(0, 1500)}` : ''}

Réponds uniquement avec du JSON valide: {"titre": "...", "resume": "..."}`
      }]
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    titre_auto = parsed.titre ?? '';
    resume_auto = parsed.resume ?? '';
  } catch {
    titre_auto = source ?? url ?? contenu?.slice(0, 60) ?? '';
    resume_auto = contenu?.slice(0, 120) ?? url ?? '';
  }

  const { data, error } = await supabase
    .from('content_web')
    .insert({
      url: url || null,
      contenu: contenu || fetchedText || null,
      source: source || null,
      categorie: categorie || null,
      titre_auto,
      resume_auto,
      tags: tags ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
