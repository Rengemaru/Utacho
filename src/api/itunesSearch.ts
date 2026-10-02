import { MusicSuggestion } from '../types';

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  collectionName: string;
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesTrack[];
}

export async function searchMusic(
  query: string,
  signal?: AbortSignal,
  limit = 8,
  attribute?: string
): Promise<MusicSuggestion[]> {
  let url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}` +
    `&country=JP&media=music&entity=song&limit=${limit}&lang=ja_jp`;
  if (attribute) url += `&attribute=${encodeURIComponent(attribute)}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data: ItunesResponse = await res.json();
    return data.results.map((item) => ({
      trackId: item.trackId,
      trackName: item.trackName ?? '',
      artistName: item.artistName ?? '',
      artworkUrl: item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : null,
      collectionName: item.collectionName ?? '',
    }));
  } catch {
    return [];
  }
}
