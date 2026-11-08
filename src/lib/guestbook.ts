export const GUESTBOOK_URL = 'https://ohrt.atabook.org/';
export const GUESTBOOK_API = 'https://guestbook.oliver-23f.workers.dev/';

export type Reply = { time: number; html: string };
export type Message = { name: string; time: number; html: string; replies: Reply[] };

export async function fetchMessages(): Promise<Message[]> {
  const res = await fetch(GUESTBOOK_API, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { messages } = (await res.json()) as { messages?: Message[] };
  if (!Array.isArray(messages)) throw new Error('no messages in the response');
  return messages;
}

export function keyOf(messages: Message[]): string {
  let hash = 0;
  for (const char of JSON.stringify(messages)) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return String(hash);
}

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });
const TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });

export const when = (ms: number) => `${DATE.format(ms)} at ${TIME.format(ms)}`;
