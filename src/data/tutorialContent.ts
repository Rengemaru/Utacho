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

export type TutorialCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

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
  { key: 'E', label: 'よくある質問（FAQ）' },
  { key: 'F', label: '困ったとき' },
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

  // ===== E. よくある質問（FAQ） =====
  {
    id: 'faq-how-to-edit-score', category: 'E', icon: '✏️',
    title: '点数の記録を編集・削除するには？', subtitle: '履歴を左スワイプ',
    steps: [{ emoji: '✏️', title: '履歴を左スワイプ', desc: '曲詳細の点数履歴の行を左にスワイプすると「編集」「削除」が出ます。', illust: 'historyswipe' }],
  },
  {
    id: 'faq-tab-delete', category: 'E', icon: '🏷️',
    title: 'タブを削除したら曲も消える？', subtitle: 'タブは分類ラベル',
    steps: [{ emoji: '🏷️', title: '曲は消えません', desc: 'タブを削除しても、入っていた曲は「すべて」タブに残ります。', illust: 'tabdelete' }],
  },
  {
    id: 'faq-undo-delete', category: 'E', icon: '↩️',
    title: '誤って削除した曲は元に戻せる？', subtitle: 'バックアップから復元',
    steps: [{ emoji: '⤒', title: '復元で戻せる', desc: '削除の取り消しは不可。バックアップがあれば「読み込む」で復元できます。こまめな書き出しを。', illust: 'import' }],
  },
  {
    id: 'faq-key-offset', category: 'E', icon: '🎚️',
    title: 'キー（音の高さ）とは？', subtitle: '原曲比の上げ下げ',
    steps: [{ emoji: '🎚️', title: '原曲比を記録', desc: '例「-2」は原曲より2つ低い。登録/詳細の －/＋ で設定。テンポも同様（点数には影響しません）。', illust: 'detailedit' }],
  },
  {
    id: 'faq-duplicate', category: 'E', icon: '⚠️',
    title: '同じ曲名で確認が出た', subtitle: '重複登録の確認',
    steps: [{ emoji: '⚠️', title: '重複の確認です', desc: '同名・同アーティストが既にある時に表示。意図的なら「それでも登録する」。', illust: 'confirm' }],
  },
  {
    id: 'faq-storage', category: 'E', icon: '🔒',
    title: 'データはどこに保存される？', subtitle: '端末内のみ',
    steps: [{ emoji: '🔒', title: '端末内に保存', desc: 'サーバー送信なし（検索語だけiTunesへ）。アンインストールで消えるのでバックアップを。', illust: 'deviceonly' }],
  },
  {
    id: 'faq-transfer', category: 'E', icon: '📱',
    title: '機種変更で引き継げる？', subtitle: '書き出し → 読み込み',
    steps: [
      { emoji: '⤓', title: '旧端末で書き出し', desc: '設定「バックアップを書き出す」でファイルを保存します。', illust: 'export' },
      { emoji: '⤒', title: '新端末で読み込み', desc: '新端末で「バックアップを読み込む」から復元します。', illust: 'import' },
    ],
  },
  {
    id: 'faq-machine-mix', category: 'E', icon: '🔀',
    title: 'DAMとJOYSOUNDは混ざる？', subtitle: '機種別に分離',
    steps: [{ emoji: '🔀', title: '混ざりません', desc: '機種ごとに別管理。グラフも別の色で表示されます。', illust: 'graph' }],
  },
  {
    id: 'faq-offline', category: 'E', icon: '📶',
    title: 'ネットがなくても使える？', subtitle: '検索のみ要ネット',
    steps: [{ emoji: '📶', title: 'ほぼオフライン可', desc: '記録・閲覧・グラフはオフラインで使えます。曲の検索だけネットが必要です。', illust: 'offline' }],
  },
  {
    id: 'faq-multi-tab', category: 'E', icon: '🔗',
    title: '1曲を複数タブに入れられる？', subtitle: '複数選択できます',
    steps: [{ emoji: '🔗', title: '入れられます', desc: '登録・編集フォームでタブを複数選択できます。', illust: 'multitab' }],
  },
  {
    id: 'faq-price', category: 'E', icon: '💴',
    title: '料金はかかる？', subtitle: '無料',
    steps: [{ emoji: '💴', title: '無料です', desc: 'すべて無料でご利用いただけます。', illust: 'free' }],
  },

  // ===== F. 困ったとき =====
  {
    id: 'ts-swipe-not-working', category: 'F', icon: '👈',
    title: '編集・削除ボタンが出てこない', subtitle: '左にスワイプ',
    steps: [{ emoji: '👈', title: '左へスワイプ', desc: 'カードや履歴の行を左方向へゆっくり。右や上下では反応しません。', illust: 'swipe' }],
  },
  {
    id: 'ts-song-missing-after-tab-delete', category: 'F', icon: '🗂',
    title: 'タブを消したら曲が見当たらない', subtitle: '「すべて」タブで確認',
    steps: [{ emoji: '📑', title: '「すべて」タブへ', desc: '曲は消えていません。上部の「すべて」タブで全曲が表示されます。', illust: 'tabdelete' }],
  },
  {
    id: 'ts-no-graph', category: 'F', icon: '📈',
    title: 'グラフが表示されない', subtitle: '記録2件から',
    steps: [{ emoji: '2️⃣', title: '2件以上で描画', desc: '記録が1件だと線が描けません。同じ曲に2回以上記録すると表示されます。', illust: 'graph' }],
  },
  {
    id: 'ts-graph-one-line', category: 'F', icon: '📉',
    title: '片方の機種しか線が出ない', subtitle: '各機種2件必要',
    steps: [{ emoji: '📉', title: '各機種2件以上で', desc: 'DAM/JOYSOUND それぞれに2件以上あると、両方の線が表示されます。', illust: 'graph' }],
  },
  {
    id: 'ts-no-suggest', category: 'F', icon: '🔎',
    title: '曲の検索結果が出ない', subtitle: 'ネット→別モード→手入力',
    steps: [
      { emoji: '📶', title: 'ネット＆別モード', desc: '接続を確認し、「アーティスト」「キーワード」など別の探し方に切替。', illust: 'offline' },
      { emoji: '✍️', title: '手入力で登録', desc: 'それでも無ければ、さがす右上の「手入力で登録」から入力します。', illust: 'manualbtn' },
    ],
  },
  {
    id: 'ts-restore-failed', category: 'F', icon: '📂',
    title: 'バックアップの読み込みに失敗する', subtitle: '歌帳のファイルのみ',
    steps: [{ emoji: '📂', title: '歌帳のファイルのみ可', desc: '他アプリのファイルや編集したファイルは読めません。正しいファイルか確認を。', illust: 'import' }],
  },
  {
    id: 'ts-data-lost', category: 'F', icon: '😱',
    title: 'データが消えた／前に戻したい', subtitle: 'バックアップから復元',
    steps: [{ emoji: '⤒', title: '復元する', desc: '書き出し済みなら「読み込む」で復元。無い場合は復元できません。', illust: 'import' }],
  },
  {
    id: 'ts-app-glitch', category: 'F', icon: '🔄',
    title: 'アプリの動作がおかしい', subtitle: 'まず再起動',
    steps: [{ emoji: '🔄', title: '再起動する', desc: '一度アプリを終了して再起動。改善しなければお問い合わせください。', illust: 'restart' }],
  },
];
