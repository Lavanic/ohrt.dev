// Read-only key so it's ok here... I think.
const LASTFM_KEY = '52f94a497db597d18bc7023b38097315';
const LASTFM_URL =
  'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks' +
  '&user=oliverohrt&limit=1&format=json&api_key=' +
  LASTFM_KEY;

export type Track = {
  title: string;
  artist: string;
  url: string;
  playing: boolean;
  at: number | null;
};

const RECENT_URL = LASTFM_URL.replace('&limit=1', '&limit=3');

type RawTrack = {
  name: string;
  url: string;
  artist: { '#text': string };
  date?: { uts: string };
  '@attr'?: { nowplaying?: string };
};

export async function fetchTracks(): Promise<Track[]> {
  const res = await fetch(RECENT_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: RawTrack[] = (await res.json())?.recenttracks?.track ?? [];
  if (!raw[0]?.name) throw new Error('no tracks');
  return raw.slice(0, 3).map((t) => ({
    title: t.name,
    artist: t.artist['#text'],
    url: t.url,
    playing: t['@attr']?.nowplaying === 'true',
    at: t.date?.uts ? Number(t.date.uts) * 1000 : null,
  }));
}

const LIVE_FOR = 15 * 60 * 1000;
const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' });

export function heading(track: Pick<Track, 'playing' | 'at'>, now = Date.now()) {
  const live = track.playing || (track.at !== null && now - track.at <= LIVE_FOR);
  if (live) return { live, label: 'Now Playing', state: '▶ live' };
  return { live, label: 'Recently Played', state: track.at === null ? '' : DAY.format(track.at) };
}

let pending: Promise<Track[]> | undefined;
export const fetchTracksOnce = () => (pending ??= fetchTracks());
