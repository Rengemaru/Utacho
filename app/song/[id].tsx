import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { deleteScore } from '../../src/db/scores';
import { formatDateTime } from '../../src/lib/datetime';
import { useSongDetail } from '../../src/hooks/useSongDetail';
import { ScoreRow } from '../../src/types';
import { ScoreBottomSheet } from '../../src/components/ScoreBottomSheet';
import { ScoreChart } from '../../src/components/ScoreChart';
import { EmptyState } from '../../src/components/EmptyState';

export default function SongDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const songId = Number(id);
  const { song, scores, loading, error, reload } = useSongDetail(songId);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingScore, setEditingScore] = useState<ScoreRow | null>(null);
  const [artworkError, setArtworkError] = useState(false);

  function handleDeleteScore(score: ScoreRow) {
    Alert.alert(
      'スコアを削除',
      `${formatDateTime(score.scored_at)}  ${score.score.toFixed(1)}点\nこの記録を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'web') return;
            try {
              deleteScore(score.id);
              reload();
            } catch (e) {
              console.error(e);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState emoji="⏳" title="読み込み中..." />
      </View>
    );
  }

  if (error || !song) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <EmptyState
          emoji="⚠️"
          title="データを取得できませんでした"
          subtitle={error ?? '曲が見つかりません'}
          actionLabel="戻る"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  // 前回比は「同一機種の直近2件」で計算する。機種が違うと採点傾向が異なり比較が無意味になるため。
  // scores は scored_at DESC 順なので、最新記録と同じ機種でフィルタした先頭2件を比較する。
  const latestScore = scores.length > 0 ? scores[0] : null;
  const sameMachineScores = latestScore
    ? scores.filter((s) => s.machine === latestScore.machine)
    : [];
  const diff = sameMachineScores.length >= 2
    ? sameMachineScores[0].score - sameMachineScores[1].score
    : null;
  const diffMachine = latestScore?.machine ?? '';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.headerArtist} numberOfLines={1}>{song.artist || '—'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/song/new?songId=${songId}`)}>
          <Text style={styles.editBtn}>編集</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={scores}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* アートワーク */}
            <View style={styles.artHeader}>
              <View style={styles.artBox}>
                {song.artwork_url && !artworkError ? (
                  <Image
                    source={{ uri: song.artwork_url }}
                    style={styles.artImage}
                    onError={() => setArtworkError(true)}
                  />
                ) : (
                  <Text style={styles.artEmoji}>🎵</Text>
                )}
              </View>
              <View style={styles.artInfo}>
                <Text style={styles.artTitle} numberOfLines={2}>{song.title}</Text>
                <Text style={styles.artArtist} numberOfLines={1}>{song.artist || '—'}</Text>
              </View>
            </View>

            {/* 最高スコアカード */}
            <LinearGradient
              colors={['#ede9fe', '#f5f3ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bestCard}
            >
              <View>
                <Text style={styles.bestLabel}>最高スコア</Text>
                <Text style={styles.bestValue}>
                  {song.best_score != null && song.best_score > 0 ? song.best_score.toFixed(1) : '—'}
                </Text>
                {diff != null && (
                  <Text style={[styles.bestDiff, { color: diff >= 0 ? colors.green : colors.red }]}>
                    {diffMachine} {diff >= 0 ? `↑ ${diff.toFixed(1)}pt` : `↓ ${Math.abs(diff).toFixed(1)}pt`} 前回比
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.bestLabel}>記録回数</Text>
                <Text style={styles.countValue}>{song.score_count}回</Text>
              </View>
            </LinearGradient>

            {/* グラフ（スコアが2件以上あるとき表示） */}
            {scores.length >= 2 && (
              <View style={styles.chartSection}>
                <View style={styles.chartLabelRow}>
                  <Text style={styles.sectionLabel}>点数推移</Text>
                  <View style={styles.legend}>
                    {scores.some((s) => s.machine === 'DAM') && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.dam }]} />
                        <Text style={styles.legendLabel}>DAM</Text>
                      </View>
                    )}
                    {scores.some((s) => s.machine === 'JOYSOUND') && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.joy }]} />
                        <Text style={styles.legendLabel}>JOYSOUND</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ScoreChart scores={scores} />
              </View>
            )}

            {/* メモ */}
            {song.memo ? (
              <View style={styles.memoCard}>
                <Text style={styles.memoLabel}>メモ</Text>
                <ScrollView scrollEnabled={false}>
                  <Text style={styles.memoText}>{song.memo}</Text>
                </ScrollView>
              </View>
            ) : null}

            {/* 履歴セクションラベル */}
            {scores.length > 0 && (
              <Text style={styles.sectionLabel}>記録履歴</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🎤"
            title="まだスコアが記録されていません"
            subtitle="「点数を記録する」から最初のスコアを追加しましょう"
          />
        }
        renderItem={({ item }) => (
          <HistoryRow
            score={item}
            onEdit={() => {
              setEditingScore(item);
              setSheetVisible(true);
            }}
            onDelete={() => handleDeleteScore(item)}
          />
        )}
      />

      {/* 記録ボタン */}
      <View style={[styles.recordBtnWrap, { bottom: insets.bottom + 60 }]}>
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => {
            setEditingScore(null);
            setSheetVisible(true);
          }}
        >
          <Text style={styles.recordBtnText}>🎤 点数を記録する</Text>
        </TouchableOpacity>
      </View>

      {/* ボトムシート */}
      <ScoreBottomSheet
        visible={sheetVisible}
        song={song}
        editingScore={editingScore}
        onClose={() => setSheetVisible(false)}
        onSaved={() => {
          setSheetVisible(false);
          reload();
        }}
      />
    </View>
  );
}

