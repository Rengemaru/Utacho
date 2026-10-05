/// <reference types="jest" />
// #42: かな正規化ユーティリティの単体テスト
import { normalizeForSearch } from './text';

describe('normalizeForSearch', () => {
  it('カタカナ → ひらがな', () => {
    expect(normalizeForSearch('ワタシ')).toBe('わたし');
  });

  it('ひらがなはそのまま', () => {
    expect(normalizeForSearch('わたし')).toBe('わたし');
  });

  it('カタカナ・ひらがな混在を揃える', () => {
    expect(normalizeForSearch('ヨルに駆ケル')).toBe('よるに駆ける');
  });

  it('全角英数 → 半角・小文字化', () => {
    expect(normalizeForSearch('ＡＢＣ１２３')).toBe('abc123');
  });

  it('半角カナ → ひらがな（NFKC 経由）', () => {
    expect(normalizeForSearch('ﾜﾀｼ')).toBe('わたし');
  });

  it('前後の空白を除去', () => {
    expect(normalizeForSearch('  Lemon  ')).toBe('lemon');
  });

  it('漢字は変換しない', () => {
    expect(normalizeForSearch('炎')).toBe('炎');
  });

  it('空文字は空文字', () => {
    expect(normalizeForSearch('')).toBe('');
  });
});
