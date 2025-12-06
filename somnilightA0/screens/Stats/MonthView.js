// MonthView.js
// 说明：月视图页面（月份选择器 + 睡眠质量日历 + 时长趋势 + Highlights）
// 注意：APP 内文字为英文，代码注释为中文

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// 全局统计样式（卡片、标题等）
import { styles as globalStyles } from './StatsStyles';
// 复用圆环组件（带动画）
import ScoreCircle from '../../components/ScoreCircle';

const { width: deviceWidth } = Dimensions.get('window');
const API_URL = 'http://150.158.158.233:1880';

// 将日期对象格式化为 YYYY-MM-DD，供 Node-RED 接口使用
const formatToISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 根据得分返回一个大致的颜色（简单分三档）
const getScoreColor = (score) => {
  if (score >= 85) return '#FFC850'; // Great
  if (score >= 70) return '#A18CFF'; // Good
  return '#FF71A0';                  // Poor
};

const MonthView = () => {
  // 以手机当前日期初始化：本月第一天
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // 保存当前月份每一天的睡眠得分：{ 'YYYY-MM-DD': number }
  const [monthlyScores, setMonthlyScores] = useState({});

  // ---------- 1) 计算当前月的基本信息 + 日历网格 ----------
  const { year, monthIndex, monthLabel, calendarWeeks } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();

    // 当月总天数
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    // 当月 1 号是星期几（0 = Sunday）
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

    // 月份英文名（完整拼写）
    const monthName = currentMonth.toLocaleString('en-US', {
      month: 'long',
    });
    const monthLabel = `${monthName} ${year}`;

    // 构造日历网格：按周拆分，每个元素要么是一个 Date 对象，要么是 null 占位
    const cells = [];
    // 先填充 1 号之前的空位
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    // 填入本月的每一天
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, monthIndex, d));
    }
    // 如果最后一周不足 7 天，用 null 补齐
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const calendarWeeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      calendarWeeks.push(cells.slice(i, i + 7));
    }

    return { year, monthIndex, monthLabel, calendarWeeks };
  }, [currentMonth]);

  // ---------- 2) 当 currentMonth 变化时，从 Node-RED 拉取整月的睡眠得分 ----------
  useEffect(() => {
    const fetchMonthlyScores = async () => {
      try {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const results = {};

        const requests = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(year, monthIndex, d);
          const dateStr = formatToISODate(date);

          const req = fetch(`${API_URL}/pillow/sleep/score?date=${dateStr}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.ok) {
                results[dateStr] = data.quality_score;
              } else {
                results[dateStr] = 0;
              }
            })
            .catch(() => {
              results[dateStr] = 0;
            });

          requests.push(req);
        }

        await Promise.all(requests);
        setMonthlyScores(results);
      } catch (err) {
        // 网络错误时，仅记录并避免崩溃
        setMonthlyScores({});
      }
    };

    fetchMonthlyScores();
  }, [year, monthIndex]);

  // ---------- 3) 月份选择器的切换逻辑 ----------
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m - 1, 1);
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return new Date(y, m + 1, 1);
    });
  };

  // 星期标题（展示用）
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // 渲染某一天的 ScoreCircle 圆环（里面覆盖显示日期）
  const renderDayCircle = (dateObj) => {
    if (!dateObj) return null;

    const dateStr = formatToISODate(dateObj);
    const score = monthlyScores[dateStr] ?? 0;
    const color = getScoreColor(score);

    return (
      <View style={mStyles.dayCircleOuter}>
        {/* 相对布局：ScoreCircle 在底层，日期文字覆盖在中心 */}
        <View style={mStyles.scoreCircleWrapper}>
          <ScoreCircle
            score={score}
            size={32}
            strokeWidth={3}
            color={color}
          />
          <Text style={mStyles.dayNumber}>{dateObj.getDate()}</Text>
        </View>
      </View>
    );
  };

  // --- 模拟 Duration Trend / Highlights 的假数据 ---
  const trendData = [6.0, 6.5, 7.2, 7.0, 7.5, 7.8, 7.1, 7.4, 7.6, 7.3];
  const maxTrendVal = Math.max(...trendData);

  return (
    <View style={mStyles.container}>
      {/* ---------- 顶部月份选择器 ---------- */}
      <View style={mStyles.monthSelector}>
        <TouchableOpacity onPress={goToPrevMonth} style={mStyles.monthArrowBtn}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={20}
            color="#BFC3E1"
          />
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
            <Text style={mStyles.monthSubtitle}>Monthly Overview</Text>
          </View>
        </View>

        <TouchableOpacity onPress={goToNextMonth} style={mStyles.monthArrowBtn}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#BFC3E1"
          />
        </TouchableOpacity>
      </View>

      {/* ---------- Sleep Quality 日历卡片 ---------- */}
      <View style={globalStyles.card}>
        {/* 标题 + 图例 */}
        <View style={mStyles.cardHeaderRow}>
          <Text style={globalStyles.cardTitle}>Sleep Quality</Text>
          <View style={mStyles.legendRow}>
            <View style={mStyles.legendItem}>
              <View
                style={[mStyles.legendDot, { backgroundColor: '#FFC850' }]}
              />
              <Text style={mStyles.legendText}>Great</Text>
            </View>
            <View style={mStyles.legendItem}>
              <View
                style={[mStyles.legendDot, { backgroundColor: '#A18CFF' }]}
              />
              <Text style={mStyles.legendText}>Good</Text>
            </View>
            <View style={mStyles.legendItem}>
              <View
                style={[mStyles.legendDot, { backgroundColor: '#FF71A0' }]}
              />
              <Text style={mStyles.legendText}>Poor</Text>
            </View>
          </View>
        </View>

        {/* 星期标题行 */}
        <View style={mStyles.weekHeaderRow}>
          {daysOfWeek.map((d, index) => (
            <Text key={`${d}-${index}`} style={mStyles.weekHeaderText}>
              {d}
            </Text>
          ))}
        </View>

        {/* 日历主体 */}
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

      {/* ---------- Duration Trend 时长趋势卡片 ---------- */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Duration Trend</Text>
        <Text style={[globalStyles.subText, { marginBottom: 16 }]}>
          Average sleep time increased by 12%
        </Text>

        <View style={mStyles.trendChart}>
          {trendData.map((val, index) => {
            const height = (val / maxTrendVal) * 100; // 最大高度约 100 像素
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
                    { height, backgroundColor: barColor },
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View style={mStyles.trendAxisRow}>
          <Text style={mStyles.axisLabel}>June 1</Text>
          <Text style={mStyles.axisLabel}>June 15</Text>
          <Text style={mStyles.axisLabel}>June 30</Text>
        </View>
      </View>

      {/* ---------- Highlights 区块 ---------- */}
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
              <Text style={[mStyles.tagText, { color: '#B7A6FF' }]}>
                Top 10%
              </Text>
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
            <Text style={mStyles.consistencyTitle}>Great Consistency!</Text>
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

// 局部样式：仅用于 MonthView
const mStyles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },

  // 顶部月份选择器
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

  // Sleep Quality 卡片内部
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

  // Duration Trend 柱状图
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

  // Great Consistency 卡片
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
