// Pixabay API client. Free tier; key is stored in localStorage. Same caveat
// as Freesound: fine for a single-classroom app where the teacher controls
// the device, but a public deployment would need a proxy to hide the key.

const API_BASE = 'https://pixabay.com/api/';
const KEY_API = 'pixabay-api-key';

export type PixabayResult = {
  id: number;
  pageURL: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  user: string;
  user_id: number;
};

type SearchResponse = {
  total: number;
  totalHits: number;
  hits: PixabayResult[];
};

export function getApiKey(): string {
  return localStorage.getItem(KEY_API) ?? '';
}

export function setApiKey(key: string) {
  if (key) localStorage.setItem(KEY_API, key);
  else localStorage.removeItem(KEY_API);
}

export async function searchPixabay(
  query: string,
  apiKey: string,
): Promise<PixabayResult[]> {
  const url = new URL(API_BASE);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('q', query);
  // Mix photos + illustrations + vectors. Illustrations are often friendlier
  // for kindergarteners than photo-realistic content.
  url.searchParams.set('image_type', 'all');
  url.searchParams.set('safesearch', 'true');
  url.searchParams.set('per_page', '20');
  url.searchParams.set('order', 'popular');
  const res = await fetch(url.toString());
  if (res.status === 400)
    throw new Error('Invalid API key — check your Pixabay key.');
  if (!res.ok) throw new Error(`Pixabay search failed: ${res.status}`);
  const data: SearchResponse = await res.json();
  return data.hits ?? [];
}

export async function fetchImageBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return res.blob();
}
