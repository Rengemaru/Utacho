/// <reference types="jest" />
// #91: 検索キーワード履歴の純粋関数テスト。

import { addHistoryEntry, parseHistory, removeHistoryEntry } from './searchHistory';

describe('addHistoryEntry', () => {
  it('新しいキーワードを先頭に追加する', () => {
    expect(addHistoryEntry(['米津玄師'], 'Mili')).toEqual(['Mili', '米津玄師']);
  });

  it('前後の空白を除去する', () => {
    expect(addHistoryEntry([], '  あいみょん  ')).toEqual(['あいみょん']);
  });

  it('空文字・空白のみは無視して元配列を返す', () => {
    const base = ['a'];
    expect(addHistoryEntry(base, '   ')).toBe(base);
    expect(addHistoryEntry(base, '')).toBe(base);
  });

  it('既存の同一キーワードは重複させず先頭へ移動する', () => {
    expect(addHistoryEntry(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('最大件数を超えたら末尾を切り捨てる', () => {
    const history = ['1', '2', '3'];
    expect(addHistoryEntry(history, '0', 3)).toEqual(['0', '1', '2']);
  });

  it('元の配列を破壊しない', () => {
    const history = ['a'];
    addHistoryEntry(history, 'b');
    expect(history).toEqual(['a']);
  });
});

describe('removeHistoryEntry', () => {
  it('指定キーワードを取り除く', () => {
    expect(removeHistoryEntry(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('存在しないキーワードは無変更（内容は等価）', () => {
    expect(removeHistoryEntry(['a'], 'x')).toEqual(['a']);
  });
});

describe('parseHistory', () => {
  it('JSON 配列を文字列配列として返す', () => {
    expect(parseHistory('["a","b"]')).toEqual(['a', 'b']);
  });

  it('null は空配列', () => {
    expect(parseHistory(null)).toEqual([]);
  });

  it('壊れた JSON は空配列', () => {
    expect(parseHistory('{not json')).toEqual([]);
  });

  it('配列でない JSON は空配列', () => {
    expect(parseHistory('"a"')).toEqual([]);
    expect(parseHistory('123')).toEqual([]);
  });

  it('文字列以外の要素は除外する', () => {
    expect(parseHistory('["a",1,null,"b"]')).toEqual(['a', 'b']);
  });
});
