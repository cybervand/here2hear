// Openverse API client. CC-licensed media aggregator (Wikimedia, Flickr,
// Freesound, Jamendo, Smithsonian, etc.).
//
// Openverse v1 requires OAuth2 client credentials. The teacher doesn't need
// to do anything: this module auto-registers a throwaway "app" on first use,
// caches the credentials + bearer token in localStorage, and refreshes the
// token when it expires (~12 h). All transparent.
//
// Docs: https://api.openverse.org/

const API_BASE = 'https://api.openverse.org/v1';

const KEY_CLIENT_ID = 'openverse-client-id';
const KEY_CLIENT_SECRET = 'openverse-client-secret';
const KEY_ACCESS_TOKEN = 'openverse-access-token';
const KEY_TOKEN_EXPIRES = 'openverse-token-expires-at';

export type OpenverseImage = {
  id: string;
  title: string;
  creator: string;
  creator_url: string;
  url: string;
  thumbnail: string;
  license: string;
  license_version: string;
  license_url: string;
  foreign_landing_url: string;
  provider: string;
};

export type OpenverseAudio = {
  id: string;
  title: string;
  creator: string;
  creator_url: string;
  url: string;
  duration: number; // milliseconds
  license: string;
  license_version: string;
  license_url: string;
  foreign_landing_url: string;
  provider: string;
};

type SearchResponse<T> = {
  result_count: number;
  page_count: number;
  page: number;
  page_size: number;
  results: T[];
};

async function ensureClientCredentials(): Promise<{ id: string; secret: string }> {
  const id = localStorage.getItem(KEY_CLIENT_ID);
  const secret = localStorage.getItem(KEY_CLIENT_SECRET);
  if (id && secret) return { id, secret };

  const res = await fetch(`${API_BASE}/auth_tokens/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `here2hear-${Math.random().toString(36).slice(2, 10)}`,
      description: 'Kindergarten classroom sound game',
      email: 'here2hear@example.invalid',
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Couldn't register with Openverse (${res.status}). Try again in a minute, or use Pixabay / Freesound instead.`,
    );
  }
  const data = (await res.json()) as { client_id: string; client_secret: string };
  localStorage.setItem(KEY_CLIENT_ID, data.client_id);
  localStorage.setItem(KEY_CLIENT_SECRET, data.client_secret);
  return { id: data.client_id, secret: data.client_secret };
}

async function getAccessToken(force = false): Promise<string> {
  const cached = localStorage.getItem(KEY_ACCESS_TOKEN);
  const expires = Number(localStorage.getItem(KEY_TOKEN_EXPIRES) ?? 0);
  // Reuse if it's good for at least another minute.
  if (!force && cached && expires - 60_000 > Date.now()) return cached;

  const { id, secret } = await ensureClientCredentials();
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret,
  });
  const res = await fetch(`${API_BASE}/auth_tokens/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(
      `Couldn't get an Openverse token (${res.status}). Try again, or use Pixabay / Freesound.`,
    );
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  const expiresAt = Date.now() + data.expires_in * 1000;
  localStorage.setItem(KEY_ACCESS_TOKEN, data.access_token);
  localStorage.setItem(KEY_TOKEN_EXPIRES, String(expiresAt));
  return data.access_token;
}

async function authedFetch(url: URL): Promise<Response> {
  let token = await getAccessToken();
  let res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Token may have been revoked server-side. Force-refresh once.
  if (res.status === 401) {
    token = await getAccessToken(true);
    res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return res;
}

export async function searchImages(query: string): Promise<OpenverseImage[]> {
  const url = new URL(`${API_BASE}/images/`);
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '24');
  const res = await authedFetch(url);
  if (res.status === 429)
    throw new Error('Openverse rate limit hit — try again in a minute.');
  if (!res.ok) throw new Error(`Openverse search failed: ${res.status}`);
  const data: SearchResponse<OpenverseImage> = await res.json();
  return data.results ?? [];
}

export async function searchAudio(query: string): Promise<OpenverseAudio[]> {
  const url = new URL(`${API_BASE}/audio/`);
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '20');
  const res = await authedFetch(url);
  if (res.status === 429)
    throw new Error('Openverse rate limit hit — try again in a minute.');
  if (!res.ok) throw new Error(`Openverse search failed: ${res.status}`);
  const data: SearchResponse<OpenverseAudio> = await res.json();
  return data.results ?? [];
}

export async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
  return res.blob();
}

export function shortLicense(license: string): string {
  if (license === 'cc0') return 'CC0';
  if (license === 'pdm') return 'Public Domain';
  if (license === 'by') return 'CC BY';
  if (license === 'by-sa') return 'CC BY-SA';
  if (license === 'by-nc') return 'CC BY-NC';
  if (license === 'by-nc-sa') return 'CC BY-NC-SA';
  if (license === 'by-nd') return 'CC BY-ND';
  if (license === 'sampling+') return 'Sampling+';
  return license.toUpperCase();
}

export function formatDurationMs(ms: number): string {
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
