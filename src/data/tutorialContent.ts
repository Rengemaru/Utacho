// 機能ガイドのチュートリアル内容。「やりたいこと（ユースケース）」ごとのフローで構成する。
// カテゴリ A〜D で見出しグループ化し、各フローは手順＋ミニ図解(illust)を持つ。
// illust は TutorialIllustration の kind。

export type TutorialStep = {
  /** 見出しの前に出すアイコン絵文字 */
  emoji: string;
  /** ステップ見出し */
  title: string;
  /** 1〜2行の説明（短く） */
  desc: string;
  /** ミニ図解の種類（TutorialIllustration の kind） */
  illust: string;
};

export type TutorialCategory = 'A' | 'B' | 'C' | 'D';

export type Tutorial = {
  id: string;
  /** グループ分け用カテゴリ */
  category: TutorialCategory;
  /** 一覧（ハブ）で出すアイコン */
  icon: string;
  /** ユースケースの見出し（やりたいこと） */
  title: string;
  /** 一覧のサブテキスト（フローの要約） */
  subtitle: string;
  /** 手順 */
  steps: TutorialStep[];
};

export const CATEGORIES: { key: TutorialCategory; label: string }[] = [
  { key: 'A', label: 'そろえる・整える' },
  { key: 'B', label: '歌う曲を選ぶ（当日）' },
  { key: 'C', label: '記録・ふりかえり' },
  { key: 'D', label: '設定・データ' },
];

