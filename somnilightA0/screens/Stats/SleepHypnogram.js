import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

// ---------- Stage height map ----------
const STAGE_MAP = {
  Awake: { top: 0, bottom: 90 },
  REM: { top: 40, bottom: 120 },
  Light: { top: 80, bottom: 150 },
  Deep: { top: 120, bottom: 180 },
};

// ---------- Component ----------
const SleepHypnogram = ({
  data = [],
  startTime = '01:40',
  endTime = '09:35',
  dateLabel = '12/6',
}) => {
  // ---------- Layout and visual config ----------
  const chartHeight = 180;
  const chartWidth = width - 60;

  const strokeWidth = 20;
  const paddingY = strokeWidth / 2;

  const totalDuration = data.reduce((acc, cur) => acc + cur.duration, 0);
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;
  const unitWidth = totalDuration > 0 ? chartWidth / totalDuration : 0;

  // ---------- SVG path generation ----------
  let topPathOps = [];
  let currentX = 0;

  data.forEach((item, index) => {
    const stageConf = STAGE_MAP[item.stage] || STAGE_MAP.Light;
    const segmentWidth = item.duration * unitWidth;
    const targetY = stageConf.top + paddingY;

    if (index === 0) {
      topPathOps.push(`M 0 ${targetY}`);
    } else {
      const prevStage = STAGE_MAP[data[index - 1].stage] || STAGE_MAP.Light;
      const prevY = prevStage.top + paddingY;
      topPathOps.push(`L ${currentX} ${prevY}`);
      topPathOps.push(`L ${currentX} ${targetY}`);
    }

    topPathOps.push(`L ${currentX + segmentWidth} ${targetY}`);
    currentX += segmentWidth;
  });

  let bottomPathOps = [];
  currentX = chartWidth;

  for (let i = data.length - 1; i >= 0; i--) {
    const item = data[i];
    const stageConf = STAGE_MAP[item.stage] || STAGE_MAP.Light;
    const segmentWidth = item.duration * unitWidth;
    const targetY = stageConf.bottom - paddingY;

    if (i === data.length - 1) {
      bottomPathOps.push(`L ${chartWidth} ${targetY}`);
    }

    bottomPathOps.push(`L ${currentX - segmentWidth} ${targetY}`);

    if (i > 0) {
      const nextStage = STAGE_MAP[data[i - 1].stage] || STAGE_MAP.Light;
      const nextY = nextStage.bottom - paddingY;
      bottomPathOps.push(`L ${currentX - segmentWidth} ${targetY}`);
      bottomPathOps.push(`L ${currentX -segmentWidth} ${nextY}`);
    }

    currentX -= segmentWidth;
  }

  const fullPath = [...topPathOps, ...bottomPathOps, 'Z'].join(' ');

  // ---------- Render ----------
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerLabel}>Night Sleep</Text>
        <View style={styles.timeRow}>
          <Text style={styles.bigNum}>{totalHours}</Text>
          <Text style={styles.smallUnit}> h </Text>
          <Text style={styles.bigNum}>{totalMinutes}</Text>
          <Text style={styles.smallUnit}> min</Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginVertical: 10, height: chartHeight }}>
        <Svg height={chartHeight} width={chartWidth} style={{ overflow: 'visible' }}>
          <Defs>
            <LinearGradient id="fourStageGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFC850" />
              <Stop offset="20%" stopColor="#FFC850" />
              <Stop offset="30%" stopColor="#FF8585" />
              <Stop offset="50%" stopColor="#FF8585" />
              <Stop offset="60%" stopColor="#A86CFA" />
              <Stop offset="75%" stopColor="#A86CFA" />
              <Stop offset="85%" stopColor="#703EFF" />
              <Stop offset="100%" stopColor="#703EFF" />
            </LinearGradient>
          </Defs>

          <Path
            d={fullPath}
            fill="url(#fourStageGrad)"
            stroke="url(#fourStageGrad)"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <View style={[styles.bottomLabels, { width: chartWidth }]}>
        <View>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Text style={styles.timeLabel}>Bedtime {startTime}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Text style={styles.timeLabel}>Wake up {endTime}</Text>
        </View>
      </View>

      <View style={[styles.legendRow, { width: chartWidth }]}>
        <LegendItem color="#703EFF" label="Deep" />
        <LegendItem color="#A86CFA" label="Light" />
        <LegendItem color="#FF8585" label="REM" />
        <LegendItem color="#FFC850" label="Awake" />
      </View>
    </View>
  );
};

const LegendItem = ({ color, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        marginRight: 6,
      }}
    />
    <Text style={{ color: '#D1D1D6', fontSize: 10 }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  headerLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigNum: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  smallUnit: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateLabel: {
    color: '#A0A0A0',
    fontSize: 10,
  },
  timeLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 15,
  },
});

export default SleepHypnogram;
