import { SongCandidate } from '../features/songSearch/types';

export interface ArtworkCandidate {
  trackId: number;
  title: string;
  artist: string;
  artworkUrl: string;
}

/** 曲名・アーティスト名からアートワーク検索の初期クエリを組み立てる */
export function buildArtworkInitialQuery(title: string, artist: string): string {
  return [title.trim(), artist.trim()].filter((v) => v.length > 0).join(' ');
}

/** 画像なし候補と同一 artworkUrl の重複を除いたアートワーク候補一覧を返す */
export function extractUniqueArtworkCandidates(
  items: readonly SongCandidate[],
): ArtworkCandidate[] {
  const seenUrls = new Set<string>();
  const result: ArtworkCandidate[] = [];
  for (const item of items) {
    if (!item.artworkUrl) continue;
    if (seenUrls.has(item.artworkUrl)) continue;
    seenUrls.add(item.artworkUrl);
    result.push({
      trackId: item.trackId,
      title: item.title,
      artist: item.artist,
      artworkUrl: item.artworkUrl,
    });
  }
  return result;
}
