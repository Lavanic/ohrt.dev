export const GUESTBOOK_URL = 'https://ohrt.atabook.org/';
export const GUESTBOOK_API = 'https://guestbook.oliver-23f.workers.dev/';

export type Reply = { time: number; html: string };
export type Message = { name: string; time: number; html: string; replies: Reply[] };

// atabook's smileys, copied into public/smileys. Hotlinked, the first one on the page
// costs a whole new connection to atabook.org, and the page load waits for it.
const SMILEYS: Record<string, [number, number]> = {
  biggrin: [15, 15],
  blush: [15, 15],
  bouncey: [19, 24],
  brushteeth: [26, 16],
  cheers: [59, 16],
  clown: [25, 22],
  confused: [15, 22],
  cool: [15, 15],
  cry: [25, 15],
  dead: [15, 15],
  eek: [15, 15],
  frown: [15, 15],
  hail: [36, 15],
  idea: [19, 19],
  kiss: [15, 15],
  laugh: [15, 15],
  look: [15, 15],
  mad: [15, 15],
  nerd: [19, 26],
  nono: [23, 18],
  notgood: [22, 21],
  perfect: [23, 18],
  quiet: [15, 15],
  rose: [19, 16],
  sleep: [33, 28],
  smile: [15, 15],
  tongue: [33, 19],
  wave: [25, 22],
  whissle: [23, 19],
  wink: [15, 15],
};

const localSmileys = (html: string) =>
  html.replace(/<img src="https:\/\/atabook\.org\/images\/smileys\/([\w-]+)\.gif"/g, (tag, name) => {
    const size = SMILEYS[name];
    return size ? `<img src="/smileys/${name}.gif" width="${size[0]}" height="${size[1]}"` : tag;
  });

export async function fetchMessages(): Promise<Message[]> {
  const res = await fetch(GUESTBOOK_API, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { messages } = (await res.json()) as { messages?: Message[] };
  if (!Array.isArray(messages)) throw new Error('no messages in the response');
  return messages.map((m) => ({
    ...m,
    html: localSmileys(m.html),
    replies: m.replies.map((r) => ({ ...r, html: localSmileys(r.html) })),
  }));
}

export function keyOf(messages: Message[]): string {
  let hash = 0;
  for (const char of JSON.stringify(messages)) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return String(hash);
}

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });
const TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });

export const when = (ms: number) => `${DATE.format(ms)} at ${TIME.format(ms)}`;
