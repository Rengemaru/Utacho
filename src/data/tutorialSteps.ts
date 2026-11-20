// チュートリアル（コーチマーク）の各ステップの文言と照らす対象。
// 進み具合の管理は src/lib/tutorial.ts、表示は src/components/CoachMarkTour.tsx。

import type { CoachTargetName } from '../lib/coachTargets';

export type CoachStep = {
  /** 照らす対象。未指定なら画面中央の「ようこそ」カードとして表示 */
  target?: CoachTargetName;
  /** 穴の形（既定は角丸の四角） */
  shape?: 'rect' | 'circle';
  /** 穴の角丸 */
  radius?: number;
  /** 対象の周りの余白 */
  padding?: number;
  /** パート内の番号（1始まり）。ようこそカードには付けない */
  stepNo?: number;
  title: string;
  body: string;
  /** 次へボタンの文言（既定は「次へ →」） */
  nextLabel?: string;
};

export type CoachPart = {
  label: string;
  total: number;
  steps: CoachStep[];
};

const INTRO_LABEL = 'はじめに';
const INTRO_TOTAL = 3;

/** 新規ユーザーの初回起動（ホーム側）：ようこそ → さがすタブ */
export const INTRO_HOME_PART: CoachPart = {
  label: INTRO_LABEL,
  total: INTRO_TOTAL,
  steps: [
    {
      title: '歌帳へようこそ！',
      body: '持ち歌と点数を記録して、\n上達をグラフで見られるアプリです。\nまずは30秒で使い方を見てみましょう。',
      nextLabel: '使い方を見る',
    },
    {
      target: 'tab-search',
      radius: 16,
      padding: 10,
      stepNo: 1,
      title: '曲はここから追加',
      body: '「さがす」で曲名やアーティスト名から探して、持ち歌に追加できます。',
    },
  ],
};

/** 新規ユーザーの初回起動（さがすタブ側）：検索欄 → 手入力 */
export const INTRO_SEARCH_PART: CoachPart = {
  label: INTRO_LABEL,
  total: INTRO_TOTAL,
  steps: [
    {
      target: 'search-input',
      stepNo: 2,
      title: '曲名・歌手名で検索',
      body: '候補をタップすると、曲名・アーティスト・アルバムアートが自動で入ります。',
    },
    {
      target: 'manual-entry',
      radius: 12,
      stepNo: 3,
      title: '見つからないときは',
      body: '検索に出てこない曲は「手入力で登録」から自分で追加できます。',
      nextLabel: 'はじめる',
    },
  ],
};

/** 既存ユーザー向け：＋ボタンの移動のお知らせ（1回だけ） */
export const MOVED_ADD_PART: CoachPart = {
  label: 'お知らせ',
  total: 1,
  steps: [
    {
      target: 'tab-search',
      radius: 16,
      padding: 10,
      stepNo: 1,
      title: '曲の追加は「さがす」から',
      body: '右上の＋ボタンは、下の「さがす」タブに移動しました。手入力での登録もここからできます。',
      nextLabel: 'OK！',
    },
  ],
};

/** 最初の曲を登録したあとのホーム */
export const HOME_PART: CoachPart = {
  label: '曲を追加したら',
  total: 3,
  steps: [
    {
      target: 'song-record',
      shape: 'circle',
      padding: 4,
      stepNo: 1,
      title: '歌ったら点数を記録',
      body: '🎤 をタップしてテンキーで点数を入力。DAM / JOYSOUND も選べます。',
    },
    {
      target: 'song-card',
      radius: 16,
      stepNo: 2,
      title: 'タップで詳細、左スワイプで編集',
      body: 'カードをタップすると推移グラフへ。左にスワイプすると編集・削除ができます。',
    },
    {
      target: 'list-tools',
      radius: 12,
      stepNo: 3,
      title: '迷ったら 🎲、並べ替えは ⇅',
      body: '🎲 でランダムに1曲選曲。⇅ で最高点や最終記録日順に並べ替えられます。',
      nextLabel: 'OK！',
    },
  ],
};

/** 曲詳細を初めて開いたとき */
export const DETAIL_PART: CoachPart = {
  label: '曲詳細',
  total: 2,
  steps: [
    {
      target: 'machine-toggle',
      radius: 12,
      stepNo: 1,
      title: '機種ごとに切り替え',
      body: 'DAM と JOYSOUND で最高点とグラフを分けて表示します。最初はデフォルト機種です。',
    },
    {
      target: 'singing-card',
      radius: 14,
      stepNo: 2,
      title: 'キー・テンポ・メモはここで',
      body: '歌いながら －／＋ でその場で調整できます。変更はすぐ保存されます。',
      nextLabel: 'OK！',
    },
  ],
};
