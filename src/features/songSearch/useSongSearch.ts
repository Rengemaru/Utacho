// 検索状態の管理フック。spec-1.1.0-song-flow §6.5。
// query/mode の変更でデバウンス検索し、古い結果が新しい結果を上書きしないようにする。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEBOUNCE_MS, PAGE_SIZE } from './constants';
import { searchSongs } from './itunes';
import { getSearchStatus, paginate, sortCandidates } from './logic';
import { SearchMode, SearchResult, SortKey } from './types';

export function useSongSearch(initialMode: SearchMode = 'song') {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('relevance');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 最新検索の識別子。実行のたびに増やし、古い非同期結果を破棄する
  const seqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // query か mode が変わったらデバウンス後に検索（§5.2）
  useEffect(() => {
    const trimmed = query.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    // 入力が空 → 通信せず idle（検索前）に戻す
    if (!trimmed) {
      seqRef.current++;
      setResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const seq = ++seqRef.current;
    timerRef.current = setTimeout(async () => {
      const res = await searchSongs(trimmed, mode);
      // 自分より新しい検索が始まっていたら結果を捨てる（表示が戻る事故を防ぐ）
      if (seq !== seqRef.current) return;
      setResult(res);
      setIsLoading(false);
      setVisibleCount(PAGE_SIZE); // 新しい結果は先頭ページから
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, mode]);

  // 並び替え変更 → 表示件数を先頭50件に戻す（§5.6）
  const changeSort = useCallback((key: SortKey) => {
    setSortKey(key);
    setVisibleCount(PAGE_SIZE);
  }, []);

  // 「もっと見る」→ 表示件数を1ページ分増やす（通信はしない・§5.5）
  const showMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  // §5.7 リセット：モーダルを開くたびに初期状態へ
  const reset = useCallback((nextMode: SearchMode, initialQuery = '') => {
    seqRef.current++; // 進行中の検索結果を無効化
    if (timerRef.current) clearTimeout(timerRef.current);
    setMode(nextMode);
    setQuery(initialQuery);
    setResult(null);
    setIsLoading(false);
    setSortKey('relevance');
    setVisibleCount(PAGE_SIZE);
  }, []);

  const status = getSearchStatus(result, isLoading);
  const allItems = useMemo(() => (result && result.ok ? result.items : []), [result]);
  const sortedItems = useMemo(() => sortCandidates(allItems, sortKey), [allItems, sortKey]);
  const visibleItems = useMemo(() => paginate(sortedItems, visibleCount), [sortedItems, visibleCount]);
  const hasMore = visibleCount < sortedItems.length;

  return {
    query,
    setQuery,
    mode,
    setMode,
    sortKey,
    changeSort,
    status,
    visibleItems,
    totalCount: allItems.length,
    hasMore,
    showMore,
    reset,
  };
}
