import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
    return text;
  } catch {
    return '';
  }
}

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

  let fetchedText = '';
  if (url_source) {
    fetchedText = await fetchUrlContent(url_source);
  }

  const textToAnalyze = contenu || fetchedText || url_source || '';

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
      contenu: contenu || fetchedText || null,
      source_type,
      titre_auto,
      resume_auto,
      tags: tags ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
