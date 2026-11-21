import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { fonts } from '../src/constants/fonts';
import { EmptyState } from '../src/components/EmptyState';
import { useConfirm } from '../src/components/ConfirmProvider';
import { getDeletedSongs, restoreSong, hardDeleteSong } from '../src/db/songs';
import { SongWithStats } from '../src/types';

const AUTO_DELETE_DAYS = 30;

export default function TrashScreen() {
  const insets = useSafeAreaInsets();
  const confirm = useConfirm();
  const [songs, setSongs] = useState<SongWithStats[]>([]);

  const reload = useCallback(() => {
    if (Platform.OS === 'web') return;
    try {
      setSongs(getDeletedSongs());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  function handleRestore(song: SongWithStats) {
    restoreSong(song.id);
    reload();
  }

  async function handleDelete(song: SongWithStats) {
    const r = await confirm({
      title: '完全に削除',
      message: `「${song.title}」を完全に削除します。点数の記録も消え、取り消せません。`,
      icon: '🗑',
      iconTone: 'red',
      options: [{ label: '完全に削除する', style: 'danger' }],
      cancelLabel: 'キャンセル',
    });
    if (r === 0) {
      hardDeleteSong(song.id);
      reload();
    }
  }

  async function handleEmpty() {
    const r = await confirm({
      title: 'ゴミ箱を空にする',
      message: `ゴミ箱の ${songs.length} 曲をすべて完全に削除します。取り消せません。`,
      icon: '🗑',
      iconTone: 'red',
      options: [{ label: 'すべて完全に削除', style: 'danger' }],
      cancelLabel: 'キャンセル',
    });
    if (r === 0) {
      songs.forEach((s) => hardDeleteSong(s.id));
      reload();
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'ゴミ箱', headerBackTitle: '戻る' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          削除した曲は一時的にここへ移動します。{AUTO_DELETE_DAYS}日が過ぎた曲は自動的に完全削除されます。
        </Text>

        {songs.length === 0 ? (
          <EmptyState emoji="🗑" title="ゴミ箱は空です" subtitle="削除した曲がここに表示されます" />
        ) : (
          <>
            {songs.map((song) => (
              <View key={song.id} style={styles.row}>
                <View style={styles.art}>
                  {song.artwork_url ? (
                    <Image source={{ uri: song.artwork_url }} style={styles.artImage} />
                  ) : (
                    <Text style={styles.artEmoji}>🎵</Text>
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.artist} numberOfLines={1}>{song.artist || '—'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={() => handleRestore(song)}
                  accessibilityRole="button"
                  accessibilityLabel={`${song.title}を復元`}
                >
                  <Text style={styles.restoreBtnText}>復元</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(song)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${song.title}を完全に削除`}
                >
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.emptyBtn} onPress={handleEmpty}>
              <Text style={styles.emptyBtnText}>ゴミ箱を空にする</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 18, paddingTop: 16, gap: 10 },
  intro: { fontSize: 11, color: colors.text2, lineHeight: 17, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  art: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  },
  artImage: { width: 40, height: 40 },
  artEmoji: { fontSize: 17 },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  artist: { fontSize: 11, color: colors.text2 },
  restoreBtn: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.2)',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  restoreBtnText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.2)',
  },
  deleteBtnText: { fontSize: 15 },
  emptyBtn: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: colors.red },
});
