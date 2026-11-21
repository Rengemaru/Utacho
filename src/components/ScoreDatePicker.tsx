import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { calendarWeeks, formatDateTime, shiftCalendarMonth, todayDateString } from '../lib/datetime';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

interface Props {
  initialDate: string;
  onSelect: (date: string) => void;
  onCancel: () => void;
}

/** 点数入力と同じシート内で開く、U07のカレンダー。確定するまで記録日は変えない。 */
export function ScoreDatePicker({ initialDate, onSelect, onCancel }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(initialDate.slice(0, 7));
  const today = todayDateString();
  const nextMonthDisabled = shiftCalendarMonth(month, 1) > today.slice(0, 7);
  const [year, monthNumber] = month.split('-').map(Number);

  function selectToday() {
    setSelectedDate(today);
    setMonth(today.slice(0, 7));
  }

  return (
    <>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>記録日を選択</Text>
        <TouchableOpacity onPress={onCancel} accessibilityRole="button" style={styles.cancel}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.monthRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="前の月"
            onPress={() => setMonth((value) => shiftCalendarMonth(value, -1))}
            style={styles.monthButton}
          >
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.month}>
            {year}年{monthNumber}月
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="次の月"
            accessibilityState={{ disabled: nextMonthDisabled }}
            disabled={nextMonthDisabled}
            onPress={() => setMonth((value) => shiftCalendarMonth(value, 1))}
            style={styles.monthButton}
          >
            <Text style={[styles.arrow, nextMonthDisabled && styles.disabledText]}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.week}>
          {WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
        </View>
        {calendarWeeks(month).map((week, index) => (
          <View key={index} style={styles.week}>
            {week.map((date, weekday) => {
              if (date === null) return <View key={weekday} style={styles.daySlot} />;
              const disabled = date > today;
              const selected = date === selectedDate;
              const isToday = date === today;
              return (
                <View key={date} style={styles.daySlot}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDateTime(date)}${isToday ? ' 今日' : ''}`}
                    accessibilityState={{ selected, disabled }}
                    hitSlop={2}
                    disabled={disabled}
                    onPress={() => setSelectedDate(date)}
                    style={[styles.day, isToday && styles.today, selected && styles.selectedDay]}
                  >
                    <Text style={[
                      styles.dayText,
                      disabled && styles.disabledText,
                      isToday && styles.todayText,
                      selected && styles.selectedText,
                    ]}>
                      {Number(date.slice(-2))}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <View style={styles.selectionRow}>
        <Text accessibilityLiveRegion="polite" style={styles.selection}>
          選択日：{formatDateTime(selectedDate)}（{WEEKDAYS[(new Date(`${selectedDate}T12:00:00`).getDay() + 6) % 7]}）
        </Text>
        <TouchableOpacity onPress={selectToday} accessibilityRole="button" style={styles.todayButton}>
          <Text style={styles.todayButtonText}>今日に戻す</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: selectedDate > today }}
        disabled={selectedDate > today}
        onPress={() => onSelect(selectedDate)}
        style={[styles.confirm, selectedDate > today && styles.disabledButton]}
      >
        <Text style={styles.confirmText}>この日付にする</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  cancel: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  cancelText: { fontSize: 12, color: colors.text2 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingBottom: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 24, fontWeight: '700', color: colors.accent },
  month: { fontSize: 14, fontWeight: '700', color: colors.text },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.text2, paddingVertical: 10 },
  daySlot: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  day: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.text },
  today: { borderWidth: 1, borderColor: colors.accent },
  todayText: { color: colors.accent },
  selectedDay: { backgroundColor: colors.accent },
  selectedText: { color: colors.white },
  disabledText: { color: colors.text3 },
  selectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  selection: { fontSize: 11, color: colors.text2 },
  todayButton: { minHeight: 44, justifyContent: 'center' },
  todayButtonText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  confirm: { backgroundColor: colors.accent, borderRadius: 12, alignItems: 'center', paddingVertical: 13 },
  confirmText: { fontSize: 13, fontWeight: '700', color: colors.white },
  disabledButton: { backgroundColor: colors.text3 },
});
