import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { styles as globalStyles } from './StatsStyles';
import ScoreCircle from '../../components/ScoreCircle';

const { width: deviceWidth } = Dimensions.get('window');

// Date helpers
const formatToISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getScoreColor = (score) => {
  if (score >= 85) return '#703EFF'; 
  if (score >= 70) return '#FFC850'; 
  return '#FF8585'; 
};

// Mock scores for 2025-11-01 ~ 2025-12-11
const buildMockScores = () => {
  const scores = {};

  const addRange = (year, monthIndex, startDay, endDay) => {
    for (let d = startDay; d <= endDay; d++) {
      const date = new Date(year, monthIndex, d);
      const key = formatToISODate(date);

      const mod = d % 3;
      let score;
      if (mod === 1) score = 88; // Great
      else if (mod === 2) score = 78; // Good
      else score = 64; // Poor

      scores[key] = score;
    }
  };

  addRange(2025, 10, 1, 30); // November
  addRange(2025, 11, 1, 11); // December

  return scores;
};

const MOCK_SCORES = buildMockScores();

// Allowed months: 2025-11 and 2025-12
const ALLOW_YEAR = 2025;
const MIN_MONTH_INDEX = 10; // November
const MAX_MONTH_INDEX = 11; // December

const MonthView = () => {
  // Month state (only November / December 2025)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    if (
      today.getFullYear() === ALLOW_YEAR &&
      (today.getMonth() === MIN_MONTH_INDEX || today.getMonth() === MAX_MONTH_INDEX)
    ) {
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }
    return new Date(ALLOW_YEAR, MAX_MONTH_INDEX, 1);
  });

  // Sleep scores (mock)
  const [monthlyScores] = useState(MOCK_SCORES);

  // Calendar grid and labels for current month
  const { year, monthIndex, monthLabel, calendarWeeks } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

    const monthName = currentMonth.toLocaleString('en-US', { month: 'long' });
    const monthLabel = `${monthName} ${year}`;

    const cells = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, monthIndex, d));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const calendarWeeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      calendarWeeks.push(cells.slice(i, i + 7));
    }

    return { year, monthIndex, monthLabel, calendarWeeks };
  }, [currentMonth]);

  // Month selector navigation (clamped to 2025-11 / 2025-12)
  const goToPrevMonth = () => {
    if (year === ALLOW_YEAR && monthIndex === MIN_MONTH_INDEX) return;

    setCurrentMonth((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m - 1, 1);
    });
  };

  const goToNextMonth = () => {
    if (year === ALLOW_YEAR && monthIndex === MAX_MONTH_INDEX) return;

    setCurrentMonth((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m + 1, 1);
    });
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Calendar cell renderer
  const renderDayCircle = (dateObj) => {
    if (!dateObj) return null;

    const dateStr = formatToISODate(dateObj);
    const score = monthlyScores[dateStr];

    if (typeof score !== 'number') {
      return (
        <View style={mStyles.dayCircleOuter}>
          <View style={mStyles.emptyDayCircle}>
            <Text style={mStyles.emptyDayNumber}>{dateObj.getDate()}</Text>
          </View>
        </View>
      );
    }

    const color = getScoreColor(score);

    return (
      <View style={mStyles.dayCircleOuter}>
        <View style={mStyles.scoreCircleWrapper}>
          <ScoreCircle score={score} size={32} strokeWidth={3} color={color} />
          <Text style={mStyles.dayNumber}>{dateObj.getDate()}</Text>
        </View>
      </View>
    );
  };

  // Mock duration trend data
  const trendData = [6.0, 6.5, 7.2, 7.0, 7.5, 7.8, 7.1, 7.4, 7.6, 7.3];
  const maxTrendVal = Math.max(...trendData);

  return (
    <View style={mStyles.container}>
      {/* Month selector */}
      <View style={mStyles.monthSelector}>
        <TouchableOpacity onPress={goToPrevMonth} style={mStyles.monthArrowBtn}>
          <MaterialCommunityIcons name="chevron-left" size={20} color="#BFC3E1" />
        </TouchableOpacity>

        <View style={mStyles.monthCenter}>
          <Text style={mStyles.monthTitle}>{monthLabel}</Text>
          <View style={mStyles.monthSubtitleRow}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={12}
              color="#9DA2C7"
              style={{ marginRight: 4 }}
            />
            <Text style={mStyles.monthSubtitle}>Monthly overview</Text>
          </View>
        </View>

        <TouchableOpacity onPress={goToNextMonth} style={mStyles.monthArrowBtn}>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#BFC3E1" />
        </TouchableOpacity>
      </View>

      {/* Sleep quality calendar */}
      <View style={globalStyles.card}>
        <View style={mStyles.cardHeaderRow}>
          <Text style={globalStyles.cardTitle}>Sleep Quality</Text>

          <View style={mStyles.legendRow}>
            <View style={mStyles.legendItem}>
              <View style={[mStyles.legendDot, { backgroundColor: '#FF8585' }]} />
              <Text style={mStyles.legendText}>Poor</Text>
            </View>
            <View style={mStyles.legendItem}>
              <View style={[mStyles.legendDot, { backgroundColor: '#FFC850' }]} />
              <Text style={mStyles.legendText}>Fair</Text>
            </View>
            <View style={mStyles.legendItem}>
              <View style={[mStyles.legendDot, { backgroundColor: '#703EFF' }]} />
              <Text style={mStyles.legendText}>Good</Text>
            </View>
          </View>
        </View>

        <View style={mStyles.weekHeaderRow}>
          {daysOfWeek.map((d, index) => (
            <Text key={`${d}-${index}`} style={mStyles.weekHeaderText}>
              {d}
            </Text>
          ))}
        </View>

        <View style={mStyles.calendarBody}>
          {calendarWeeks.map((week, wi) => (
            <View key={wi} style={mStyles.weekRow}>
              {week.map((dateObj, di) => (
                <View key={di} style={mStyles.dayCell}>
                  {dateObj ? renderDayCircle(dateObj) : null}
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Duration trend */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Duration Trend</Text>
        <Text style={[globalStyles.subText, { marginBottom: 16 }]}>
          Average sleep time increased by 12%
        </Text>

        <View style={mStyles.trendChart}>
          {trendData.map((val, index) => {
            const height = (val / maxTrendVal) * 100;
            const barColor =
              index % 3 === 0
                ? '#4D9CFF'
                : index % 3 === 1
                ? '#7F6BFF'
                : '#A18CFF';

            return (
              <View key={index} style={mStyles.trendBarWrapper}>
                <View
                  style={[
                    mStyles.trendBar,
                    {
                      height,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View style={mStyles.trendAxisRow}>
          <Text style={mStyles.axisLabel}>Nov 1</Text>
          <Text style={mStyles.axisLabel}>Nov 15</Text>
          <Text style={mStyles.axisLabel}>Dec 11</Text>
        </View>
      </View>

      {/* Highlights */}
      <Text style={globalStyles.sectionHeaderOutside}>Highlights</Text>

      <View style={mStyles.highlightRow}>
        <View style={mStyles.highlightCard}>
          <View style={mStyles.badgeRow}>
            <View style={[mStyles.badge, { backgroundColor: '#1C3D3B' }]}>
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={14}
                color="#4BE3A3"
              />
            </View>
            <View style={[mStyles.tagPill, { backgroundColor: '#223F36' }]}>
              <Text style={[mStyles.tagText, { color: '#4BE3A3' }]}>+45m</Text>
            </View>
          </View>
          <Text style={mStyles.highlightValue}>7h 51m</Text>
          <Text style={mStyles.highlightLabel}>Avg. sleep duration</Text>
        </View>

        <View style={mStyles.highlightCard}>
          <View style={mStyles.badgeRow}>
            <View style={[mStyles.badge, { backgroundColor: '#252350' }]}>
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={14}
                color="#B7A6FF"
              />
            </View>
            <View style={[mStyles.tagPill, { backgroundColor: '#2B2655' }]}>
              <Text style={[mStyles.tagText, { color: '#B7A6FF' }]}>Top 10%</Text>
            </View>
          </View>
          <Text style={mStyles.highlightValue}>1h 42m</Text>
          <Text style={mStyles.highlightLabel}>Avg. deep sleep</Text>
        </View>
      </View>

      <View style={mStyles.consistencyCard}>
        <View style={mStyles.consistencyHeaderRow}>
          <View style={mStyles.crownCircle}>
            <MaterialCommunityIcons
              name="crown-outline"
              size={20}
              color="#FFE8A3"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mStyles.consistencyTitle}>Great consistency!</Text>
            <Text style={mStyles.consistencyText}>
              You went to bed on time 24 days this month.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MonthView;

// Local styles for MonthView
const mStyles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },

  // Month selector
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  monthArrowBtn: {
    padding: 6,
  },
  monthCenter: {
    alignItems: 'center',
    flex: 1,
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  monthSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  monthSubtitle: {
    color: '#9DA2C7',
    fontSize: 11,
  },

  // Sleep quality card
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    color: '#CED2FF',
    fontSize: 10,
  },

  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  weekHeaderText: {
    color: '#7E81A8',
    fontSize: 11,
  },

  calendarBody: {
    marginTop: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayCircleOuter: {
    width: (deviceWidth - 40 - 24) / 7,
    alignItems: 'center',
  },
  scoreCircleWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumber: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty day circle
  emptyDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(180, 180, 210, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayNumber: {
    color: '#B7BAD7',
    fontSize: 12,
    fontWeight: '500',
  },

  // Duration trend
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 6,
    height: 120,
  },
  trendBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  trendBar: {
    width: 10,
    borderRadius: 5,
  },
  trendAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  axisLabel: {
    color: '#8F93B5',
    fontSize: 11,
  },

  // Highlights
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 27, 60, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(125,125,160,0.6)',
    padding: 14,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  highlightValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  highlightLabel: {
    color: '#A4A8CC',
    fontSize: 11,
  },

  // Consistency card
  consistencyCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#4C3FF4',
    borderWidth: 1,
    borderColor: 'rgba(180, 170, 255, 0.8)',
  },
  consistencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  consistencyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  consistencyText: {
    color: '#E5E6FF',
    fontSize: 12,
  },
});
