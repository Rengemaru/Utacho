// フッター「さがす」タブ。曲を追加する唯一の入口（ホームの＋ボタンは廃止）。
// 検索画面を最初から表示し、候補を選ぶと登録フォーム（song/new）へ曲情報を渡して開く。

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useCoachMark } from '../../src/contexts/CoachMarkContext';
import { INTRO_SEARCH_PART } from '../../src/data/tutorialSteps';
import { getIntroState, setIntroState } from '../../src/lib/tutorial';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { SongSearchView, SongSearchViewHandle } from '../../src/features/songSearch/SongSearchView';
import { SongCandidate } from '../../src/features/songSearch/types';
import { takeLastAdded, type LastAddedSong } from '../../src/features/songSearch/lastAdded';

export default function SearchTabScreen() {
  const insets = useSafeAreaInsets();
  const viewRef = useRef<SongSearchViewHandle>(null);
  const { startTour } = useCoachMark();
  // U05: 直前に追加した曲。登録フォームから戻ったときにバナーで3択を出す
  const [added, setAdded] = useState<LastAddedSong | null>(null);

  useFocusEffect(
    useCallback(() => {
      viewRef.current?.reloadHistory();
      // U05: フォームで曲を追加して戻ってきたら、その曲のバナーを出す
      const a = takeLastAdded();
      if (a) setAdded(a);
      // 初回チュートリアルの続き（ホームの「さがす」案内から来たとき）
      if (Platform.OS !== 'web' && getIntroState() === 'search') {
        startTour(INTRO_SEARCH_PART, { onFinish: () => setIntroState('done') });
      }
    }, [startTour]),
  );

  function handleSelect(c: SongCandidate) {
    setAdded(null); // 別の曲を選び直したら前のバナーは消す
    router.push({
      pathname: '/song/new',
      params: { title: c.title, artist: c.artist, artworkUrl: c.artworkUrl ?? '' },
    });
  }

  function handleManual() {
    setAdded(null);
    router.push('/song/new');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <SongSearchView
        ref={viewRef}
        onSelect={handleSelect}
        onManual={handleManual}
        bottomInset={0}
        added={added}
        onRecordAdded={(id) => { setAdded(null); router.push(`/song/${id}?record=1`); }}
        onOpenAdded={(id) => { setAdded(null); router.push(`/song/${id}`); }}
        onDismissAdded={() => setAdded(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
});
