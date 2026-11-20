// チュートリアル（コーチマーク）の進み具合。settings テーブルに保存する（AsyncStorage は使わない）。
//
// 3つのパートに分け、その機能を初めて使う場面で1回だけ出す。
//   intro  : 初回起動（ようこそ → さがすタブ → 検索欄 → 手入力）。ホームとさがすタブにまたがる
//   home   : 最初の曲を登録したあとのホーム（🎤 → カード → 🎲/⇅）
//   detail : 曲詳細を初めて開いたとき（機種切替 → キー・テンポ・メモ）

import { getSettingSync, setSettingSync } from '../db/settings';

const KEY_INTRO = 'tutorial_intro';
const KEY_HOME = 'tutorial_home';
const KEY_DETAIL = 'tutorial_detail';
// 旧バージョンの使い方カードを閉じたユーザー（＝既存ユーザー）の印
const KEY_LEGACY_COACH = 'coach_mark_shown';

/**
 * pending=新規ユーザーで未表示 / search=さがすタブ側の続きが未表示 / done=完了 /
 * null=キー未作成（オンボーディング以前から使っている既存ユーザー）
 */
export type IntroState = 'pending' | 'search' | 'done' | null;

/**
 * オンボーディングが終わっているか。終わる前（新規インストール直後）は、ホームがオンボーディング画面の
 * 裏で描画されているだけなので、どのチュートリアルも出さない（見えない部品を測って位置がずれるため）
 */
function isOnboardingDone(): boolean {
  return getSettingSync('onboarding_completed') === 'true';
}

/** オンボーディング前は 'done' 扱いにして何も出さない。完了時に pending が書き込まれる */
export function getIntroState(): IntroState {
  if (!isOnboardingDone()) return 'done';
  const v = getSettingSync(KEY_INTRO);
  return v === 'pending' || v === 'search' || v === 'done' ? v : null;
}

export function setIntroState(state: Exclude<IntroState, null>): void {
  setSettingSync(KEY_INTRO, state);
}

/** ホームのパートを出すべきか（既存ユーザーは旧カードで説明済みのため出さない） */
export function shouldShowHomeTutorial(): boolean {
  return isOnboardingDone() && getSettingSync(KEY_HOME) !== 'done' && getSettingSync(KEY_LEGACY_COACH) !== 'true';
}

export function markHomeTutorialDone(): void {
  setSettingSync(KEY_HOME, 'done');
}

export function shouldShowDetailTutorial(): boolean {
  return isOnboardingDone() && getSettingSync(KEY_DETAIL) !== 'done';
}

export function markDetailTutorialDone(): void {
  setSettingSync(KEY_DETAIL, 'done');
}
