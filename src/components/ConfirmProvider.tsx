import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export type ConfirmOptionStyle = 'default' | 'primary' | 'danger';
export type ConfirmIconTone = 'accent' | 'red' | 'green';

export interface ConfirmOption {
  label: string;
  description?: string;
  icon?: string;
  style?: ConfirmOptionStyle;
}

export interface ConfirmConfig {
  title: string;
  message?: string;
  icon?: string;
  iconTone?: ConfirmIconTone;
  /** 実行系の選択肢（キャンセルは含めない）。任意個数。 */
  options: ConfirmOption[];
  /** キャンセルの文言。null を渡すとキャンセルを出さない（通知用）。既定: 'キャンセル'。 */
  cancelLabel?: string | null;
}

/** 押された選択肢の index を返す。キャンセル／閉じられた場合は -1。 */
type ConfirmFn = (config: ConfirmConfig) => Promise<number>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error('useConfirm must be used within ConfirmProvider');
  return fn;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);
  const resolveRef = useRef<((index: number) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((cfg) => {
    setConfig(cfg);
    return new Promise<number>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const finish = useCallback((index: number) => {
    setConfig(null);
    const r = resolveRef.current;
    resolveRef.current = null;
    r?.(index);
  }, []);

  const cancelable = config?.cancelLabel !== null;
  const cancelLabel = config?.cancelLabel ?? 'キャンセル';

  // レイアウト判定：説明つき or 選択肢2つ以上なら縦リスト、それ以外は横並びボタン
  const useList = !!config && (
    config.options.length >= 2 || config.options.some((o) => !!o.description)
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        visible={!!config}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => finish(-1)}
      >
        <TouchableWithoutFeedback onPress={() => cancelable && finish(-1)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        {config && (
          <View style={styles.dialog}>
            <View style={styles.body}>
              {config.icon && (
                <View style={[styles.icon, iconToneStyle(config.iconTone)]}>
                  <Text style={styles.iconText}>{config.icon}</Text>
                </View>
              )}
              <Text style={styles.title}>{config.title}</Text>
              {config.message ? <Text style={styles.msg}>{config.message}</Text> : null}
            </View>

            {useList ? (
              <View style={styles.optList}>
                {config.options.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.opt, opt.style === 'primary' && styles.optPrimary]}
                    onPress={() => finish(i)}
                    accessibilityRole="button"
                  >
                    {opt.icon && (
                      <View style={[styles.optIcon, optIconTone(opt.style)]}>
                        <Text style={styles.optIconText}>{opt.icon}</Text>
                      </View>
                    )}
                    <View style={styles.optTextWrap}>
                      <Text style={[styles.optName, opt.style === 'danger' && styles.danger]}>{opt.label}</Text>
                      {opt.description ? <Text style={styles.optDesc}>{opt.description}</Text> : null}
                    </View>
                    <Text style={styles.optChev}>›</Text>
                  </TouchableOpacity>
                ))}
                {cancelable && (
                  <TouchableOpacity style={styles.optCancel} onPress={() => finish(-1)} accessibilityRole="button">
                    <Text style={styles.optCancelText}>{cancelLabel}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.btnRow}>
                {cancelable && (
                  <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => finish(-1)} accessibilityRole="button">
                    <Text style={styles.btnCancelText}>{cancelLabel}</Text>
                  </TouchableOpacity>
                )}
                {config.options.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.btn, opt.style === 'danger' ? styles.btnDanger : styles.btnPrimary]}
                    onPress={() => finish(i)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnActionText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

function iconToneStyle(tone?: ConfirmIconTone) {
  if (tone === 'red') return styles.iconRed;
  if (tone === 'green') return styles.iconGreen;
  return styles.iconAccent;
}
function optIconTone(style?: ConfirmOptionStyle) {
  if (style === 'danger') return styles.optIconRed;
  if (style === 'primary') return styles.optIconAccent;
  return styles.optIconGray;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)' },
  dialog: {
    position: 'absolute', left: 28, right: 28, top: '50%',
    transform: [{ translateY: -120 }],
    backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.25, shadowRadius: 48, elevation: 12,
  },
  body: { padding: 20, paddingBottom: 14 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  iconAccent: { backgroundColor: colors.accentSoft },
  iconRed: { backgroundColor: 'rgba(239,68,68,0.1)' },
  iconGreen: { backgroundColor: 'rgba(0,185,107,0.1)' },
  iconText: { fontSize: 20 },
  title: { fontFamily: fonts.jakartaBold, fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  msg: { fontSize: 13, color: colors.text2, lineHeight: 20 },
  // button row (2択)
  btnRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 18, paddingTop: 2 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  btnCancel: { backgroundColor: colors.surface2 },
  btnCancelText: { fontSize: 13, fontWeight: '700', color: colors.text2 },
  btnPrimary: { backgroundColor: colors.accent },
  btnDanger: { backgroundColor: colors.red },
  btnActionText: { fontSize: 13, fontWeight: '700', color: colors.white },
  // option list (多択)
  optList: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 13, padding: 12, backgroundColor: colors.white,
  },
  optPrimary: { borderColor: 'rgba(91,76,245,0.35)', backgroundColor: colors.accentSoft },
  optIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optIconAccent: { backgroundColor: colors.accentSoft },
  optIconRed: { backgroundColor: 'rgba(239,68,68,0.1)' },
  optIconGray: { backgroundColor: colors.surface2 },
  optIconText: { fontSize: 16 },
  optTextWrap: { flex: 1, minWidth: 0 },
  optName: { fontSize: 13, fontWeight: '600', color: colors.text },
  danger: { color: colors.red },
  optDesc: { fontSize: 10.5, color: colors.text3, marginTop: 2, lineHeight: 15 },
  optChev: { fontSize: 18, color: colors.text3 },
  optCancel: { alignItems: 'center', paddingVertical: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 13 },
  optCancelText: { fontSize: 13, fontWeight: '600', color: colors.text2 },
});
