import { useCallback, useEffect, useRef, useState } from 'react';
import { searchMusic } from '../api/itunesSearch';
import { MusicSuggestion } from '../types';

export function useMusicSearch(query: string, debounceMs = 300, attribute?: string) {
  const [suggestions, setSuggestions] = useState<MusicSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (pausedRef.current || query.trim().length < 1) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      // SearchResultList（スクロール対応）導入により、ヒットしたものを最大200件まで表示する（iTunesの上限）
      const results = await searchMusic(query.trim(), controller.signal, 200, attribute);
      // abort済みのリクエスト結果は無視する
      if (controller.signal.aborted) return;
      setSuggestions(results);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [query, debounceMs, attribute]);

  const clearSuggestions = useCallback(() => {
    pausedRef.current = true;
    setSuggestions([]);
    setIsSearching(false);
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resumeSearch = useCallback(() => {
    pausedRef.current = false;
  }, []);

  return { suggestions, isSearching, clearSuggestions, resumeSearch };
}
