import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';

const BUCKET = 'documents';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tags = formData.get('tags') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Seuls les PDFs sont acceptés' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extraire le texte du PDF (import dynamique pour éviter les erreurs webpack)
    let extractedText = '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const pdfData = await pdfParse(buffer);
      extractedText = (pdfData.text as string).slice(0, 8000);
    } catch (pdfErr) {
      console.error('[upload] pdf-parse error:', pdfErr);
      extractedText = `[Contenu PDF : ${file.name}]`;
    }

    // 2. Upload vers Supabase Storage
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    let fileUrl: string | null = null;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      console.error('[upload] storage error:', uploadError);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      fileUrl = urlData.publicUrl;
    }

    // 3. Générer titre + résumé avec Claude
    let titre_auto = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
    let resume_auto = '';

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Analyse ce document PDF et génère en JSON:
- "titre": un titre court et percutant (max 8 mots, en français)
- "resume": un résumé de 1-2 phrases maximum (en français)

Contenu: ${extractedText.slice(0, 1500)}

Réponds uniquement avec du JSON valide: {"titre": "...", "resume": "..."}`
        }]
      });
      const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      titre_auto = parsed.titre ?? titre_auto;
      resume_auto = parsed.resume ?? '';
    } catch { /* garde le nom de fichier */ }

    // 4. Sauvegarder dans content_a_tester
    const parsedTags = tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

    const { data, error } = await supabase
      .from('content_a_tester')
      .insert({
        url_source: fileUrl,
        contenu: extractedText,
        contenu_md: extractedText,
        source_type: 'pdf',
        titre_auto,
        resume_auto,
        tags: parsedTags,
        file_url: fileUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });

  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
