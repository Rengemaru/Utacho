import {
  applyScoreKey,
  clearScoreInput,
  hasScoreInput,
  parseScoreInput,
  SCORE_VALIDATION_ERROR,
  validateScoreInput,
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

    it('101や小数4桁も入力文字列としては受け付け、バリデーションでエラーにできる', () => {
      expect(applyScoreKey('10', '1')).toBe('101');
      expect(applyScoreKey('92.456', '7')).toBe('92.4567');
    });

    it('最大文字数（10文字）を超える入力は無視される', () => {
      expect(applyScoreKey('1234567890', '1')).toBe('1234567890');
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

  describe('validateScoreInput / parseScoreInput / clearScoreInput', () => {
    it('未入力・クリア後は empty になり保存できない', () => {
      const cleared = clearScoreInput();
      expect(hasScoreInput(cleared)).toBe(false);
      expect(validateScoreInput(cleared)).toEqual({
        status: 'empty',
        score: null,
        errorMessage: null,
      });
      expect(parseScoreInput(cleared)).toBeNull();
    });

    it('0点の入力と未入力を区別し、0点は valid として保存できる', () => {
      expect(hasScoreInput('0')).toBe(true);
      expect(validateScoreInput('0')).toEqual({
        status: 'valid',
        score: 0,
        errorMessage: null,
      });
      expect(validateScoreInput('0.000')).toEqual({
        status: 'valid',
        score: 0,
        errorMessage: null,
      });
    });

    it('0〜100点・小数3桁以内は valid になる', () => {
      expect(validateScoreInput('92.450')).toEqual({
        status: 'valid',
        score: 92.45,
        errorMessage: null,
      });
      expect(validateScoreInput('100')).toEqual({
        status: 'valid',
        score: 100,
        errorMessage: null,
      });
      expect(validateScoreInput('100.000')).toEqual({
        status: 'valid',
        score: 100,
        errorMessage: null,
      });
    });

    it('101や小数4桁、小数点末尾は invalid とエラー文言を返す', () => {
      for (const invalidValue of ['101', '101.000', '100.001', '92.4567', '92.', '-1']) {
        expect(validateScoreInput(invalidValue)).toEqual({
          status: 'invalid',
          score: null,
          errorMessage: SCORE_VALIDATION_ERROR,
        });
        expect(parseScoreInput(invalidValue)).toBeNull();
      }
    });

    it('無効入力をバックスペースで直すと再び valid になる', () => {
      const invalid = applyScoreKey('92.456', '7');
      expect(validateScoreInput(invalid).status).toBe('invalid');
      const fixed = applyScoreKey(invalid, '⌫');
      expect(validateScoreInput(fixed)).toEqual({
        status: 'valid',
        score: 92.456,
        errorMessage: null,
      });
    });
  });
});
