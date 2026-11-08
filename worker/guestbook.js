const BOOK = 'https://ohrt.atabook.org/';
const SITE = 'https://ohrt.dev';
const FRESH_FOR = 60_000;

const SMILEY = /^https:\/\/atabook\.org\/images\/smileys\/[\w-]+\.(?:gif|png)$/;
const LINK = /^https?:\/\/[^\s"'<>]+$/;
const STYLE = /^(?:\s*(?:color|font-family|font-size)\s*:\s*[\w\s#,'%.-]+;?)*\s*$/;
const PLAIN = /^[\w\s#,'%.-]*$/;
const KEEP = new Set(['b', 'strong', 'i', 'em', 'u', 's']);
const DROP = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'template',
  'noscript',
  'textarea',
  'title',
  'select',
  'xmp',
  'plaintext',
  'noembed',
  'noframes',
]);

const text = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => s.replace(/&(?!#?\w+;)/g, '&amp;');

async function readPage(n) {
  const res = await fetch(n === 1 ? BOOK : `${BOOK}?page=${n}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`atabook answered ${res.status}`);

  const messages = [];
  let message = null;
  let sink = null;
  let skip = 0;
  let pages = '';

  const write = {
    element(el) {
      const tag = el.tagName;
      if (DROP.has(tag)) {
        skip++;
        el.onEndTag(() => skip--);
        return;
      }
      if (skip || !sink) return;
      if (tag === 'br') {
        sink.html += '<br>';
      } else if (KEEP.has(tag)) {
        sink.html += `<${tag}>`;
        el.onEndTag(() => (sink.html += `</${tag}>`));
      } else if (tag === 'a') {
        const href = el.getAttribute('href');
        sink.html +=
          href && LINK.test(href) ? `<a href="${attr(href)}" target="_blank" rel="noopener nofollow">` : '<a>';
        el.onEndTag(() => (sink.html += '</a>'));
      } else if (tag === 'img') {
        const src = el.getAttribute('src');
        const alt = text((el.getAttribute('alt') ?? '').replace(/["&]/g, ''));
        sink.html += src && SMILEY.test(src) ? `<img src="${src}" alt="${alt}">` : alt;
      } else if (tag === 'span' || tag === 'font') {
        const style = el.getAttribute('style');
        const kept =
          style && STYLE.test(style)
            ? ` style="${style}"`
            : ['color', 'face', 'size']
                .map((k) => [k, el.getAttribute(k)])
                .filter(([, v]) => v && PLAIN.test(v))
                .map(([k, v]) => ` ${k}="${v}"`)
                .join('');
        sink.html += `<${tag}${kept}>`;
        el.onEndTag(() => (sink.html += `</${tag}>`));
      }
    },
    text(t) {
      if (sink && !skip) sink.html += text(t.text);
    },
  };

  const into = (target) => ({
    element(el) {
      sink = target();
      el.onEndTag(() => (sink = null));
    },
  });

  await new HTMLRewriter()
    .on('.box.message', {
      element() {
        message = { name: '', time: 0, html: '', replies: [] };
        messages.push(message);
      },
    })
    .on('.box.message .split > strong', { text: (t) => void (message.name += text(t.text)) })
    .on('.box.message .message-time', { element: (el) => void (message.time = Number(el.getAttribute('data-time'))) })
    .on(
      '.box.message .message-content > p.message-text',
      into(() => message),
    )
    .on('.box.message .reply', {
      element() {
        message.replies.push({ time: 0, html: '' });
      },
    })
    .on('.box.message .reply .message-reply-time', {
      element: (el) => void (message.replies.at(-1).time = Number(el.getAttribute('data-time'))),
    })
    .on(
      '.box.message .reply > p.message-text',
      into(() => message.replies.at(-1)),
    )
    .on('p.message-text *', { element: write.element })
    .on('p.message-text', { text: write.text })
    .on('.pages', { text: (t) => void (pages += t.text) })
    .transform(res)
    .arrayBuffer();

  const [, count = 1, total = 0] = pages.match(/Page \d+ of (\d+) \((\d+) messages?\)/) ?? [];
  return { messages, count: Number(count), total: Number(total), empty: /No messages yet/.test(pages) };
}

async function readBook() {
  const first = await readPage(1);
  const rest = await Promise.all(Array.from({ length: first.count - 1 }, (_, i) => readPage(i + 2)));
  const messages = [first, ...rest].flatMap((p) => p.messages);
  if (!first.empty && (messages.length === 0 || messages.length !== first.total)) {
    throw new Error(`read ${messages.length} messages but the book says ${first.total}`);
  }
  if (messages.some((m) => !m.time || !m.name)) throw new Error('a message is missing its name or time');
  return JSON.stringify({ messages });
}

let cache = null;

export default {
  async fetch() {
    const headers = {
      'Access-Control-Allow-Origin': SITE,
      'Cache-Control': 'public, max-age=60',
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (cache && Date.now() - cache.at < FRESH_FOR) return new Response(cache.body, { headers });
    try {
      cache = { at: Date.now(), body: await readBook() };
      return new Response(cache.body, { headers });
    } catch (err) {
      if (cache) return new Response(cache.body, { headers: { ...headers, 'X-Stale': String(err) } });
      return new Response(JSON.stringify({ error: String(err) }), { status: 502, headers });
    }
  },
};
