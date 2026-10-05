// 検索用のかな正規化。ひらがな↔カタカナ・全角/半角・大文字小文字の表記ゆれを吸収する。
// ローカル持ち歌検索（#42）で、入力側と対象側の両方に適用して照合する。

/**
 * 検索照合用に文字列を正規化する。
 * 1. NFKC 正規化（全角英数→半角、半角カナ→全角カナ 等）。Hermes 非対応時は skip
 * 2. 小文字化・trim
 * 3. カタカナ（U+30A1..U+30F6）→ ひらがな（コード値 −0x60）
 */
export function normalizeForSearch(input: string): string {
  if (!input) return '';

  let s = input;
  try {
    // 一部の JS エンジン（古い Hermes）で未対応のことがあるため保険をかける
    s = s.normalize('NFKC');
  } catch {
    // NFKC 非対応環境では以降のカタカナ→ひらがな・小文字化のみで吸収する
  }

  s = s.toLowerCase().trim();

  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    // カタカナ → ひらがな
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCharCode(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}
