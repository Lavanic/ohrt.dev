export const GUESTBOOK_URL = 'https://ohrt.atabook.org/';

export type Reply = { time: number; html: string };
export type Message = { name: string; time: number; html: string; replies: Reply[] };

const SMILEY = /^https:\/\/atabook\.org\/images\/smileys\/[\w-]+\.(?:gif|png)$/;
const LINK = /^https?:\/\/[^\s"'<>]+$/;
const STYLE = /^(?:\s*(?:color|font-family|font-size)\s*:\s*[\w\s#,'%.-]+;?)*\s*$/;
const PLAIN = /^[\w\s#,'%.-]*$/;

function attr(attrs: string, name: string): string | undefined {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

function clean(html: string): string {
  return html.replace(/<(\/?)([a-z0-9]+)([^>]*)>|[<>]/gi, (tag, slash, name, attrs) => {
    if (!name) return tag === '<' ? '&lt;' : '&gt;';
    const t = name.toLowerCase();
    const closing = slash === '/';
    if (['b', 'strong', 'i', 'em', 'u', 's', 'br'].includes(t)) return closing ? `</${t}>` : `<${t}>`;
    if (t === 'a') {
      if (closing) return '</a>';
      const href = attr(attrs, 'href');
      return href && LINK.test(href) ? `<a href="${href}" target="_blank" rel="noopener nofollow">` : '<a>';
    }
    if (t === 'img') {
      const src = attr(attrs, 'src');
      const alt = (attr(attrs, 'alt') ?? '').replace(/[<>"]/g, '');
      return src && SMILEY.test(src) ? `<img src="${src}" alt="${alt}">` : alt;
    }
    if (t === 'span' || t === 'font') {
      if (closing) return `</${t}>`;
      const style = attr(attrs, 'style');
      if (style && STYLE.test(style)) return `<${t} style="${style}">`;
      const kept = ['color', 'face', 'size']
        .map((k) => [k, attr(attrs, k)] as const)
        .filter(([, v]) => v && PLAIN.test(v))
        .map(([k, v]) => ` ${k}="${v}"`)
        .join('');
      return `<${t}${kept}>`;
    }
    return '';
  });
}

function parseMessages(page: string): Message[] {
  const messages: Message[] = [];
  for (const [block] of page.matchAll(
    /<div class="box message">[\s\S]*?(?=<div class="box message">|<script|<\/div>\s*<div id="footer")/g,
  )) {
    const head = block.match(
      /<div class="split">\s*<strong>([\s\S]*?)<\/strong>\s*<span class="message-time" data-time="(\d+)"/,
    );
    const text = block.match(/<p class="message-text">([\s\S]*?)<\/p>/);
    if (!head || !text) continue;
    const replies: Reply[] = [];
    for (const r of block.matchAll(
      /<div class="reply">\s*<b>[^<]*<span class="message-reply-time" data-time="(\d+)">[\s\S]*?<p class="message-text">([\s\S]*?)<\/p>/g,
    )) {
      replies.push({ time: Number(r[1]), html: clean(r[2]) });
    }
    messages.push({ name: clean(head[1]), time: Number(head[2]), html: clean(text[1]), replies });
  }
  return messages;
}

async function fetchPage(n: number): Promise<string> {
  const res = await fetch(n === 1 ? GUESTBOOK_URL : `${GUESTBOOK_URL}?page=${n}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function fetchMessages(): Promise<Message[]> {
  const first = await fetchPage(1);
  const pages = Number(first.match(/Page 1 of (\d+)/)?.[1] ?? 1);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2)));
  return [first, ...rest].flatMap(parseMessages);
}

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });
const TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });

export const when = (ms: number) => `${DATE.format(ms)} at ${TIME.format(ms)}`;
