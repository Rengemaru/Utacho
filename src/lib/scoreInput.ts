export const MAX_SCORE = 100;
export const MAX_DECIMAL_PLACES = 3;

/** テンキーの1タップを現在の入力文字列に適用する */
export function applyScoreKey(current: string, key: string): string {
  if (key === '⌫') {
    return current.slice(0, -1);
  }
  if (key === '.') {
    if (current === '' || current.includes('.')) return current;
    return current + '.';
  }
  if (!/^[0-9]$/.test(key)) {
    return current;
  }
  if (current === '0') {
    return key === '0' ? '0' : key;
  }
  const next = current + key;
  if (parseFloat(next) > MAX_SCORE) return current;
  if (next.includes('.') && next.split('.')[1].length > MAX_DECIMAL_PLACES) return current;
  return next;
}

/** 入力中の点数を一括クリアする */
export function clearScoreInput(): string {
  return '';
}

/** 点数が1文字以上入力されているか（0点入力と未入力を区別） */
export function hasScoreInput(value: string): boolean {
  return value.length > 0;
}

/** 入力文字列を検証して数値へ変換する。未入力や範囲外は null */
export function parseScoreInput(value: string): number | null {
  if (!hasScoreInput(value)) return null;
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > MAX_SCORE) {
    return null;
  }
  return parsed;
}
