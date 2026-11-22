export const MEMO_SAVE_ERROR_MESSAGE =
  '保存に失敗しました。入力は残っています。\nもう一度保存してください。';

/**
 * メモの下書きに未保存の変更があるか判定する（U03 / U28）。
 * 保存時に trim() されるため、前後の空白のみの差は変更なしとみなす。
 */
export function isMemoDraftDirty(initialMemo: string, draft: string): boolean {
  return draft.trim() !== initialMemo.trim();
}

/**
 * メモ保存ボタンのラベルを状態に応じて返す（U28）。
 */
export function getMemoSaveButtonLabel(saving: boolean, hasError: boolean): string {
  if (saving) return '保存中...';
  if (hasError) return 'もう一度保存';
  return '保存';
}

export type MemoSaveResult =
  | { ok: true; savedValue: string }
  | { ok: false; error: string };

/**
 * メモの保存処理を実行し、成功/失敗の結果を返す（U28）。
 * 呼び出し元のダイアログはこの結果が ok: true のときだけ閉じ、
 * ok: false のときは下書きを保持してエラーと再試行を表示する。
 */
export async function executeMemoSave(
  draft: string,
  saveFn: (trimmedValue: string) => Promise<boolean> | boolean,
): Promise<MemoSaveResult> {
  const trimmed = draft.trim();
  try {
    const ok = await saveFn(trimmed);
    if (ok) {
      return { ok: true, savedValue: trimmed };
    }
    return { ok: false, error: MEMO_SAVE_ERROR_MESSAGE };
  } catch {
    return { ok: false, error: MEMO_SAVE_ERROR_MESSAGE };
  }
}
