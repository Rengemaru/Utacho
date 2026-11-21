// U05 #134: 曲を登録したあと「さがす」に留まって3択（検索継続／点数記録／曲を開く）を出すための受け渡し。
// フォーム(song/new)は「さがす」の上に push されるため、router.back() で検索状態を保ったまま戻れる。
// その際に「どの曲を追加したか」を一時的に共有し、さがす側がフォーカス時に取り出してバナー表示する。

export type LastAddedSong = { id: number; title: string };

let _lastAdded: LastAddedSong | null = null;

export function setLastAdded(v: LastAddedSong): void {
  _lastAdded = v;
}

/** 取り出すと同時にクリアする（二度表示しない）。 */
export function takeLastAdded(): LastAddedSong | null {
  const v = _lastAdded;
  _lastAdded = null;
  return v;
}
