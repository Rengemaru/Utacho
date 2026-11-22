import {
  applyScoreKey,
  clearScoreInput,
  hasScoreInput,
  parseScoreInput,
} from './scoreInput';

describe('scoreInput', () => {
  describe('applyScoreKey', () => {
    it('未入力から数字と小数を順に入力できる', () => {
      let value = '';
      for (const key of ['9', '2', '.', '4', '5', '6']) {
        value = applyScoreKey(value, key);
      }
      expect(value).toBe('92.456');
    });

    it('小数第4位以降は無視される', () => {
      expect(applyScoreKey('92.456', '7')).toBe('92.456');
    });

    it('100を超える入力は無視される', () => {
      expect(applyScoreKey('100', '0')).toBe('100');
      expect(applyScoreKey('100.', '1')).toBe('100.');
      expect(applyScoreKey('100.', '0')).toBe('100.0');
      expect(applyScoreKey('10', '1')).toBe('10');
    });

    it('未入力や小数点入力済みでの小数点は無視される', () => {
      expect(applyScoreKey('', '.')).toBe('');
      expect(applyScoreKey('92.4', '.')).toBe('92.4');
    });

    it('0の状態で別数字を押すと先頭0を置き換え、0の連打は0のままにする', () => {
      expect(applyScoreKey('', '0')).toBe('0');
      expect(applyScoreKey('0', '0')).toBe('0');
      expect(applyScoreKey('0', '8')).toBe('8');
      expect(applyScoreKey('0', '.')).toBe('0.');
      expect(applyScoreKey('0.', '5')).toBe('0.5');
    });

    it('バックスペースで1文字ずつ削除できる', () => {
      expect(applyScoreKey('92.4', '⌫')).toBe('92.');
      expect(applyScoreKey('9', '⌫')).toBe('');
      expect(applyScoreKey('', '⌫')).toBe('');
    });
  });

  describe('clearScoreInput / hasScoreInput / parseScoreInput', () => {
    it('一括クリアで未入力状態になる', () => {
      const cleared = clearScoreInput();
      expect(cleared).toBe('');
      expect(hasScoreInput(cleared)).toBe(false);
      expect(parseScoreInput(cleared)).toBeNull();
    });

    it('0点の入力と未入力を区別できる', () => {
      expect(hasScoreInput('')).toBe(false);
      expect(parseScoreInput('')).toBeNull();

      expect(hasScoreInput('0')).toBe(true);
      expect(parseScoreInput('0')).toBe(0);

      expect(hasScoreInput('0.000')).toBe(true);
      expect(parseScoreInput('0.000')).toBe(0);
    });

    it('有効な点数を数値に変換し、範囲外は null を返す', () => {
      expect(parseScoreInput('92.450')).toBe(92.45);
      expect(parseScoreInput('100')).toBe(100);
      expect(parseScoreInput('100.001')).toBeNull();
      expect(parseScoreInput('-1')).toBeNull();
    });
  });
});
