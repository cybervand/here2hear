// Openverse API client. CC-licensed media aggregator (Wikimedia, Flickr,
// Freesound, Jamendo, Smithsonian, etc.). Anonymous access works without a
// key — registered apps get higher rate limits, but for a single classroom
// the anonymous tier is plenty.
//
// Docs: https://api.openverse.org/

const API_BASE = 'https://api.openverse.org/v1';

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

export async function searchImages(query: string): Promise<OpenverseImage[]> {
  const url = new URL(`${API_BASE}/images/`);
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '24');
  const res = await fetch(url.toString());
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
  const res = await fetch(url.toString());
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
