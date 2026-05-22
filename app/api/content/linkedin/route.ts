import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import { fetchAndParse } from '@/lib/fetch-content';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get('categorie');

  let query = supabase
    .from('content_linkedin')
    .select('*')
    .order('created_at', { ascending: false });

  if (categorie) query = query.eq('categorie', categorie);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { contenu, categorie, statut, tags, url_source } = body;

  if (!contenu && !url_source) {
    return NextResponse.json({ error: 'contenu ou url_source requis' }, { status: 400 });
  }
  if (!categorie) {
    return NextResponse.json({ error: 'categorie requise' }, { status: 400 });
  }

  let fetchedMarkdown = '';
  let fetchedPlain = '';
  let images: string[] = [];

  if (url_source) {
    const fetched = await fetchAndParse(url_source);
    fetchedMarkdown = fetched.markdown;
    fetchedPlain = fetched.plainText;
    images = fetched.images;
  }

  const textToAnalyze = contenu || fetchedPlain || url_source || '';

  let titre_auto = '';
  let resume_auto = '';

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analyse ce contenu LinkedIn et génère en JSON:
- "titre": un titre court et percutant (max 8 mots, en français)
- "resume": un résumé de 1-2 phrases maximum (en français)

${url_source ? `URL du post: ${url_source}\n` : ''}${textToAnalyze ? `Contenu: ${textToAnalyze.slice(0, 1500)}` : ''}

Réponds uniquement avec du JSON valide: {"titre": "...", "resume": "..."}`
      }]
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    titre_auto = parsed.titre ?? '';
    resume_auto = parsed.resume ?? '';
  } catch {
    titre_auto = contenu?.slice(0, 60) ?? url_source ?? '';
    resume_auto = contenu?.slice(0, 120) ?? '';
  }

  const { data, error } = await supabase
    .from('content_linkedin')
    .insert({
      contenu: contenu || fetchedPlain || null,
      contenu_md: contenu || fetchedMarkdown || null,
      images: images.length > 0 ? images : null,
      categorie,
      url_source: url_source || null,
      titre_auto,
      resume_auto,
      statut: statut ?? 'à recycler',
      tags: tags ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