interface HistoryRowProps {
  score: ScoreRow;
  onEdit: () => void;
  onDelete: () => void;
}

function HistoryRow({ score, onEdit, onDelete }: HistoryRowProps) {
  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeEditBtn]}
            onPress={onEdit}
          >
            <Text style={styles.swipeBtnText}>✏️{'\n'}編集</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeDeleteBtn]}
            onPress={onDelete}
          >
            <Text style={styles.swipeBtnText}>🗑{'\n'}削除</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={styles.historyRow}>
        <Text style={styles.historyDate}>{formatDateTime(score.scored_at)}</Text>
        <View style={[
          styles.machineBadge,
          score.machine === 'DAM' ? styles.machineBadgeDam : styles.machineBadgeJoy,
        ]}>
          <Text style={[
            styles.machineBadgeText,
            { color: score.machine === 'DAM' ? colors.dam : colors.joy },
          ]}>
            {score.machine === 'DAM' ? 'DAM' : 'JOY'}
          </Text>
        </View>
        <Text style={styles.historyScore}>{score.score.toFixed(1)}</Text>
      </View>
    </Swipeable>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 22,
    color: colors.accent,
    fontWeight: '600',
    lineHeight: 26,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  headerArtist: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 1,
  },
  editBtn: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 18,
  },
  listHeader: {
    gap: 13,
    paddingBottom: 8,
  },
  artHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  artBox: {
    width: 64,
    height: 64,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  artImage: {
    width: 64,
    height: 64,
  },
  artEmoji: {
    fontSize: 28,
  },
  artInfo: {
    flex: 1,
  },
  artTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  artArtist: {
    fontSize: 11,
    color: colors.text2,
    marginTop: 3,
  },
  bestCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.15)',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestLabel: {
    fontSize: 10,
    color: colors.text2,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bestValue: {
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 34,
    color: colors.accent,
    lineHeight: 40,
  },
  bestDiff: {
    fontSize: 11,
    marginTop: 3,
  },
  countValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 22,
    color: colors.text,
    textAlign: 'right',
  },
  chartSection: {
    gap: 6,
  },
  chartLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legend: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.text2,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.text2,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  memoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  memoLabel: {
    fontSize: 10,
    color: colors.text2,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  memoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    fontFamily: fonts.monoRegular,
    fontSize: 11,
    color: colors.text3,
    width: 52,
  },
  machineBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  machineBadgeDam: {
    backgroundColor: colors.damSoft,
    borderColor: colors.damBorder,
  },
  machineBadgeJoy: {
    backgroundColor: colors.joySoft,
    borderColor: colors.joyBorder,
  },
  machineBadgeText: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  historyScore: {
    fontFamily: fonts.monoMedium,
    flex: 1,
    fontSize: 14,
    color: colors.accent,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingLeft: 8,
    gap: 6,
  },
  swipeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    minWidth: 56,
    paddingHorizontal: 8,
  },
  swipeEditBtn: {
    backgroundColor: colors.accent,
  },
  swipeDeleteBtn: {
    backgroundColor: colors.red,
  },
  swipeBtnText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  recordBtnWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
  },
  recordBtn: {
    backgroundColor: colors.accent,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 4,
  },
  recordBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
