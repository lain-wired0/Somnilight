// screens/Stats/WeekView.js
// 周视图：新日期选择器 + 分离圆角胶囊柱状图
// 柱子与星期几对齐；平均睡眠时间文字与横线对齐

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { styles } from './StatsStyles';

// --------- 静态模拟数据（单位：分钟）---------
// 深睡 / 浅睡 / REM / 清醒，合起来是当天总睡眠时长
const weeklySleepData = [
  { day: 'Sun', deep: 80,  light: 220, rem: 50,  awake: 20 }, // 6h10m
  { day: 'Mon', deep: 90,  light: 260, rem: 70,  awake: 25 }, // 7h25m
  { day: 'Tue', deep: 60,  light: 180, rem: 50,  awake: 15 }, // 5h05m
  { day: 'Wed', deep: 70,  light: 210, rem: 60,  awake: 20 }, // 6h00m
  { day: 'Thu', deep: 50,  light: 150, rem: 40,  awake: 15 }, // 4h15m
  { day: 'Fri', deep: 110, light: 260, rem: 80,  awake: 25 }, // 7h55m
  { day: 'Sat', deep: 95,  light: 230, rem: 70,  awake: 20 }, // 6h55m
];

// 颜色：保持之前设定
const stageColors = {
  awake: '#FFC850', // 清醒（最上）
  rem:   '#FF8585', // REM
  light: '#A86CFA', // 浅睡
  deep:  '#703EFF', // 深睡（最下）
};

// 胶囊从上到下的顺序：清醒 -> REM -> 浅睡 -> 深睡
const stageOrder = ['awake', 'rem', 'light', 'deep'];

// 统计图高度
const CHART_HEIGHT = 180;

// 计算某天总睡眠（分钟）
const getDayTotal = (item) =>
  (item.deep || 0) + (item.light || 0) + (item.rem || 0) + (item.awake || 0);

// 获取一周起始（周日）
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// 获取“今天 00:00”
function getTodayStart() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

// 是否同一周
function isSameWeek(d1, d2) {
  return getStartOfWeek(d1).getTime() === getStartOfWeek(d2).getTime();
}

// 把分钟拆成 h / m
function splitToHM(minutes) {
  const total = Math.round(minutes || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { h, m };
}

// 周标题：Dec 1 - 7 / Dec 30 - Jan 5
function formatWeekTitle(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startMonthShort = start.toLocaleDateString('en-US', {
    month: 'short',
  });
  const endMonthShort = end.toLocaleDateString('en-US', { month: 'short' });

  if (startMonthShort === endMonthShort) {
    // 同一个月：Dec 1 - 7
    return `${startMonthShort} ${start.getDate()} - ${end.getDate()}`;
  }
  // 不同月：Dec 30 - Jan 5
  return `${startMonthShort} ${start.getDate()} - ${endMonthShort} ${end.getDate()}`;
}

// 第二行：December 6 这种
function formatSubtitleDate(selectedWeekStart) {
  const todayStart = getTodayStart();
  const currentWeekStart = getStartOfWeek(todayStart);

  let dateForLabel;
  if (isSameWeek(selectedWeekStart, currentWeekStart)) {
    // 当前周：显示今天
    dateForLabel = todayStart;
  } else {
    // 其他周：取这一周的中间那天（周三）
    dateForLabel = new Date(selectedWeekStart);
    dateForLabel.setDate(selectedWeekStart.getDate() + 3);
  }

  return dateForLabel.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

const WeekView = () => {
  // 当前选中周：默认本周
  const [selectedWeekStart, setSelectedWeekStart] = useState(
    getStartOfWeek(new Date())
  );

  const todayStart = getTodayStart();
  const currentWeekStart = getStartOfWeek(todayStart);

  // 控制右侧箭头是否可点（不允许超过当前周）
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
    if (next > currentWeekStart) return; // 不跳到当前周之后
    setSelectedWeekStart(next);
  };

  // 这一周的总时长 & 最大值（决定比例尺）
  const dayTotals = weeklySleepData.map(getDayTotal);
  const maxTotal = Math.max(...dayTotals, 1); // 避免除以 0

  // 计算平均睡眠时长（只统计“有柱子”的天）
  let sumForAverage = 0;
  let countForAverage = 0;

  for (let i = 0; i < 7; i++) {
    const barDate = new Date(selectedWeekStart);
    barDate.setDate(selectedWeekStart.getDate() + i);

    const isCurrentWeekShowing = isSameWeek(
      selectedWeekStart,
      currentWeekStart
    );
    // 当前周：只有“今天之前”的日期有数据；过去周：7 天都有
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

  // 顶部 Summary 用同一个平均值
  const summaryH = avgH;
  const summaryM = avgM;

  const weekTitle = formatWeekTitle(selectedWeekStart);
  const subtitleDate = formatSubtitleDate(selectedWeekStart);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View>
      {/* 新日期选择器：<  Dec 1 - 7  > / December 6 */}
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

      {/* Summary：平均睡眠时长 */}
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

      {/* 三列统计 */}
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

      {/* 柱状图 + 平均线 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly sleep condition statistics</Text>

        <View
          style={[
            styles.chartContainer,
            { height: CHART_HEIGHT + 40, paddingTop: 4 },
          ]}
        >
          <View style={{ height: CHART_HEIGHT, width: '100%' }}>
            {/* 平均线 + 同一高度的文字（在线右侧） */}
            {countForAverage > 0 && (
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: 20,
                    right: 50, // 与柱子区域同宽
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

            {/* 柱子区域：左 20 / 右 50，与平均线、X 轴共用对齐 */}
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
                    currentWeekStart
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
                            {stageOrder.map((stageKey, idx) => {
                              const value = item[stageKey];
                              if (!value) return null;

                              const segHeight =
                                (value / maxTotal) * CHART_HEIGHT || 0;

                              return (
                                <View
                                  key={stageKey}
                                  style={{
                                    width: 10, // 细柱子
                                    height: Math.max(8, segHeight),
                                    borderRadius: 999,
                                    backgroundColor: stageColors[stageKey],
                                    marginTop: idx === 0 ? 0 : 4,
                                  }}
                                />
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* 底部小阴影（只有有数据时显示） */}
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

        {/* X 轴：星期标签 —— 与柱子共用相同左右边距和 7 等分布局 */}
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
          {weekdayLabels.map((label, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.xAxisText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* 底部颜色 Legend：Deep / Light / REM / Awake */}
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
            <Text style={{ fontSize: 11, color: '#ffffffb0' }}>
              REM sleep
            </Text>
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

      {/* Comparison：保留原内容 */}
      <View style={styles.statsRowCard}>
        <View style={styles.statCol}>
          <Text style={styles.statUp}>14m ⬆️</Text>
          <Text style={styles.statDesc}>Compared with last week</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statNeutral}>98% ⭐️</Text>
          <Text style={styles.statDesc}>Optimal sleep quality</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statNeutral}>1h 15m ⭐️</Text>
          <Text style={styles.statDesc}>Optimal deep sleep</Text>
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
