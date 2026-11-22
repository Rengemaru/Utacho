export const MAX_SCORE = 100;
export const MAX_DECIMAL_PLACES = 3;
export const MAX_SCORE_INPUT_LENGTH = 10;
export const SCORE_CONSTRAINT_HINT = '0〜100点・小数点以下3桁まで';
export const SCORE_VALIDATION_ERROR = '0〜100点・小数点以下3桁まで入力できます。';

export type ScoreValidationStatus = 'empty' | 'valid' | 'invalid';

export interface ScoreValidationResult {
  status: ScoreValidationStatus;
  score: number | null;
  errorMessage: string | null;
}

/** テンキーの1タップを現在の入力文字列に適用する（範囲外・小数4桁以上も入力させてエラー表示で伝える） */
export function applyScoreKey(current: string, key: string): string {
  if (key === '⌫') {
    return current.slice(0, -1);
  }
  if (key === '.') {
    if (current === '' || current.includes('.') || current.length >= MAX_SCORE_INPUT_LENGTH) {
      return current;
    }
    return current + '.';
  }
  if (!/^[0-9]$/.test(key)) {
    return current;
  }
  if (current === '0') {
    return key === '0' ? '0' : key;
  }
  if (current.length >= MAX_SCORE_INPUT_LENGTH) {
    return current;
  }
  return current + key;
}

/** 入力中の点数を一括クリアする */
export function clearScoreInput(): string {
  return '';
}

/** 点数が1文字以上入力されているか（0点入力と未入力を区別） */
export function hasScoreInput(value: string): boolean {
  return value.length > 0;
}

/** 入力文字列を検証し、未入力・有効・無効（理由付き）を返す */
export function validateScoreInput(value: string): ScoreValidationResult {
  if (!hasScoreInput(value)) {
    return { status: 'empty', score: null, errorMessage: null };
  }
  if (value.endsWith('.')) {
    return { status: 'invalid', score: null, errorMessage: SCORE_VALIDATION_ERROR };
  }
  const parts = value.split('.');
  if (parts.length > 2 || (parts.length === 2 && parts[1].length > MAX_DECIMAL_PLACES)) {
    return { status: 'invalid', score: null, errorMessage: SCORE_VALIDATION_ERROR };
  }
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > MAX_SCORE) {
    return { status: 'invalid', score: null, errorMessage: SCORE_VALIDATION_ERROR };
  }
  return { status: 'valid', score: parsed, errorMessage: null };
}

/** 入力文字列を検証して数値へ変換する。未入力や範囲外は null */
export function parseScoreInput(value: string): number | null {
  const result = validateScoreInput(value);
  return result.status === 'valid' ? result.score : null;
}
