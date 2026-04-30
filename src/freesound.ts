// Freesound.org API client. Token-based read-only access — enough for searching
// and fetching preview MP3s. The key is stored in localStorage; for a classroom
// app where the teacher controls the device this is fine, but it would not be
// safe to ship publicly without a proxy.

const API_BASE = 'https://freesound.org/apiv2';
const KEY_API = 'freesound-api-key';
const KEY_CLIENT_ID = 'freesound-client-id';

export type FreesoundCredentials = {
  clientId: string;
  apiKey: string;
};

export type FreesoundResult = {
  id: number;
  name: string;
  username: string;
  duration: number;
  license: string;
  url: string;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
    'preview-hq-ogg'?: string;
    'preview-lq-ogg'?: string;
  };
};

type SearchResponse = {
  count: number;
  results: FreesoundResult[];
};

export function getApiKey(): string {
  return localStorage.getItem(KEY_API) ?? '';
}

export function getCredentials(): FreesoundCredentials {
  return {
    clientId: localStorage.getItem(KEY_CLIENT_ID) ?? '',
    apiKey: localStorage.getItem(KEY_API) ?? '',
  };
}

export function setCredentials(c: FreesoundCredentials) {
  if (c.clientId) localStorage.setItem(KEY_CLIENT_ID, c.clientId);
  else localStorage.removeItem(KEY_CLIENT_ID);
  if (c.apiKey) localStorage.setItem(KEY_API, c.apiKey);
  else localStorage.removeItem(KEY_API);
}

export async function searchFreesound(
  query: string,
  apiKey: string,
): Promise<FreesoundResult[]> {
  const url = new URL(`${API_BASE}/search/text/`);
  url.searchParams.set('query', query);
  url.searchParams.set('fields', 'id,name,username,duration,license,url,previews');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('sort', 'rating_desc');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Token ${apiKey}` },
  });
  if (res.status === 401) throw new Error('Invalid API key — check your Freesound key.');
  if (!res.ok) throw new Error(`Freesound search failed: ${res.status}`);
  const data: SearchResponse = await res.json();
  return data.results ?? [];
}

export async function fetchPreviewBlob(previewUrl: string): Promise<Blob> {
  const res = await fetch(previewUrl);
  if (!res.ok) throw new Error(`Failed to fetch preview audio: ${res.status}`);
  return res.blob();
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function shortLicense(license: string): string {
  // Licenses come as URLs like https://creativecommons.org/publicdomain/zero/1.0/
  if (license.includes('publicdomain/zero')) return 'CC0';
  if (license.includes('by-nc')) return 'CC BY-NC';
  if (license.includes('by-sa')) return 'CC BY-SA';
  if (license.includes('/by/')) return 'CC BY';
  if (license.includes('sampling')) return 'Sampling+';
  return 'CC';
}
