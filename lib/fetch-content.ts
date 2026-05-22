export interface FetchedContent {
  markdown: string;
  plainText: string;
  images: string[];
}

export async function fetchAndParse(url: string): Promise<FetchedContent> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return parseHtml(html, url);
  } catch {
    return { markdown: '', plainText: '', images: [] };
  }
}

function parseHtml(html: string, _url: string): FetchedContent {
  // Extract large content images (skip icons/avatars < 200px wide)
  const imgRegex = /src="(https:\/\/[^"]+)"/g;
  const images: string[] = [];
  const seenImgs = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[1];
    // Keep large images: CDN content images, skip small ones (w_40, w_36, etc.)
    const isSmall = /[,_]w_(\d+)/.test(src) && parseInt(src.match(/[,_]w_(\d+)/)?.[1] ?? '9999') < 200;
    const isIcon = /favicon|icon|logo|avatar|profile|badge/i.test(src);
    const isLargeContent = src.includes('w_1456') || src.includes('w_1200') || src.includes('w_800');
    if (!isSmall && !isIcon && !seenImgs.has(src) && (isLargeContent || (!src.includes('w_') && isImageUrl(src)))) {
      images.push(src);
      seenImgs.add(src);
    }
  }

  // Convert HTML to markdown
  let md = html;

  // Remove unwanted blocks
  md = md.replace(/<script[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[\s\S]*?<\/style>/gi, '');
  md = md.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  md = md.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  md = md.replace(/<header[\s\S]*?<\/header>/gi, '');

  // Convert structure to markdown
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n# ${stripTags(c)}\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n## ${stripTags(c)}\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n### ${stripTags(c)}\n`);
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n#### ${stripTags(c)}\n`);
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, c) => `**${stripTags(c)}**`);
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, c) => `**${stripTags(c)}**`);
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, c) => `*${stripTags(c)}*`);
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_, c) => `*${stripTags(c)}*`);
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${stripTags(text)}](${href})`);
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `\n• ${stripTags(c)}`);
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `\n${stripTags(c)}\n`);
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => `\n> ${stripTags(c)}\n`);
  md = md.replace(/<hr[^>]*>/gi, '\n---\n');

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeEntities(md);

  // Clean up whitespace
  md = md.replace(/\n{4,}/g, '\n\n\n').trim();

  // Limit size
  md = md.slice(0, 8000);

  const plainText = md.replace(/[#*>\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 3000);

  return { markdown: md, plainText, images: images.slice(0, 15) };
}

function stripTags(str: string): string {
  return str.replace(/<[^>]+>/g, '').trim();
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif|avif)(\?|$)/i.test(url);
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}
