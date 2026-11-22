export const TRASH_RETENTION_DAYS = 30;
export const TRASH_URGENT_DAYS = 3;

const DAY_MS = 86_400_000;

/**
 * ゴミ箱の曲が自動完全削除されるまでの残り日数を返す。
 * 実際の自動削除（deleted_at + 30日）に合わせ、残り24時間未満は 0（本日中）とする。
 */
export function getRemainingTrashDays(
  deletedAt: string | null | undefined,
  now: Date = new Date(),
): number {
  if (!deletedAt) return TRASH_RETENTION_DAYS;
  const deletedMs = Date.parse(deletedAt);
  if (Number.isNaN(deletedMs)) return TRASH_RETENTION_DAYS;
  const expireMs = deletedMs + TRASH_RETENTION_DAYS * DAY_MS;
  const remainingMs = expireMs - now.getTime();
  if (remainingMs < DAY_MS) return 0;
  return Math.min(TRASH_RETENTION_DAYS, Math.floor(remainingMs / DAY_MS));
}

/** 残り日数を表示ラベルへ整形する */
export function formatTrashDeadlineLabel(daysLeft: number): string {
  if (daysLeft <= 0) return '本日中に自動削除';
  return `あと${daysLeft}日で自動削除`;
}

/** 削除期限が近い順（deleted_at が古い順）に並べ替える */
export function sortSongsByTrashDeadline<T extends { deleted_at: string | null }>(
  songs: readonly T[],
): T[] {
  return [...songs].sort((a, b) => {
    const aMs = a.deleted_at ? Date.parse(a.deleted_at) : Number.MAX_SAFE_INTEGER;
    const bMs = b.deleted_at ? Date.parse(b.deleted_at) : Number.MAX_SAFE_INTEGER;
    const safeA = Number.isNaN(aMs) ? Number.MAX_SAFE_INTEGER : aMs;
    const safeB = Number.isNaN(bMs) ? Number.MAX_SAFE_INTEGER : bMs;
    return safeA - safeB;
  });
}

/** 3日以内に自動削除される曲数を数える */
export function countUrgentTrashSongs<T extends { deleted_at: string | null }>(
  songs: readonly T[],
  now: Date = new Date(),
): number {
  let count = 0;
  for (const song of songs) {
    if (getRemainingTrashDays(song.deleted_at, now) <= TRASH_URGENT_DAYS) {
      count += 1;
    }
  }
  return count;
}
