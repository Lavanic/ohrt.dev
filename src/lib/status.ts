const GIST_ID = '2a189096280e2c8785263bbb97c2bbb8';

export const STATUS_URL = `https://gist.github.com/Lavanic/${GIST_ID}`;
export const STATUS_VIA = 'gist';

export type Status = { face: string; content: string; updatedAt: string };

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
] as const;

export function timeAgo(iso: string): string {
  const seconds = (Date.now() - Date.parse(iso)) / 1000;
  for (const [unit, size] of UNITS) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

let pending: Promise<Status> | undefined;

export function fetchStatus(token?: string): Promise<Status> {
  pending ??= fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((gist) => {
      const data = JSON.parse(gist.files['status.json'].content);
      if (!data.content) throw new Error('empty status');
      return { face: data.face, content: data.content, updatedAt: gist.history[0].committed_at };
    });
  return pending;
}