export const TUTORIALS: Tutorial[] = [
  // ===== A. そろえる・整える =====
  {
    id: 'uc-add',
    category: 'A',
    icon: '🎵',
    title: '新しい持ち歌を登録する',
    subtitle: 'さがす → 検索 → 追加',
    steps: [
      { emoji: '🔍', title: '「さがす」を開く', desc: '画面下の「さがす」タブから曲の検索を始めます。', illust: 'searchtab' },
      { emoji: '🎼', title: '検索して選ぶ', desc: '「曲から／アーティスト／キーワード」で探し、候補をタップで取り込み。', illust: 'search' },
      { emoji: '🎚️', title: 'キー・テンポ・メモ', desc: 'フォームでキー・テンポ・メモも設定して「追加」。', illust: 'detailedit' },
    ],
  },
  {
    id: 'uc-manual',
    category: 'A',
    icon: '✍️',
    title: '見つからない曲を手入力で登録する',
    subtitle: 'さがす → 手入力で登録 → 入力',
    steps: [
      { emoji: '🔍', title: '「さがす」を開く', desc: '画面下の「さがす」タブを開きます。', illust: 'searchtab' },
      { emoji: '✍️', title: '「手入力で登録」を押す', desc: '検索画面の右上にある「手入力で登録」ボタンをタップします。', illust: 'manualbtn' },
      { emoji: '📝', title: '入力して追加', desc: '曲名・アーティストを入力し、タブやキーも設定して「追加」。', illust: 'form' },
    ],
  },
  {
    id: 'uc-edit',
    category: 'A',
    icon: '✏️',
    title: '曲を直す・削除する',
    subtitle: 'キー/テンポ調整 → 編集 → 削除',
    steps: [
      { emoji: '🎚️', title: 'キー・テンポを直す', desc: '曲詳細画面で －/＋ でその場調整（すぐ保存）。', illust: 'detailedit' },
      { emoji: '✏️', title: '内容を編集する', desc: 'カードを左スワイプ→「編集」で曲名・アーティスト・読み・タブを変更。', illust: 'swipe' },
      { emoji: '🗑', title: '削除する', desc: '左スワイプ→「削除」。点数の記録も消えるため確認が出ます。', illust: 'swipe' },
    ],
  },
  {
    id: 'uc-tabs',
    category: 'A',
    icon: '🏷️',
    title: 'タブで整理する',
    subtitle: '設定 → タブを作る → 分類',
    steps: [
      { emoji: '⚙️', title: '設定を開く', desc: '画面下の「設定」タブを開きます。', illust: 'settingstab' },
      { emoji: '🏷️', title: 'タブを作る', desc: '「タブを編集する」から作成。ホームでタブ長押しからも作れます。', illust: 'tabsedit' },
      { emoji: '🔗', title: '曲を複数タブへ', desc: '1曲を複数タブに入れられます（登録・編集フォームで選択）。', illust: 'multitab' },
      { emoji: '🗂', title: '並べ替え・削除', desc: '「タブを編集する」で並べ替え・削除。曲自体は消えません。', illust: 'tabsedit' },
    ],
  },

  // ===== B. 歌う曲を選ぶ（当日） =====
  {
    id: 'uc-find',
    category: 'B',
    icon: '🔍',
    title: '持ち歌をすばやく探す',
    subtitle: '検索バー・かな・読み・履歴',
    steps: [
      { emoji: '🔍', title: '検索バーで絞り込み', desc: '曲名・アーティストを一部入力すると絞り込まれます（部分一致）。', illust: 'filter' },
      { emoji: '🈂️', title: '表記を区別しない', desc: 'かな/カナ・大小・全半角を区別せず、「読み」でも探せます。', illust: 'kana' },
      { emoji: '🕘', title: '履歴から再検索', desc: '検索バーの空欄タップで、過去の検索語から再検索できます。', illust: 'history' },
    ],
  },
  {
    id: 'uc-sort',
    category: 'B',
    icon: '⇅',
    title: '並び替えて選ぶ',
    subtitle: 'スコア順・五十音・シャッフル',
    steps: [
      { emoji: '⇅', title: '並び順メニュー', desc: '検索バー右端の「⇅」で並び順を選びます（伸び率・シャッフル等）。', illust: 'sort' },
      { emoji: '🔽', title: '昇順/降順', desc: '上部で向きを切替。既定以外にすると「⇅」が紫色になります。', illust: 'sortdir' },
    ],
  },
  {
    id: 'uc-setlist',
    category: 'B',
    icon: '📋',
    title: '今日のセットリストを作る',
    subtitle: '当日歌う曲をまとめる',
    steps: [
      { emoji: '📋', title: '今日の曲を選ぶ', desc: '「📋」で曲にチェック→設定。先頭に「📋今日」タブが出ます。', illust: 'setlist' },
      { emoji: '➖', title: '外す・空にする', desc: '今日タブで左スワイプで外す、タブ長押しでまとめて空に。', illust: 'setlist' },
      { emoji: '🌅', title: '当日限り', desc: 'このリストはその日限り。翌日になると自動でクリアされます。', illust: 'calendar' },
    ],
  },
  {
    id: 'uc-random',
    category: 'B',
    icon: '🎲',
    title: 'ランダムで選ぶ',
    subtitle: '迷ったらおまかせ1曲',
    steps: [
      { emoji: '🎲', title: 'さいころを押す', desc: '検索バーのすぐ右にある「🎲」をタップします。', illust: 'dice' },
      { emoji: '🎯', title: '範囲から1曲', desc: 'すべて／各タブ／今日 から範囲を選ぶと1曲選ばれ、詳細へ移動。', illust: 'range' },
    ],
  },

  // ===== C. 記録・ふりかえり =====
  {
    id: 'uc-record',
    category: 'C',
    icon: '🎤',
    title: '点数を記録する',
    subtitle: '入力 → 機種 → 編集',
    steps: [
      { emoji: '🎤', title: '記録を始める', desc: '曲カードの「🎤」か、曲詳細の「点数を記録する」から始めます。', illust: 'recordbtn' },
      { emoji: '🔢', title: '点数を入力', desc: 'テンキーで入力し、日付を確認して「記録する」。', illust: 'numpad' },
      { emoji: '🎚️', title: '機種を選ぶ', desc: 'DAM/JOYSOUNDトグルで当日の機種を切替（当日限り）。', illust: 'toggle' },
      { emoji: '✏️', title: '記録を直す', desc: '詳細の点数履歴の行を左スワイプで編集・削除できます。', illust: 'historyswipe' },
    ],
  },
  {
    id: 'uc-review',
    category: 'C',
    icon: '📈',
    title: '上達をふりかえる',
    subtitle: 'グラフ・自己ベスト・サマリー',
    steps: [
      { emoji: '📈', title: '推移をグラフで', desc: '曲詳細に折れ線グラフ。DAMとJOYSOUNDは別の色で表示。', illust: 'graph' },
      { emoji: '🟣', title: 'ベストと最新', desc: '最高点は紫・最新は緑で強調。2件以上の記録で描かれます。', illust: 'graph' },
      { emoji: '🎉', title: '自己ベスト更新', desc: '最高点を超えて記録するとお祝いバナーが自動表示されます。', illust: 'pb' },
      { emoji: '📅', title: '今日・今月', desc: 'ホーム上部に今日の曲数・今月の記録回数がまとまります。', illust: 'summary' },
    ],
  },

  // ===== D. 設定・データ =====
  {
    id: 'uc-machine',
    category: 'D',
    icon: '🔀',
    title: '機種を設定する',
    subtitle: 'デフォルトと当日の切替',
    steps: [
      { emoji: '🎚️', title: '当日の機種', desc: '記録画面のトグルで、その日だけ機種を切り替えられます。', illust: 'toggle' },
      { emoji: '⚙️', title: 'デフォルト機種', desc: '設定「デフォルト機種」で、ふだん使う機種を変更できます。', illust: 'machdefault' },
    ],
  },
  {
    id: 'uc-data',
    category: 'D',
    icon: '💾',
    title: 'データを守る・初期化する',
    subtitle: 'バックアップ・復元・全削除',
    steps: [
      { emoji: '⤓', title: '書き出し', desc: '設定「バックアップを書き出す」で全データを保存（機種変更前に）。', illust: 'export' },
      { emoji: '⤒', title: '復元', desc: '「バックアップを読み込む」で復元（直後は取り消しも可能）。', illust: 'import' },
      { emoji: '🗑', title: 'すべて削除', desc: '「すべてのデータを削除」（バックアップして削除も選べます）。', illust: 'deleteall' },
    ],
  },
];
