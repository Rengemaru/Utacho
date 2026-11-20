// フッター「さがす」タブ。曲を追加する唯一の入口（ホームの＋ボタンは廃止）。
// 検索画面を最初から表示し、候補を選ぶと登録フォーム（song/new）へ曲情報を渡して開く。

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/colors';
import { SongSearchView, SongSearchViewHandle } from '../../src/features/songSearch/SongSearchView';
import { SongCandidate } from '../../src/features/songSearch/types';

export default function SearchTabScreen() {
  const insets = useSafeAreaInsets();
  const viewRef = useRef<SongSearchViewHandle>(null);

  useFocusEffect(
    useCallback(() => {
      viewRef.current?.reloadHistory();
    }, []),
  );

  function handleSelect(c: SongCandidate) {
    router.push({
      pathname: '/song/new',
      params: { title: c.title, artist: c.artist, artworkUrl: c.artworkUrl ?? '' },
    });
  }

  function handleManual() {
    router.push('/song/new');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <SongSearchView ref={viewRef} onSelect={handleSelect} onManual={handleManual} bottomInset={0} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
});
