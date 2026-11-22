import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/constants/colors';
import { EmptyState } from '../src/components/EmptyState';
import { useConfirm } from '../src/components/ConfirmProvider';
import { getDeletedSongs, restoreSong, hardDeleteSong } from '../src/db/songs';
import {
  countUrgentTrashSongs,
  formatTrashDeadlineLabel,
  getRemainingTrashDays,
  sortSongsByTrashDeadline,
  TRASH_RETENTION_DAYS,
  TRASH_URGENT_DAYS,
} from '../src/lib/trashDeadline';
import { SongWithStats } from '../src/types';

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

  const sortedSongs = useMemo(() => sortSongsByTrashDeadline(songs), [songs]);
  const urgentCount = useMemo(() => countUrgentTrashSongs(sortedSongs), [sortedSongs]);

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
      title: '完全に削除',
      message: `ゴミ箱の ${sortedSongs.length} 曲をすべて完全に削除します。取り消せません。`,
      icon: '🗑',
      iconTone: 'red',
      options: [{ label: `${sortedSongs.length}曲を完全に削除`, style: 'danger' }],
      cancelLabel: 'キャンセル',
    });
    if (r === 0) {
      sortedSongs.forEach((s) => hardDeleteSong(s.id));
      reload();
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'ゴミ箱', headerBackTitle: '戻る' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 説明ヘッダー */}
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>{TRASH_RETENTION_DAYS}日後に完全削除されます</Text>
          <Text style={styles.introDesc}>
            完全削除後は復元できません。期間内に復元すると、曲・点数・カテゴリが戻ります。
          </Text>
        </View>

        {/* 期限切迫バナー（3日以内に自動削除される曲がある場合のみ表示） */}
        {urgentCount > 0 && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentTitle}>
              {TRASH_URGENT_DAYS}日以内に自動削除される曲が{urgentCount}曲
            </Text>
            <Text style={styles.urgentSub}>
              残しておきたい曲は、期限前に復元してください。
            </Text>
          </View>
        )}

        {sortedSongs.length === 0 ? (
          <EmptyState emoji="🗑" title="ゴミ箱は空です" subtitle="削除した曲がここに表示されます" />
        ) : (
          <>
            {/* 件数・並び順バー */}
            <View style={styles.listHeader}>
              <Text style={styles.countText}>{sortedSongs.length}曲</Text>
              <Text style={styles.sortHint}>削除期限が近い順</Text>
            </View>

            {/* ゴミ箱の曲カード一覧 */}
            <View style={styles.cardList}>
              {sortedSongs.map((song) => {
                const daysLeft = getRemainingTrashDays(song.deleted_at);
                const deadlineLabel = formatTrashDeadlineLabel(daysLeft);
                return (
                  <TouchableOpacity
                    key={song.id}
                    style={styles.card}
                    activeOpacity={0.9}
                    onLongPress={() => void handleDelete(song)}
                    delayLongPress={450}
                    accessibilityHint="長押しでこの曲を完全に削除できます"
                  >
                    <View style={styles.art}>
                      {song.artwork_url ? (
                        <Image source={{ uri: song.artwork_url }} style={styles.artImage} />
                      ) : (
                        <Text style={styles.artEmoji}>🎵</Text>
                      )}
                    </View>

                    <View style={styles.info}>
                      <Text style={styles.deadline} numberOfLines={1}>{deadlineLabel}</Text>
                      <Text style={styles.title} numberOfLines={2}>{song.title}</Text>
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
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 下部：一括完全削除エリア */}
            <View style={styles.emptySection}>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => void handleEmpty()}
                accessibilityRole="button"
                accessibilityLabel={`${sortedSongs.length}曲を完全に削除`}
              >
                <Text style={styles.emptyBtnText}>{sortedSongs.length}曲を完全に削除</Text>
              </TouchableOpacity>
              <Text style={styles.emptyNote}>完全に削除すると、元に戻せません。</Text>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 14,
  },
  introBlock: {
    gap: 6,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  introDesc: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 20,
  },
  urgentBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  urgentSub: {
    fontSize: 12,
    color: colors.text2,
    lineHeight: 18,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sortHint: {
    fontSize: 12,
    color: colors.text2,
  },
  cardList: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  art: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  artImage: {
    width: 40,
    height: 40,
  },
  artEmoji: {
    fontSize: 17,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  deadline: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  artist: {
    fontSize: 12,
    color: colors.text2,
  },
  restoreBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    minWidth: 72,
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  restoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  emptySection: {
    marginTop: 4,
    gap: 8,
  },
  emptyBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  emptyNote: {
    fontSize: 12,
    color: colors.text2,
  },
});
