// 機能ガイドのチュートリアル内容。ヘルプ(helpContent.ts)の「機能ガイド」各項目に対応し、
// 1画面1ステップに分割したもの（1画面1キュー・短文）。
// id は helpContent の該当エントリ id と一致させる。
// illust は TutorialIllustration のミニ図解の種類キー。

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

export type Tutorial = {
  /** helpContent の機能ガイド項目 id と一致 */
  id: string;
  /** 一覧（ハブ）で出すアイコン */
  icon: string;
  /** 一覧・チュートリアルの見出し */
  title: string;
  /** 一覧のサブテキスト */
  subtitle: string;
  /** 手順 */
  steps: TutorialStep[];
};

export const TUTORIALS: Tutorial[] = [
  {
    id: 'add-song',
    icon: '🎵',
    title: '曲を登録・編集・削除する',
    subtitle: '登録・検索・編集・削除の基本',
    steps: [
      { emoji: '＋', title: '曲を登録する', desc: '右上の「＋」から曲を検索して選ぶか、見つからなければ手入力で登録します。', illust: 'add' },
      { emoji: '✏️', title: '曲を編集する', desc: 'カードを左スワイプ（または長押し）して「編集」。「曲を変更」で別の曲にも差し替えられます。', illust: 'swipe' },
      { emoji: '🗑', title: '曲を削除する', desc: '左スワイプ（または長押し）で「削除」。点数の記録も消えるため確認が出ます。', illust: 'swipe' },
    ],
  },
  {
    id: 'itunes-complete',
    icon: '🔎',
    title: '曲を検索して登録する',
    subtitle: '曲/アーティスト/キーワード検索',
    steps: [
      { emoji: '🔎', title: '3つの探し方', desc: '「曲から」「アーティストから」「キーワードで」を切り替えて入力すると候補が出ます。', illust: 'search' },
      { emoji: '🎼', title: '候補を選ぶ', desc: 'タップすると曲名・アーティスト名・アルバムアートがまとめて取り込まれます。', illust: 'search' },
      { emoji: '📶', title: 'ネットが必要', desc: 'この検索はインターネット接続が必要です。見つからないときは「手入力で登録」。', illust: 'offline' },
    ],
  },
  {
    id: 'tabs',
    icon: '🏷️',
    title: 'タブ（カテゴリ）で分類する',
    subtitle: '自由なラベルで曲を整理',
    steps: [
      { emoji: '🏷️', title: '自由に作れる', desc: '「十八番」「練習中」「アニソン」など、好きな名前でタブを作れます。', illust: 'tabpills' },
      { emoji: '⚙️', title: '追加・編集の場所', desc: '設定の「タブを編集する」か、ホームでタブを長押しして操作できます。', illust: 'tabsedit' },
      { emoji: '🔗', title: '複数タブOK', desc: '1曲を複数のタブに入れられます。タブを削除しても曲自体は残ります。', illust: 'multitab' },
    ],
  },
  {
    id: 'local-search',
    icon: '🔍',
    title: '持ち歌リストから曲を探す',
    subtitle: 'かな・部分一致・読みで検索',
    steps: [
      { emoji: '🔍', title: 'その場で絞り込み', desc: '検索バーに入力すると持ち歌が絞り込まれます。一部だけでも見つかります（部分一致）。', illust: 'filter' },
      { emoji: '🈂️', title: '表記を区別しない', desc: 'ひらがな/カタカナ・大小文字・全半角は区別しません。「ヨアソビ」でも「よあそび」でもOK。', illust: 'kana' },
      { emoji: '🕘', title: '読み・履歴で探す', desc: '「読み」を登録すると読みでも検索可。空欄タップで検索履歴から再検索できます。', illust: 'history' },
    ],
  },
  {
    id: 'sort-songs',
    icon: '⇅',
    title: '曲を並び替える',
    subtitle: 'スコア順・五十音順・シャッフル',
    steps: [
      { emoji: '⇅', title: '並び順メニュー', desc: '検索バー右端の「⇅」をタップすると並び順を選べます。', illust: 'sort' },
      { emoji: '📊', title: '多彩な並び順', desc: '最高スコア・記録回数・伸び率・五十音のほか、シャッフルでランダムに並べられます。', illust: 'sort' },
      { emoji: '🔽', title: '昇順/降順', desc: 'メニュー上部で向きを切替。既定以外にすると「⇅」が紫色になります。', illust: 'sortdir' },
    ],
  },
  {
    id: 'setlist',
    icon: '📋',
    title: '今日のセットリストを作る',
    subtitle: '当日歌う曲をまとめる',
    steps: [
      { emoji: '📋', title: '今日歌う曲を選ぶ', desc: '右上の「📋」から曲にチェックして「設定する」。先頭に「📋今日」タブが出ます。', illust: 'setlist' },
      { emoji: '➖', title: '外す・空にする', desc: '「今日」タブで曲を左スワイプ（長押し）で外す、タブ長押しでまとめて空にできます。', illust: 'setlist' },
      { emoji: '🌅', title: '当日限り', desc: 'このリストはその日限り。翌日になると自動でクリアされます。', illust: 'calendar' },
    ],
  },
  {
    id: 'random-pick',
    icon: '🎲',
    title: 'ランダムに曲を選ぶ',
    subtitle: '範囲を選んで1曲おまかせ',
    steps: [
      { emoji: '🎲', title: '範囲を選ぶ', desc: '検索バー右の「🎲」で「すべて」や各タブから範囲を選びます。空のタブは選べません。', illust: 'dice' },
      { emoji: '🎯', title: '1曲おまかせ', desc: '範囲からランダムに1曲選ばれ、詳細へ移動。今日のセットリストからも抽選できます。', illust: 'range' },
    ],
  },
  {
    id: 'record-score',
    icon: '🎤',
    title: '点数を記録する',
    subtitle: 'テンキーで入力・履歴に保存',
    steps: [
      { emoji: '🎤', title: '① 記録を始める', desc: '曲カードの「🎤」か、曲詳細の「点数を記録する」から始めます。', illust: 'recordbtn' },
      { emoji: '🔢', title: '② 点数を入力', desc: '数字ボタンで入力し、日付を確認して「記録する」。何度でも記録できます。', illust: 'numpad' },
      { emoji: '✏️', title: '③ 編集・削除', desc: '曲詳細の点数履歴の行を左にスワイプすると「編集」「削除」が出ます。', illust: 'historyswipe' },
    ],
  },
  {
    id: 'pb-banner',
    icon: '🎉',
    title: '自己ベスト更新をお知らせ',
    subtitle: '最高点更新でお祝いバナー',
    steps: [
      { emoji: '🎉', title: '自動でお祝い', desc: 'これまでの最高点を超えて記録すると「自己ベスト更新！」バナーが自動表示されます。', illust: 'pb' },
      { emoji: '⏳', title: '新規記録のみ', desc: 'バナーはしばらくで自動的に消えます。あとから編集したときには出ません。', illust: 'pb' },
    ],
  },
  {
    id: 'home-summary',
    icon: '📅',
    title: '今日・今月の記録を見る',
    subtitle: 'ホーム上部のサマリー',
    steps: [
      { emoji: '🎤', title: '今日の記録', desc: '記録した日はホーム上部に「今日の記録 ◯曲」とベスト更新数が出ます。', illust: 'summary' },
      { emoji: '📅', title: '今月の記録', desc: 'あわせて「今月 ◯回記録」も表示。記録のない日は出ません（操作不要）。', illust: 'summary' },
    ],
  },
  {
    id: 'graph',
    icon: '📈',
    title: '点数の推移をグラフで見る',
    subtitle: 'DAM/JOYSOUND別の折れ線',
    steps: [
      { emoji: '📈', title: '推移を折れ線で', desc: '曲詳細に点数の折れ線グラフが出ます。DAMとJOYSOUNDは別の色で表示されます。', illust: 'graph' },
      { emoji: '2️⃣', title: '2件以上で描画', desc: '同じ機種に2件以上の記録があると線が描かれます。増えるほど傾向がわかります。', illust: 'graph' },
      { emoji: '🟣', title: 'ベストと最新', desc: '最高点は紫、最新の記録は緑で強調され、ベストと最近の調子がひと目でわかります。', illust: 'graph' },
    ],
  },
  {
    id: 'machine-switch',
    icon: '🔀',
    title: 'DAM / JOYSOUND を切り替える',
    subtitle: '機種ごとに点数を分けて管理',
    steps: [
      { emoji: '🔀', title: '機種で分離', desc: '機種ごとに点数を分けて管理。採点の傾向が違っても混ざりません。', illust: 'toggle' },
      { emoji: '🎚️', title: '当日の機種', desc: '点数入力画面の上部トグルで切替。当日中だけ続き、翌日は初期設定に戻ります。', illust: 'toggle' },
      { emoji: '⚙️', title: '初期設定を変える', desc: '設定の「デフォルト機種」から、ふだん使う機種を変更できます。', illust: 'machdefault' },
    ],
  },
  {
    id: 'backup',
    icon: '💾',
    title: 'データのバックアップと復元',
    subtitle: '書き出し・読み込み',
    steps: [
      { emoji: '⤓', title: '書き出し', desc: '設定の「バックアップを書き出す」で全データをファイル保存。機種変更前におすすめです。', illust: 'export' },
      { emoji: '⤒', title: '復元', desc: '設定の「バックアップを読み込む」でファイルを選ぶと復元。現在のデータは上書きされます。', illust: 'import' },
    ],
  },
];
