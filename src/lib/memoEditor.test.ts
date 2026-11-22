import {
  executeMemoSave,
  getMemoSaveButtonLabel,
  isMemoDraftDirty,
  MEMO_SAVE_ERROR_MESSAGE,
} from './memoEditor';

describe('isMemoDraftDirty (U03 / U28)', () => {
  it('初期値と同じ、または前後空白のみの差は未変更とみなす', () => {
    expect(isMemoDraftDirty('サビ前でブレス', 'サビ前でブレス')).toBe(false);
    expect(isMemoDraftDirty('サビ前でブレス', '  サビ前でブレス  ')).toBe(false);
    expect(isMemoDraftDirty('', '   ')).toBe(false);
  });

  it('本文が変わっている場合は変更ありとみなす', () => {
    expect(isMemoDraftDirty('サビ前でブレス', 'サビ前でしっかりブレス')).toBe(true);
    expect(isMemoDraftDirty('', 'メモ追加')).toBe(true);
    expect(isMemoDraftDirty('既存メモ', '')).toBe(true);
  });
});

describe('getMemoSaveButtonLabel (U28)', () => {
  it('状態に応じたラベルを返す', () => {
    expect(getMemoSaveButtonLabel(false, false)).toBe('保存');
    expect(getMemoSaveButtonLabel(true, false)).toBe('保存中...');
    expect(getMemoSaveButtonLabel(true, true)).toBe('保存中...');
    expect(getMemoSaveButtonLabel(false, true)).toBe('もう一度保存');
  });
});

describe('executeMemoSave (U28)', () => {
  it('保存成功時は trim 済みの値と ok: true を返す', async () => {
    const saveFn = jest.fn().mockReturnValue(true);
    const result = await executeMemoSave('  サビ前でブレス  ', saveFn);

    expect(saveFn).toHaveBeenCalledWith('サビ前でブレス');
    expect(result).toEqual({ ok: true, savedValue: 'サビ前でブレス' });
  });

  it('保存関数が false を返したときは ok: false とエラー文言を返す', async () => {
    const result = await executeMemoSave('下書き', () => false);
    expect(result).toEqual({ ok: false, error: MEMO_SAVE_ERROR_MESSAGE });
  });

  it('保存関数が例外を投げたときも ok: false とエラー文言を返す', async () => {
    const result = await executeMemoSave('下書き', async () => {
      throw new Error('SQLite write failed');
    });
    expect(result).toEqual({ ok: false, error: MEMO_SAVE_ERROR_MESSAGE });
  });

  it('失敗後に再実行して成功すれば ok: true に復帰する', async () => {
    let attempt = 0;
    const saveFn = async () => {
      attempt += 1;
      return attempt >= 2;
    };

    const first = await executeMemoSave('大事な下書き', saveFn);
    expect(first).toEqual({ ok: false, error: MEMO_SAVE_ERROR_MESSAGE });

    const second = await executeMemoSave('大事な下書き', saveFn);
    expect(second).toEqual({ ok: true, savedValue: '大事な下書き' });
  });
});
