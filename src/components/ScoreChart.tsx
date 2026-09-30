import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '../constants/colors';
import { datePartOf } from '../lib/datetime';
import { ScoreRow } from '../types';

interface Props {
  scores: ScoreRow[];
}

type ChartPoint = {
  value: number;
  label?: string;
  dataPointColor?: string;
  dataPointRadius?: number;
};

/**
 * 軸ラベルを決める。日付が変わった点（とその日の最初）と時刻を持たない旧データは
 * 「M/D」を表示し、同じ日の2点目以降は「HH:MM」を表示する。
 * これで同じ日に複数回歌った記録も時刻で区別できる。
 */
function buildLabel(scoreRows: ScoreRow[], i: number): string {
  const cur = scoreRows[i].scored_at;
  const curDate = datePartOf(cur);
  const time = cur.split('T')[1];
  const prevDate = i > 0 ? datePartOf(scoreRows[i - 1].scored_at) : null;

  if (curDate !== prevDate || !time) {
    const [, m, d] = curDate.split('-');
    return `${Number(m)}/${Number(d)}`;
  }
  return time;
}

function buildChartData(
  scoreRows: ScoreRow[],
  baseColor: string
): ChartPoint[] {
  if (scoreRows.length === 0) return [];

  const maxValue = Math.max(...scoreRows.map((s) => s.score));
  const latestIndex = scoreRows.length - 1;

  return scoreRows.map((s, i) => {
    const isMax = s.score === maxValue;
    const isLatest = i === latestIndex;

    let dataPointColor = baseColor;
    let dataPointRadius = 4;

    if (isMax) {
      dataPointColor = colors.accent;
      dataPointRadius = 6;
    } else if (isLatest) {
      dataPointColor = colors.green;
      dataPointRadius = 5;
    }

    return {
      value: s.score,
      label: buildLabel(scoreRows, i),
      dataPointColor,
      dataPointRadius,
    };
  });
}

export function ScoreChart({ scores }: Props) {
  const { width: screenWidth } = useWindowDimensions();

  const chronological = [...scores].reverse();
  const damScores = chronological.filter((s) => s.machine === 'DAM');
  const joyScores = chronological.filter((s) => s.machine === 'JOYSOUND');

  const hasDam = damScores.length > 0;
  const hasJoy = joyScores.length > 0;

  const allValues = chronological.map((s) => s.score);
  const minVal = Math.max(0, Math.floor(Math.min(...allValues)) - 5);
  const maxVal = Math.min(100, Math.ceil(Math.max(...allValues)) + 5);

  const primaryColor = hasDam ? colors.dam : colors.joy;
  const primaryRows = hasDam ? damScores : joyScores;
  const primaryData = buildChartData(primaryRows, primaryColor);
  const secondaryData = hasDam && hasJoy
    ? buildChartData(joyScores, colors.joy)
    : undefined;

  const chartWidth = screenWidth - 36 - 60;

  // 点が少ないときは横幅いっぱいに広げ、多いときは一定間隔にして横スクロールさせる
  const pointCount = Math.max(primaryData.length, secondaryData?.length ?? 0);
  const innerWidth = chartWidth - 40; // initialSpacing + endSpacing 分を差し引く
  const autoSpacing = pointCount > 1 ? innerWidth / (pointCount - 1) : innerWidth;
  const spacing = Math.max(44, autoSpacing);

  return (
    <View style={styles.container}>
      <LineChart
        data={primaryData}
        data2={secondaryData}
        width={chartWidth}
        height={80}
        color={primaryColor}
        color2={colors.joy}
        thickness={2.5}
        thickness2={2.5}
        curved
        dataPointsColor={primaryColor}
        dataPointsColor2={colors.joy}
        dataPointsRadius={4}
        dataPointsRadius2={4}
        maxValue={maxVal - minVal}
        yAxisOffset={minVal}
        noOfSections={3}
        yAxisTextStyle={styles.yLabel}
        yAxisLabelWidth={26}
        rulesColor={colors.border}
        xAxisColor={colors.border}
        yAxisColor="transparent"
        xAxisLabelTextStyle={styles.xLabel}
        spacing={spacing}
        initialSpacing={20}
        endSpacing={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 0,
  },
  xLabel: {
    fontSize: 9,
    color: colors.text3,
  },
  yLabel: {
    fontSize: 9,
    color: colors.text3,
  },
});
