import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import { fetchAndParse } from '@/lib/fetch-content';

function detectSourceType(url?: string): string {
  if (!url) return 'autre';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'web';
}

export async function GET() {
  const { data, error } = await supabase
    .from('content_a_tester')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url_source, contenu, tags } = body;

  if (!url_source && !contenu) {
    return NextResponse.json({ error: 'url_source ou contenu requis' }, { status: 400 });
  }

  const source_type = detectSourceType(url_source);

  let fetchedMarkdown = '';
  let fetchedPlain = '';
  let images: string[] = [];
  let likes: number | undefined;
  let commentsCount: number | undefined;

  if (url_source) {
    const fetched = await fetchAndParse(url_source);
    fetchedMarkdown = fetched.markdown;
    fetchedPlain = fetched.plainText;
    images = fetched.images;
    likes = fetched.likes;
    commentsCount = fetched.commentsCount;
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
        content: `Analyse ce contenu et génère en JSON:
- "titre": un titre court et percutant (max 8 mots, en français)
- "resume": un résumé de 1-2 phrases maximum (en français)

${url_source ? `URL: ${url_source}\n` : ''}${textToAnalyze ? `Contenu: ${textToAnalyze.slice(0, 1500)}` : ''}

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
    .from('content_a_tester')
    .insert({
      url_source: url_source || null,
      contenu: contenu || fetchedPlain || null,
      contenu_md: contenu || fetchedMarkdown || null,
      images: images.length > 0 ? images : null,
      source_type,
      titre_auto,
      resume_auto,
      tags: tags ?? [],
      likes: likes ?? null,
      comments_count: commentsCount ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, contenu, contenu_md, file_url, titre_auto, resume_auto } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (contenu !== undefined) updates.contenu = contenu;
  if (contenu_md !== undefined) updates.contenu_md = contenu_md;
  if (file_url !== undefined) updates.file_url = file_url;
  if (titre_auto !== undefined) updates.titre_auto = titre_auto;
  if (resume_auto !== undefined) updates.resume_auto = resume_auto;

  const { data, error } = await supabase
    .from('content_a_tester')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await supabase.from('content_a_tester').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
