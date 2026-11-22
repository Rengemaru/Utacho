import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { SongWithStats } from '../types';
import { getAllSongs, getSongsByTab, getSongsByIds } from '../db/songs';
import { getSetlistSongIds } from '../db/settings';
import { MOCK_SONGS } from '../db/mockData';
import type { Machine } from '../lib/machine';
import { runSongListLoad } from '../lib/songListLoad';

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
    setLoading(true);
    const result = runSongListLoad(() => {
      if (Platform.OS === 'web') {
        return tabId === ALL_TAB.id
          ? MOCK_SONGS
          : MOCK_SONGS.filter(s => s.tabs.some(t => t.id === tabId));
      }
      if (tabId === ALL_TAB.id) {
        return getAllSongs(machine);
      }
      if (tabId === SETLIST_TAB.id) {
        const ids = getSetlistSongIds(localDateString());
        return getSongsByIds(ids, machine);
      }
      return getSongsByTab(tabId, machine);
    }, (e) => {
      console.error(e);
    });

    if (result.ok) {
      setSongs(result.songs);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [tabId, machine]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { songs, loading, error, reload };
}
