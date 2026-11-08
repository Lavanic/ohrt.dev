// Read-only key so it's ok here... I think.
const LASTFM_KEY = '52f94a497db597d18bc7023b38097315';
const LASTFM_URL =
  'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks' +
  '&user=oliverohrt&limit=1&format=json&api_key=' +
  LASTFM_KEY;

export type Artist = { name: string; title?: string };

export async function fetchArtist(): Promise<Artist | null> {
  const res = await fetch(LASTFM_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const track = (await res.json())?.recenttracks?.track?.[0];
  const name = track?.artist?.['#text'];
  if (!name) return null;
  const playing = track['@attr']?.nowplaying === 'true';
  return {
    name,
    title: track.name ? `${playing ? 'Playing' : 'Last played'}: ${track.name}` : undefined,
  };
}

const PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';

export type Track = { title: string; artist: string; art: string | null; url: string; playing: boolean };

export async function fetchTrack(): Promise<Track> {
  const res = await fetch(LASTFM_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const t = (await res.json())?.recenttracks?.track?.[0];
  if (!t?.name) throw new Error('no tracks');
  const art: string = t.image?.find((i: { size: string }) => i.size === 'medium')?.['#text'] ?? '';
  return {
    title: t.name,
    artist: t.artist['#text'],
    art: art && !art.includes(PLACEHOLDER) ? art : null,
    url: t.url,
    playing: t['@attr']?.nowplaying === 'true',
  };
}

let pending: Promise<Track> | undefined;
export const fetchTrackOnce = () => (pending ??= fetchTrack());
