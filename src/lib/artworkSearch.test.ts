import { SongCandidate } from '../features/songSearch/types';
import {
  buildArtworkInitialQuery,
  extractUniqueArtworkCandidates,
} from './artworkSearch';

describe('artworkSearch', () => {
  describe('buildArtworkInitialQuery', () => {
    it('曲名とアーティスト名をスペース区切りで結合する', () => {
      expect(buildArtworkInitialQuery('ガーネット', '奥華子')).toBe('ガーネット 奥華子');
    });

    it('片方が空または空白のみなら入力済みの方だけを返す', () => {
      expect(buildArtworkInitialQuery('  ガーネット ', '  ')).toBe('ガーネット');
      expect(buildArtworkInitialQuery('', '奥華子')).toBe('奥華子');
      expect(buildArtworkInitialQuery(' ', ' ')).toBe('');
    });
  });

  describe('extractUniqueArtworkCandidates', () => {
    it('artworkUrl がない候補を除外し、同じ artworkUrl の重複を取り除く', () => {
      const items: SongCandidate[] = [
        { trackId: 1, title: '曲A', artist: '歌手A', artworkUrl: 'https://example.com/1.jpg', releaseDate: null },
        { trackId: 2, title: '曲A (別の盤)', artist: '歌手A', artworkUrl: 'https://example.com/1.jpg', releaseDate: null },
        { trackId: 3, title: '曲B', artist: '歌手B', artworkUrl: null, releaseDate: null },
        { trackId: 4, title: '曲C', artist: '歌手C', artworkUrl: 'https://example.com/2.jpg', releaseDate: null },
      ];
      expect(extractUniqueArtworkCandidates(items)).toEqual([
        { trackId: 1, title: '曲A', artist: '歌手A', artworkUrl: 'https://example.com/1.jpg' },
        { trackId: 4, title: '曲C', artist: '歌手C', artworkUrl: 'https://example.com/2.jpg' },
      ]);
    });
  });
});
