import { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { styles } from './StatsStyles';

// --- Mock weekly sleep data (minutes) ---
const weeklySleepData = [
  { day: 'Sun', deep: 80, light: 220, rem: 50, awake: 20 }, 
  { day: 'Mon', deep: 90, light: 260, rem: 70, awake: 25 }, 
  { day: 'Tue', deep: 60, light: 180, rem: 50, awake: 15 }, 
  { day: 'Wed', deep: 70, light: 210, rem: 60, awake: 20 }, 
  { day: 'Thu', deep: 50, light: 150, rem: 40, awake: 15 }, 
  { day: 'Fri', deep: 110, light: 260, rem: 80, awake: 25 }, 
  { day: 'Sat', deep: 95, light: 230, rem: 70, awake: 20 }, 
];

// --- Mock weekly heart rate data (bpm) ---
const weeklyHeartRateData = [
  { day: 'Sun', min: 58, max: 90 },
  { day: 'Mon', min: 50, max: 89 },
  { day: 'Tue', min: 55, max: 86 },
  { day: 'Wed', min: 47, max: 98 },
  { day: 'Thu', min: 46, max: 100 },
  { day: 'Fri', min: 59, max: 92 },
  { day: 'Sat', min: 44, max: 103 },
];

const stageColors = {
  awake: '#FFC850',
  rem: '#FF8585',
  light: '#A86CFA',
  deep: '#703EFF',
};

const stageOrder = ['awake', 'rem', 'light', 'deep'];

const CHART_HEIGHT = 200;

// --- Sleep chart helpers ---
const getDayTotal = (item) =>
  (item.deep || 0) +
  (item.light || 0) +
  (item.rem || 0) +
  (item.awake || 0);

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getTodayStart() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function isSameWeek(d1, d2) {
  return getStartOfWeek(d1).getTime() === getStartOfWeek(d2).getTime();
}

function splitToHM(minutes) {
  const total = Math.round(minutes || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { h, m };
}

function formatWeekTitle(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startMonthShort = start.toLocaleDateString('en-US', {
    month: 'short',
  });
  const endMonthShort = end.toLocaleDateString('en-US', { month: 'short' });

  if (startMonthShort === endMonthShort) {
    return `${startMonthShort} ${start.getDate()} - ${end.getDate()}`;
  }

  return `${startMonthShort} ${start.getDate()} - ${endMonthShort} ${end.getDate()}`;
}

function formatSubtitleDate(selectedWeekStart) {
  const todayStart = getTodayStart();
  const currentWeekStart = getStartOfWeek(todayStart);

  let dateForLabel;
  if (isSameWeek(selectedWeekStart, currentWeekStart)) {
    dateForLabel = todayStart;
  } else {
    dateForLabel = new Date(selectedWeekStart);
    dateForLabel.setDate(selectedWeekStart.getDate() + 3);
  }

  return dateForLabel.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

const WeekView = () => {
  // --- Week selection state ---
  const [selectedWeekStart, setSelectedWeekStart] = useState(
    getStartOfWeek(new Date()),
  );

  const todayStart = getTodayStart();
  const currentWeekStart = getStartOfWeek(todayStart);
  const canGoNext = selectedWeekStart < currentWeekStart;

  const handlePrevWeek = () => {
    const prev = new Date(selectedWeekStart);
    prev.setDate(prev.getDate() - 7);
    setSelectedWeekStart(prev);
  };

  const handleNextWeek = () => {
    if (!canGoNext) return;
    const next = new Date(selectedWeekStart);
    next.setDate(next.getDate() + 7);
    if (next > currentWeekStart) return;
    setSelectedWeekStart(next);
  };

  // --- Sleep averages and chart scale ---
  const dayTotals = weeklySleepData.map(getDayTotal);
  const maxTotal = Math.max(...dayTotals, 1);

  let sumForAverage = 0;
  let countForAverage = 0;

  for (let i = 0; i < 7; i++) {
    const barDate = new Date(selectedWeekStart);
    barDate.setDate(selectedWeekStart.getDate() + i);

    const isCurrentWeekShowing = isSameWeek(
      selectedWeekStart,
      currentWeekStart,
    );

    const hasData =
      !isCurrentWeekShowing || barDate.getTime() < todayStart.getTime();

    if (hasData) {
      sumForAverage += dayTotals[i];
      countForAverage++;
    }
  }

  const avgMinutes = countForAverage ? sumForAverage / countForAverage : 0;
  const { h: avgH, m: avgM } = splitToHM(avgMinutes);
  const avgHeight = (avgMinutes / maxTotal) * CHART_HEIGHT;

  const summaryH = avgH;
  const summaryM = avgM;

  const weekTitle = formatWeekTitle(selectedWeekStart);
  const subtitleDate = formatSubtitleDate(selectedWeekStart);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- Heart rate weekly stats (static data) ---
  const allMinHR = weeklyHeartRateData.map((d) => d.min);
  const allMaxHR = weeklyHeartRateData.map((d) => d.max);
  const heartRangeMin = Math.min(...allMinHR);
  const heartRangeMax = Math.max(...allMaxHR);

  const restingMin = 56;
  const restingMax = 65;

  const heartBars = weekdayLabels.map((label) => {
    return (
      weeklyHeartRateData.find((d) => d.day === label) || { min: 0, max: 0 }
    );
  });

  return (
    <View>
      {/* Week selector */}
      <View
        style={[
          styles.dateStrip,
          {
            height: 60,
            marginTop: 10,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrevWeek}
          style={{ padding: 8, paddingRight: 16 }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color="#ffffffaa"
          />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            {weekTitle}
          </Text>
          <Text
            style={{
              color: '#A0A0A0',
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {subtitleDate}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextWeek}
          disabled={!canGoNext}
          style={{ padding: 8, paddingLeft: 16 }}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={canGoNext ? '#ffffffaa' : '#ffffff33'}
          />
        </TouchableOpacity>
      </View>

      {/* Weekly summary */}
      <View style={styles.weekSummary}>
        <View>
          <Text style={styles.bigTime}>
            {summaryH}
            <Text style={styles.unitText}>h</Text> {summaryM}
            <Text style={styles.unitText}>m</Text>
          </Text>
          <Text style={styles.subLabel}>Average sleep time</Text>
        </View>
        <Image
          source={require('../../assets/general_images/moon.png')}
          style={styles.moonIconBig}
        />
      </View>

      {/* Three-column stats */}
      <View style={styles.threeColStats}>
        <View>
          <Text style={styles.statBig}>91%</Text>
          <Text style={styles.statSmall}>Average sleep quality</Text>
        </View>
        <View>
          <Text style={styles.statBig}>1h 1m</Text>
          <Text style={styles.statSmall}>Average deep sleep</Text>
        </View>
        <View>
          <Text style={styles.statBig}>59 BPM</Text>
          <Text style={styles.statSmall}>Average heart rate</Text>
        </View>
      </View>

      {/* Weekly sleep stacked bars + average line */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly sleep condition statistics</Text>

        <View
          style={[
            styles.chartContainer,
            { height: CHART_HEIGHT + 40, paddingTop: 4 },
          ]}
        >
          <View style={{ height: CHART_HEIGHT, width: '100%' }}>
            {countForAverage > 0 && (
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: 20,
                    right: 50,
                    top: CHART_HEIGHT - avgHeight,
                    borderTopWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: '#ffffff70',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: CHART_HEIGHT - avgHeight - 8,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#ffffffaa' }}>
                    {avgH} h {avgM} m
                  </Text>
                </View>
              </>
            )}

            <View
              style={{
                position: 'absolute',
                left: 20,
                right: 50,
                bottom: 0,
                top: 0,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                }}
              >
                {weeklySleepData.map((item, index) => {
                  const barDate = new Date(selectedWeekStart);
                  barDate.setDate(selectedWeekStart.getDate() + index);

                  const isCurrentWeekShowing = isSameWeek(
                    selectedWeekStart,
                    currentWeekStart,
                  );

                  const hasData =
                    !isCurrentWeekShowing ||
                    barDate.getTime() < todayStart.getTime();

                  const total = dayTotals[index];

                  return (
                    <View
                      key={item.day}
                      style={{ flex: 1, alignItems: 'center' }}
                    >
                      {hasData && total > 0 && (
                        <View
                          style={{
                            height: CHART_HEIGHT,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                          }}
                        >
                          <View
                            style={{
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                            }}
                          >
                            {stageOrder.map((stageKey, stageIndex) => {
                              const value = item[stageKey];
                              if (!value) return null;

                              const segHeight =
                                (value / maxTotal) * CHART_HEIGHT || 0;

                              return (
                                <View
                                  key={stageKey}
                                  style={{
                                    width: 10,
                                    height: Math.max(8, segHeight),
                                    borderRadius: 999,
                                    backgroundColor: stageColors[stageKey],
                                    marginTop: stageIndex === 0 ? 0 : 4,
                                  }}
                                />
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {hasData && total > 0 && (
                        <View
                          style={{
                            width: 14,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            marginTop: 6,
                          }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* X axis labels */}
        <View
          style={[
            styles.xAxis,
            {
              marginLeft: 20,
              marginRight: 50,
              flexDirection: 'row',
            },
          ]}
        >
          {weekdayLabels.map((label, index) => (
            <View key={index} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.xAxisText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Legend */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: stageColors.deep,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 11, color: '#ffffffb0' }}>
              Deep sleep
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: stageColors.light,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 11, color: '#ffffffb0' }}>
              Light sleep
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: stageColors.rem,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 11, color: '#ffffffb0' }}>REM sleep</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: stageColors.awake,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 11, color: '#ffffffb0' }}>Awake</Text>
          </View>
        </View>
      </View>

      {/* Comparison row */}
      <View style={styles.statsRowCard}>
        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="arrow-up"
              size={16}
              color="#4CAF50"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.statUp}>14m</Text>
          </View>
          <Text style={styles.statDesc}>Compared with last week</Text>
        </View>

        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="star-outline"
              size={16}
              color="#FFC850"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.statNeutral}>98%</Text>
          </View>
          <Text style={styles.statDesc}>Optimal sleep quality</Text>
        </View>

        <View style={styles.statCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name="star-outline"
              size={16}
              color="#FFC850"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.statNeutral}>1h 15m</Text>
          </View>
          <Text style={styles.statDesc}>Optimal deep sleep</Text>
        </View>
      </View>

      {/* Heart rate weekly range */}
      <Text style={styles.sectionHeaderOutside}>Heart rate</Text>
      <View style={[styles.card, { paddingTop: 18, paddingBottom: 18 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text
            style={{
              color: 'white',
              fontSize: 26,
              fontWeight: '700',
            }}
          >
            {heartRangeMin}–{heartRangeMax}
          </Text>
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              marginLeft: 6,
              marginBottom: 2,
            }}
          >
            bpm
          </Text>
        </View>
        <Text
          style={{
            color: '#A0A4C3',
            fontSize: 12,
            marginTop: 4,
          }}
        >
          Heart rate range
        </Text>

        <View style={{ height: 120, marginTop: 16, marginBottom: 12 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            {heartBars.map((item, index) => {
              const diff = heartRangeMax - heartRangeMin || 1;
              const minNorm = (item.min - heartRangeMin) / diff;
              const maxNorm = (item.max - heartRangeMin) / diff;
              const totalHeight = 90;
              const barHeight = Math.max(
                24,
                (maxNorm - minNorm) * totalHeight,
              );

              return (
                <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 10,
                      height: barHeight,
                      borderRadius: 999,
                      backgroundColor: '#FF6B7F',
                    }}
                  />
                  <Text
                    style={{
                      color: '#8E8E93',
                      fontSize: 10,
                      marginTop: 6,
                    }}
                  >
                    {weekdayLabels[index].charAt(0)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Static heart rate / HRV segmented control */}
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.25)',
            padding: 4,
            marginBottom: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#2A215F',
              }}
            >
              Heart rate
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#C0C4E4',
              }}
            >
              HRV
            </Text>
          </View>
        </View>

        {/* Heart rate summary */}
        <View style={{ marginTop: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#A3A7C7', fontSize: 12 }}>
              Heart rate range
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              {heartRangeMin}–{heartRangeMax} bpm
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#A3A7C7', fontSize: 12 }}>
              Resting heart rate
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              {restingMin}–{restingMax} bpm
            </Text>
          </View>
        </View>
      </View>

      {/* Sleep advice */}
      <Text style={styles.sectionHeaderOutside}>Sleep advice</Text>
      <View style={[styles.card, { backgroundColor: '#2D1B69' }]}>
        <Text style={{ color: 'white', fontSize: 14, lineHeight: 20 }}>
          Try to maintain a regular schedule, go to bed 15 minutes early...
        </Text>
      </View>
    </View>
  );
};

export default WeekView;
