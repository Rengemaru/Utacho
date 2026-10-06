import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { SongWithStats } from '../types';
import { getAllSongs, getSongsByTab, getSongsByIds } from '../db/songs';
import { getSetlistSongIds } from '../db/settings';
import { MOCK_SONGS } from '../db/mockData';
import type { Machine } from '../lib/machine';

export const ALL_TAB      = { id: -1, name: 'すべて',  sort_order: -1 } as const;
export const SETLIST_TAB  = { id: -2, name: '今日',    sort_order: -2 } as const;

function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useSongs(tabId: number, machine?: Machine) {
  const [songs, setSongs] = useState<SongWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        const data = tabId === ALL_TAB.id
          ? MOCK_SONGS
          : MOCK_SONGS.filter(s => s.tabs.some(t => t.id === tabId));
        setSongs(data);
        setError(null);
        setLoading(false);
        return;
      }
      let data: SongWithStats[];
      if (tabId === ALL_TAB.id) {
        data = getAllSongs(machine);
      } else if (tabId === SETLIST_TAB.id) {
        const ids = getSetlistSongIds(localDateString());
        data = getSongsByIds(ids, machine);
      } else {
        data = getSongsByTab(tabId, machine);
      }
      setSongs(data);
      setError(null);
    } catch (e) {
      setError('データの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tabId, machine]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { songs, loading, error, reload };
}
