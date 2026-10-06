import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { SongWithStats } from '../types';
import type { Machine } from '../lib/machine';

interface Props {
  song: SongWithStats;
  machine: Machine; // best_score はこの機種での最高点。ラベルに機種名を出す（#71）
  onPressRecord: () => void;
}

export function SongCard({ song, machine, onPressRecord }: Props) {
  const keyOffset = song.key_offset;
  const score = song.best_score;
  const bestLabel = machine === 'JOYSOUND' ? 'JOY BEST' : 'DAM BEST';

  return (
    <View style={styles.card}>
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

      <View style={styles.right}>
        <KeyBadge keyOffset={keyOffset} />
        <View style={styles.scoreWrap}>
          <Text style={styles.scoreLabel}>{bestLabel}</Text>
          <Text style={styles.score}>
            {score != null && score > 0 ? score.toFixed(3) : '—'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={onPressRecord}
          accessibilityRole="button"
          accessibilityLabel={`${song.title}の点数を記録`}
        >
          <Text style={styles.recordBtnText}>🎤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function KeyBadge({ keyOffset }: { keyOffset: number | null }) {
  if (keyOffset == null) {
    return <View style={styles.keyBadgePlaceholder} />;
  }
  const isPositive = keyOffset > 0;
  const isNegative = keyOffset < 0;
  return (
    <View style={[
      styles.keyBadge,
      isPositive && styles.keyBadgePositive,
      isNegative && styles.keyBadgeNegative,
    ]}>
      <Text style={[
        styles.keyBadgeText,
        isPositive && styles.keyBadgeTextPositive,
        isNegative && styles.keyBadgeTextNegative,
      ]}>
        {keyOffset > 0 ? `+${keyOffset}` : `${keyOffset}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 11,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  art: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
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
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    color: colors.text2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  keyBadge: {
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  keyBadgePlaceholder: {
    minWidth: 28,
  },
  keyBadgePositive: {
    backgroundColor: 'rgba(0, 185, 107, 0.08)',
    borderColor: 'rgba(0, 185, 107, 0.2)',
  },
  keyBadgeNegative: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  keyBadgeText: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.text2,
  },
  keyBadgeTextPositive: {
    color: colors.green,
  },
  keyBadgeTextNegative: {
    color: colors.yellow,
  },
  scoreWrap: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text3,
  },
  score: {
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    color: colors.accent,
  },
  recordBtn: {
    width: 30,
    height: 30,
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnText: {
    fontSize: 14,
  },
});
