// チュートリアル各手順のミニ図解。kind ごとに、対象UIを簡略化した分かりやすい図を描く。
// 実アプリのデザイントークン（accent/DAM/JOY・角丸）に合わせる。
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

// ---- 小さな部品 ----
function Chip({ label, tone = 'plain' }: { label: string; tone?: 'plain' | 'active' | 'muted' }) {
  return (
    <View style={[s.chip, tone === 'active' && s.chipActive, tone === 'muted' && s.chipMuted]}>
      <Text style={[s.chipText, tone === 'active' && s.chipTextActive, tone === 'muted' && s.chipTextMuted]}>{label}</Text>
    </View>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <View style={s.row}>{children}</View>;
}
function SettingRow({ icon, label, right }: { icon: string; label: string; right?: string }) {
  return (
    <View style={s.settingRow}>
      <Text style={s.settingIcon}>{icon}</Text>
      <Text style={s.settingLabel}>{label}</Text>
      <Text style={s.settingRight}>{right ?? '›'}</Text>
    </View>
  );
}
function MiniCard({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={s.miniCard}>
      <View style={s.thumb}><Text style={{ fontSize: 13 }}>🎵</Text></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.miniTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={s.miniSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}
function HiBox({ children }: { children: React.ReactNode }) {
  // accent のリングで強調
  return <View style={s.hi}>{children}</View>;
}

function Content({ kind }: { kind: string }) {
  switch (kind) {
    case 'add':
      return (
        <View style={s.phoneHeader}>
          <Text style={s.appTitle}>歌帳</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <View style={s.iconBtnGray}><Text>📋</Text></View>
            <HiBox><View style={s.iconBtnAccent}><Text style={{ color: '#fff', fontSize: 16 }}>＋</Text></View></HiBox>
          </View>
        </View>
      );
    case 'swipe':
      return (
        <View style={{ gap: 4, alignItems: 'center' }}>
          <Row>
            <Text style={s.arrow}>←</Text>
            <View style={[s.miniCard, { flex: 0, width: 120 }]}><Text style={s.miniTitle}>Pretender</Text></View>
            <View style={[s.actTile, { backgroundColor: colors.accent }]}><Text style={s.actText}>✏️{'\n'}編集</Text></View>
            <View style={[s.actTile, { backgroundColor: colors.red }]}><Text style={s.actText}>🗑{'\n'}削除</Text></View>
          </Row>
          <Text style={s.cap}>左にスワイプ</Text>
        </View>
      );
    case 'search':
      return (
        <View style={{ gap: 6, width: '100%' }}>
          <Row><Chip label="曲から" tone="active" /><Chip label="アーティスト" /><Chip label="キーワード" /></Row>
          <View style={s.field}><Text style={s.fieldText}>🔍 YOASOBI</Text></View>
          <MiniCard title="アイドル" sub="YOASOBI" />
        </View>
      );
    case 'offline':
      return (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 26 }}>📶</Text>
          <Text style={s.cap}>検索はネット接続が必要</Text>
          <Chip label="✏️ 手入力で登録" tone="active" />
        </View>
      );
    case 'tabpills':
      return <Row><Chip label="十八番" tone="active" /><Chip label="練習中" /><Chip label="アニソン" /></Row>;
    case 'tabsedit':
      return <SettingRow icon="🗂" label="タブを編集する" />;
    case 'multitab':
      return (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={s.miniCard}><View style={s.thumb}><Text style={{ fontSize: 13 }}>🎵</Text></View><Text style={s.miniTitle}>1曲</Text></View>
          <Text style={s.arrowDown}>↓</Text>
          <Row><Chip label="十八番" tone="active" /><Chip label="アニソン" tone="active" /></Row>
        </View>
      );
    case 'filter':
      return (
        <View style={{ gap: 6, width: '100%' }}>
          <View style={s.field}><Text style={s.fieldText}>🔍 よる</Text></View>
          <HiBox><MiniCard title="夜に駆ける" sub="YOASOBI" /></HiBox>
        </View>
      );
    case 'kana':
      return (
        <Row>
          <Chip label="ヨアソビ" tone="active" />
          <Text style={s.equals}>＝</Text>
          <Chip label="よあそび" tone="active" />
        </Row>
      );
    case 'history':
      return (
        <View style={{ gap: 5, width: '100%' }}>
          <View style={s.field}><Text style={s.fieldText}>🔍 （空欄タップ）</Text></View>
          {['Pretender', '夜に駆ける'].map((h) => (
            <View key={h} style={s.histRow}><Text style={s.histClock}>🕘</Text><Text style={s.histText}>{h}</Text><Text style={s.histX}>✕</Text></View>
          ))}
        </View>
      );
    case 'sort':
      return (
        <View style={{ gap: 6, width: '100%', alignItems: 'center' }}>
          <HiBox><View style={s.iconBtnGray}><Text style={{ fontSize: 15 }}>⇅</Text></View></HiBox>
          <View style={s.menu}>
            <Text style={[s.menuItem, s.menuItemActive]}>🏆 最高スコア ✓</Text>
            <Text style={s.menuItem}>🔢 記録回数</Text>
            <Text style={s.menuItem}>🔀 シャッフル</Text>
          </View>
        </View>
      );
    case 'sortdir':
      return <Row><Chip label="昇順 ↑" /><Chip label="降順 ↓" tone="active" /></Row>;
    case 'setlist':
      return (
        <View style={{ gap: 6, width: '100%' }}>
          <Chip label="📋 今日" tone="active" />
          {[['Pretender', true], ['夜に駆ける', false]].map(([n, c]) => (
            <View key={n as string} style={s.checkRow}>
              <View style={[s.checkbox, c && s.checkboxOn]}>{c ? <Text style={s.checkMark}>✓</Text> : null}</View>
              <Text style={s.miniTitle}>{n as string}</Text>
            </View>
          ))}
        </View>
      );
    case 'calendar':
      return (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 26 }}>🌅</Text>
          <Text style={s.cap}>翌日になると自動でクリア</Text>
        </View>
      );
    case 'dice':
      return <HiBox><View style={s.iconBtnGray}><Text style={{ fontSize: 16 }}>🎲</Text></View></HiBox>;
    case 'range':
      return (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={s.cap}>どの中から選ぶ？</Text>
          <Row><Chip label="すべて" tone="active" /><Chip label="J-POP" /><Chip label="アニソン" tone="muted" /></Row>
        </View>
      );
    case 'recordbtn':
      return (
        <MiniCard
          title="Pretender"
          sub="Official髭男dism"
          right={<HiBox><View style={s.recBtn}><Text style={{ fontSize: 14 }}>🎤</Text></View></HiBox>}
        />
      );
    case 'numpad':
      return (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={s.scoreField}><Text style={s.scoreText}>92.450</Text></View>
          <View style={s.pad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
              <View key={k} style={s.key}><Text style={s.keyText}>{k}</Text></View>
            ))}
          </View>
        </View>
      );
    case 'historyswipe':
      return (
        <View style={{ gap: 4, alignItems: 'center' }}>
          <Row>
            <Text style={s.arrow}>←</Text>
            <View style={[s.miniCard, { flex: 0, width: 110 }]}><Text style={s.miniSub}>11/10</Text><Text style={[s.miniTitle, { fontFamily: fonts.monoMedium }]}>92.450</Text></View>
            <View style={[s.actTile, { backgroundColor: colors.accent }]}><Text style={s.actText}>✏️{'\n'}編集</Text></View>
            <View style={[s.actTile, { backgroundColor: colors.red }]}><Text style={s.actText}>🗑{'\n'}削除</Text></View>
          </Row>
          <Text style={s.cap}>履歴の行を左スワイプ</Text>
        </View>
      );
    case 'pb':
      return (
        <View style={s.pbBanner}>
          <Text style={s.pbText}>🎉 自己ベスト更新！</Text>
          <Text style={s.pbPt}>+2.300pt</Text>
        </View>
      );
    case 'summary':
      return (
        <View style={{ gap: 6, width: '100%' }}>
          <View style={s.sumToday}><Text style={s.sumTodayText}>🎤 今日の記録</Text><Text style={s.sumNum}>3曲</Text><Text style={s.sumPb}>🎉1</Text></View>
          <View style={s.sumMonth}><Text style={s.sumMonthText}>📅 今月 12回記録</Text></View>
        </View>
      );
    case 'graph':
      return (
        <View style={s.graphBox}>
          {/* 2本の折れ線をドットで簡易表現 */}
          <View style={[s.gdot, { left: 8, bottom: 14, backgroundColor: colors.dam }]} />
          <View style={[s.gdot, { left: 40, bottom: 22, backgroundColor: colors.dam }]} />
          <View style={[s.gdot, { left: 72, bottom: 40, backgroundColor: colors.accent, width: 9, height: 9, borderRadius: 5 }]} />
          <View style={[s.gdot, { left: 104, bottom: 34, backgroundColor: colors.green }]} />
          <View style={[s.gdot, { left: 8, bottom: 8, backgroundColor: colors.joy }]} />
          <View style={[s.gdot, { left: 72, bottom: 16, backgroundColor: colors.joy }]} />
          <Text style={s.graphLegend}>● DAM  ● JOY  ／ 最高=紫 最新=緑</Text>
        </View>
      );
    case 'toggle':
      return (
        <View style={s.toggle}>
          <View style={s.toggleOn}><Text style={s.toggleOnText}>DAM</Text></View>
          <Text style={s.toggleOff}>JOYSOUND</Text>
        </View>
      );
    case 'machdefault':
      return <SettingRow icon="🎤" label="デフォルト機種" right="DAM ›" />;
    case 'export':
      return <SettingRow icon="⤓" label="バックアップを書き出す" />;
    case 'import':
      return <SettingRow icon="⤒" label="バックアップを読み込む" />;
    case 'searchtab':
      return (
        <View style={s.navbar}>
          <View style={s.navItem}><Text style={s.navEmoji}>♪</Text><Text style={s.navLabel}>曲一覧</Text></View>
          <HiBox>
            <View style={s.navItemHi}><Text style={s.navEmoji}>🔍</Text><Text style={s.navLabelHi}>さがす</Text></View>
          </HiBox>
          <View style={s.navItem}><Text style={s.navEmoji}>⚙️</Text><Text style={s.navLabel}>設定</Text></View>
        </View>
      );
    case 'manualbtn':
      return (
        <View style={{ gap: 8, width: '100%', alignItems: 'center' }}>
          <View style={[s.field, { width: '100%' }]}><Text style={s.fieldText}>🔍 曲・アーティストを検索</Text></View>
          <HiBox>
            <View style={s.manualBtn}><Text style={s.manualBtnText}>✍️ 手入力で登録</Text></View>
          </HiBox>
        </View>
      );
    case 'form':
      return (
        <View style={{ gap: 6, width: '100%' }}>
          <View style={s.field}><Text style={s.fieldText}>曲名</Text></View>
          <View style={s.field}><Text style={s.fieldText}>アーティスト</Text></View>
          <Row><Chip label="十八番" /><Chip label="＋ 新規" /></Row>
        </View>
      );
    case 'deleteall':
      return (
        <View style={[s.settingRow, { borderColor: 'rgba(239,68,68,0.35)' }]}>
          <Text style={s.settingIcon}>🗑</Text>
          <Text style={[s.settingLabel, { color: colors.red }]}>すべてのデータを削除</Text>
          <Text style={s.settingRight}>›</Text>
        </View>
      );
    case 'detailedit':
      return (
        <View style={{ gap: 8, width: '100%' }}>
          {[['キー', '±0'], ['テンポ', '♩ 0']].map(([lb, v]) => (
            <View key={lb} style={s.stepperRow}>
              <Text style={s.stepperLabel}>{lb}</Text>
              <View style={s.stepper}>
                <Text style={s.stepBtn}>－</Text>
                <Text style={s.stepVal}>{v}</Text>
                <Text style={s.stepBtn}>＋</Text>
              </View>
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

export function TutorialIllustration({ kind }: { kind: string }) {
  return (
    <View style={s.box}>
      <Content kind={kind} />
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    width: '100%',
    minHeight: 112,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipMuted: { backgroundColor: '#e5e7eb', borderColor: '#e5e7eb' },
  chipText: { fontSize: 10, color: colors.text2, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  chipTextMuted: { color: colors.text3 },
  phoneHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8 },
  appTitle: { fontFamily: fonts.jakartaBold, fontSize: 14, color: colors.text },
  iconBtnGray: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnAccent: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  hi: { padding: 3, borderRadius: 11, borderWidth: 2, borderColor: colors.accent },
  arrow: { fontSize: 16, color: colors.accent, fontWeight: '700' },
  arrowDown: { fontSize: 16, color: colors.text3 },
  equals: { fontSize: 14, color: colors.text2, fontWeight: '700' },
  actTile: { width: 36, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actText: { color: colors.white, fontSize: 8, fontWeight: '700', textAlign: 'center' },
  miniCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, width: '100%' },
  thumb: { width: 26, height: 26, borderRadius: 7, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  miniTitle: { fontSize: 11, fontWeight: '600', color: colors.text },
  miniSub: { fontSize: 9, color: colors.text3 },
  field: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  fieldText: { fontSize: 10, color: colors.text3 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, width: '100%' },
  settingIcon: { fontSize: 14 },
  settingLabel: { flex: 1, fontSize: 11, color: colors.text, fontWeight: '600' },
  settingRight: { fontSize: 11, color: colors.text3 },
  cap: { fontSize: 10, color: colors.text3, textAlign: 'center' },
  menu: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 6, width: 160 },
  menuItem: { fontSize: 10, color: colors.text2, paddingVertical: 3 },
  menuItemActive: { color: colors.accent, fontWeight: '700' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  histClock: { fontSize: 11 },
  histText: { flex: 1, fontSize: 10, color: colors.text },
  histX: { fontSize: 10, color: colors.text3 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  checkbox: { width: 16, height: 16, borderRadius: 5, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: colors.white, fontSize: 10, fontWeight: '700' },
  recBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.accentSoft, borderWidth: 1.5, borderColor: 'rgba(91,76,245,0.3)', alignItems: 'center', justifyContent: 'center' },
  scoreField: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 4 },
  scoreText: { fontFamily: fonts.monoMedium, fontSize: 14, color: colors.accent },
  pad: { width: 108, flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  key: { width: 32, height: 20, borderRadius: 5, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.text },
  pbBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,185,107,0.12)', borderWidth: 1, borderColor: 'rgba(0,185,107,0.3)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  pbText: { fontSize: 12, fontWeight: '700', color: colors.green },
  pbPt: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.green },
  sumToday: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentSoft, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  sumTodayText: { fontSize: 11, fontWeight: '600', color: colors.accent },
  sumNum: { fontSize: 11, fontWeight: '700', color: colors.accent },
  sumPb: { fontSize: 11, color: colors.green },
  sumMonth: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  sumMonthText: { fontSize: 11, color: colors.text2 },
  graphBox: { width: '100%', height: 86, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  gdot: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  graphLegend: { position: 'absolute', bottom: 4, width: '100%', textAlign: 'center', fontSize: 8, color: colors.text3 },
  toggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 10, padding: 3, width: 200 },
  toggleOn: { flex: 1, backgroundColor: colors.white, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  toggleOnText: { fontSize: 11, fontWeight: '600', color: colors.accent },
  toggleOff: { flex: 1, fontSize: 11, color: colors.text2, textAlign: 'center' },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 8, width: '100%' },
  navItem: { alignItems: 'center', gap: 2 },
  navItemHi: { alignItems: 'center', gap: 2, paddingHorizontal: 10 },
  navEmoji: { fontSize: 14 },
  navLabel: { fontSize: 9, color: colors.text3 },
  navLabelHi: { fontSize: 9, color: colors.accent, fontWeight: '700' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  stepperLabel: { fontSize: 11, color: colors.text2, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { fontSize: 15, color: colors.accent, fontWeight: '700' },
  stepVal: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text, minWidth: 30, textAlign: 'center' },
  manualBtn: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(91,76,245,0.3)', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 7 },
  manualBtnText: { fontSize: 11, fontWeight: '700', color: colors.accent },
});
