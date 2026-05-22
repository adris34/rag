import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';

export async function GET() {
  const { data, error } = await supabase
    .from('messages_analysis')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { contact, profil_url, mon_message, reponse_recue, statut, secteur, screenshots } = body;

  let analyse_ai = '';

  if (mon_message) {
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Analyse cette conversation LinkedIn de prospection et génère une analyse courte en JSON:
- "analyse": 2-3 phrases sur pourquoi ça a bien/mal fonctionné et ce qu'on peut en apprendre

Mon message: ${mon_message}
${reponse_recue ? `Réponse reçue: ${reponse_recue}` : 'Pas de réponse reçue.'}
Statut: ${statut ?? 'inconnu'}

Réponds uniquement avec du JSON valide: {"analyse_ai": "..."}`
        }]
      });

      const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      analyse_ai = parsed.analyse_ai ?? '';
    } catch {
      analyse_ai = '';
    }
  }

  const { data, error } = await supabase
    .from('messages_analysis')
    .insert({ contact, profil_url, mon_message, reponse_recue, statut: statut ?? 'en attente', secteur, screenshots: screenshots ?? [], analyse_ai })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
