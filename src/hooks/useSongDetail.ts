import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { SongWithStats, ScoreRow } from '../types';
import { getSongById, updateSongSingingInfo, SongSingingInfo } from '../db/songs';
import { getScoresBySong } from '../db/scores';
import { MOCK_SONGS, MOCK_SCORES } from '../db/mockData';

export function useSongDetail(songId: number) {
  const [song, setSong] = useState<SongWithStats | null>(null);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        const songData = MOCK_SONGS.find(s => s.id === songId) ?? null;
        const scoreData = MOCK_SCORES[songId] ?? [];
        setSong(songData);
        setScores(scoreData);
        setError(null);
        setLoading(false);
        return;
      }
      const songData = getSongById(songId);
      const scoreData = getScoresBySong(songId);
      setSong(songData);
      setScores(scoreData);
      setError(null);
    } catch (e) {
      setError('データの取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // キー・テンポ・メモを即保存する。再取得（loading 表示）はせず、手元の song を差し替えるだけにする
  const updateSinging = useCallback((patch: Partial<SongSingingInfo>) => {
    try {
      if (Platform.OS !== 'web') updateSongSingingInfo(songId, patch);
      setSong((prev) => (prev ? { ...prev, ...patch } : prev));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [songId]);

  return { song, scores, loading, error, reload, updateSinging };
}
