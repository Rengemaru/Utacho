/// <reference types="jest" />
import { calendarWeeks, isFutureDatePart, replaceDatePart, shiftCalendarMonth } from './datetime';

describe('記録日のカレンダー', () => {
  it('月曜始まりで日曜開始の月を6行に配置する', () => {
    const weeks = calendarWeeks('2026-11');
    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks[5]).toEqual(['2026-11-30', null, null, null, null, null, null]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it('閏年の2月29日と平年の2月28日を区別する', () => {
    expect(calendarWeeks('2024-02').flat().filter(Boolean)).toHaveLength(29);
    expect(calendarWeeks('2024-02').flat()).toContain('2024-02-29');
    expect(calendarWeeks('2025-02').flat().filter(Boolean)).toHaveLength(28);
    expect(calendarWeeks('2025-02').flat()).not.toContain('2025-02-29');
  });

  it('月曜開始の28日間は4行になる', () => {
    expect(calendarWeeks('2027-02')).toHaveLength(4);
    expect(calendarWeeks('2027-02')[0][0]).toBe('2027-02-01');
  });

  it('年末年始をまたいで前後の月に移動する', () => {
    expect(shiftCalendarMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftCalendarMonth('2026-01', -1)).toBe('2025-12');
  });
});

describe('カレンダーで記録日を変更する', () => {
  it('編集時に元の時刻を変更しない', () => {
    expect(replaceDatePart('2026-11-22T21:35', '2026-10-31')).toBe('2026-10-31T21:35');
  });

  it('日付のみの旧記録に時刻を勝手に追加しない', () => {
    expect(replaceDatePart('2026-11-22', '2024-02-29')).toBe('2024-02-29');
  });

  it('UTC日付が異なる場合もローカルの今日を許可し、翌日を拒否する', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date(2026, 10, 22, 0, 5));
      expect(isFutureDatePart('2026-11-21T23:59')).toBe(false);
      expect(isFutureDatePart('2026-11-22')).toBe(false);
      expect(isFutureDatePart('2026-11-23T00:00')).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
