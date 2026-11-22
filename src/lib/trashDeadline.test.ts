import {
  countUrgentTrashSongs,
  formatTrashDeadlineLabel,
  getRemainingTrashDays,
  sortSongsByTrashDeadline,
} from './trashDeadline';

describe('trashDeadline', () => {
  const NOW = new Date('2026-11-22T12:00:00.000Z');
  const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

  describe('getRemainingTrashDays / formatTrashDeadlineLabel', () => {
    it('削除直後はあと29〜30日、16日前はあと14日、28日前はあと2日を返す', () => {
      expect(getRemainingTrashDays(daysAgo(0.5), NOW)).toBe(29);
      expect(formatTrashDeadlineLabel(29)).toBe('あと29日で自動削除');

      expect(getRemainingTrashDays(daysAgo(16), NOW)).toBe(14);
      expect(formatTrashDeadlineLabel(14)).toBe('あと14日で自動削除');

      expect(getRemainingTrashDays(daysAgo(28), NOW)).toBe(2);
      expect(formatTrashDeadlineLabel(2)).toBe('あと2日で自動削除');
    });

    it('残り24時間未満や期限超過は 0（本日中に自動削除）になる', () => {
      expect(getRemainingTrashDays(daysAgo(29.5), NOW)).toBe(0);
      expect(getRemainingTrashDays(daysAgo(31), NOW)).toBe(0);
      expect(formatTrashDeadlineLabel(0)).toBe('本日中に自動削除');
    });
  });

  describe('sortSongsByTrashDeadline / countUrgentTrashSongs', () => {
    it('削除期限が近い順（deleted_at が古い順）に並べ替える', () => {
      const songs = [
        { id: 1, deleted_at: daysAgo(1) },
        { id: 2, deleted_at: daysAgo(29.5) },
        { id: 3, deleted_at: daysAgo(16) },
        { id: 4, deleted_at: daysAgo(28) },
      ];
      expect(sortSongsByTrashDeadline(songs).map((s) => s.id)).toEqual([2, 4, 3, 1]);
    });

    it('3日以内に自動削除される曲数を正確に数える', () => {
      const songs = [
        { id: 1, deleted_at: daysAgo(1) },     // あと29日
        { id: 2, deleted_at: daysAgo(29.5) },  // 本日中 (0日) -> urgent
        { id: 3, deleted_at: daysAgo(27) },    // あと3日 -> urgent
        { id: 4, deleted_at: daysAgo(26) },    // あと4日 -> not urgent
      ];
      expect(countUrgentTrashSongs(songs, NOW)).toBe(2);
    });
  });
});
