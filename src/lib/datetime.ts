/**
 * 記録日時の文字列を表示用に整形する。
 * 「2026-06-24T21:30」→「2026/06/24 21:30」
 * 日付のみの旧データ「2026-06-24」→「2026/06/24」
 */
export function formatDateTime(s: string): string {
  const [datePart, timePart] = s.split('T');
  const d = datePart.replace(/-/g, '/');
  return timePart ? `${d} ${timePart}` : d;
}

/**
 * 「2026-06-24T21:30」→「6/24 21:30」のような短縮表示。
 * 日付のみの旧データは「6/24」。グラフの軸ラベルなど省スペース用。
 */
export function formatShortDateTime(s: string): string {
  const [datePart, timePart] = s.split('T');
  const [, month, day] = datePart.split('-');
  const md = `${Number(month)}/${Number(day)}`;
  return timePart ? `${md} ${timePart}` : md;
}

/** 日付部分（YYYY-MM-DD）だけを取り出す。日時・日付どちらの形式でも動く */
export function datePartOf(s: string): string {
  return s.split('T')[0];
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 現在日時を「YYYY-MM-DDTHH:MM」（ローカル時刻・分単位）で返す */
export function nowDateTimeString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 今日の日付を「YYYY-MM-DD」（ローカル）で返す */
export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * 日時文字列の「日付部分」を days 日ずらす。時刻部分はそのまま保持する。
 * 「2026-06-24T21:30」を +1 → 「2026-06-25T21:30」。月またぎも正しく処理する。
 */
export function shiftDatePart(s: string, days: number): string {
  const [datePart, timePart] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + days);
  const shifted = `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
  return timePart ? `${shifted}T${timePart}` : shifted;
}

/** その日時の日付が今日より未来か（YYYY-MM-DD の辞書順比較で判定） */
export function isFutureDatePart(s: string): boolean {
  return datePartOf(s) > todayDateString();
}
