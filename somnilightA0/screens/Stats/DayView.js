// DayView.js
// 说明：日视图页面（睡眠评分 + 睡眠阶段 + Sleep signs）
// 注意：APP 内文字为英文，注释为中文

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';

// 全局样式
import { styles as globalStyles } from './StatsStyles.js';

// 子组件
import ScoreCircle from '../../components/ScoreCircle';
import SleepStagesCard from '../../components/SleepStagesCard';

const API_URL = 'http://150.158.158.233:1880';

const DayView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sleepScore, setSleepScore] = useState(0);

  // ---------- 1) 模拟原始睡眠结构数据 ----------
  const rawHypnogramData = useMemo(
    () => [
      { stage: 'Awake', duration: 20 },
      { stage: 'Light', duration: 40 },
      { stage: 'Deep', duration: 50 },
      { stage: 'Light', duration: 15 },
      { stage: 'REM', duration: 25 },
      { stage: 'Light', duration: 40 },
      { stage: 'Deep', duration: 45 },
      { stage: 'Awake', duration: 5 },
      { stage: 'Light', duration: 30 },
      { stage: 'REM', duration: 35 },
      { stage: 'Light', duration: 60 },
      { stage: 'REM', duration: 40 },
      { stage: 'Awake', duration: 15 },
    ],
    []
  );

  // ---------- 2) 把 Light 映射为 Core，生成 Apple 风格阶段 ----------
  const appleSegments = useMemo(() => {
    const mapStage = (s) => {
      if (s === 'Light') return 'Core';
      if (s === 'Deep') return 'Deep';
      if (s === 'REM') return 'REM';
      if (s === 'Awake') return 'Awake';
      return 'Core';
    };
    return rawHypnogramData.map((item) => ({
      stage: mapStage(item.stage),
      duration: item.duration,
    }));
  }, [rawHypnogramData]);

  // ---------- 3) 日期条逻辑 ----------
  const dates = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = -14; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const formatToISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateHeader = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---------- 4) 获取当前日期的睡眠分数 ----------
  useEffect(() => {
    const fetchSleepScore = async () => {
      try {
        const dateStr = formatToISODate(selectedDate);
        const response = await fetch(
          `${API_URL}/pillow/sleep/score?date=${dateStr}`
        );
        const data = await response.json();
        if (data.ok) {
          setSleepScore(data.quality_score);
        } else {
          setSleepScore(0);
        }
      } catch (e) {
        setSleepScore(0);
      }
    };
    fetchSleepScore();
  }, [selectedDate]);

  // ---------- 5) 主渲染 ----------
  return (
    <View>
      {/* 顶部日期 strip */}
      <View style={globalStyles.dateStrip}>
        <FlatList
          horizontal
          data={dates}
          keyExtractor={(item) => item.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          initialScrollIndex={14}
          getItemLayout={(data, index) => ({
            length: 55,
            offset: 55 * index,
            index,
          })}
          renderItem={({ item }) => {
            const active = isSameDay(item, selectedDate);
            return (
              <TouchableOpacity
                onPress={() => setSelectedDate(item)}
                style={[
                  globalStyles.dateItem,
                  active && globalStyles.activeDateItem,
                  { marginRight: 12 },
                ]}
              >
                <Text
                  style={[
                    globalStyles.dateTextDay,
                    active && { color: '#FFFFFF' },
                  ]}
                >
                  {daysOfWeek[item.getDay()]}
                </Text>
                <Text style={globalStyles.dateTextNum}>{item.getDate()}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 日期标题 */}
      <Text style={globalStyles.dateHeader}>
        {formatDateHeader(selectedDate)}
      </Text>

      {/* ---------- Sleep Score 卡片 ---------- */}
      <View style={globalStyles.card}>
        <View style={globalStyles.cardHeaderRow}>
          <View style={globalStyles.donutContainer}>
            {/* 用容器包住 ScoreCircle，在中间叠数字和“Quality” */}
            <View style={localStyles.scoreWrapper}>
              <ScoreCircle
                score={sleepScore || 0}
                size={80}
                strokeWidth={8}
                color="#5D5FEF"
              />
              <View style={localStyles.scoreInner}>
                <Text style={localStyles.scoreText}>{sleepScore || 0}</Text>
                <Text style={localStyles.scoreLabel}>Quality</Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={globalStyles.cardTitle}>Sleep Score</Text>
            <Text style={globalStyles.subText}>Based on your cycles</Text>

            <View style={globalStyles.rowSpaced}>
              <View>
                <Text style={globalStyles.statLabel}>Efficiency</Text>
                <Text style={globalStyles.statValue}>92%</Text>
              </View>
            </View>
          </View>

          <Image
            source={require('../../assets/general_images/moon.png')}
            style={globalStyles.moonIcon}
          />
        </View>
      </View>

      {/* ---------- Sleep Stages 卡片（外层加圆角 card） ---------- */}
      <View style={globalStyles.card}>
        <SleepStagesCard
          sleepScore={sleepScore}
          segments={appleSegments}
          startTime="01:40"
          durationLabel="7h 55m"
          endTime="09:35"
        />
      </View>

      {/* ---------- Sleep signs ---------- */}
      <Text style={globalStyles.sectionHeaderOutside}>Sleep signs</Text>

      <View style={globalStyles.signsCard}>
        <View style={globalStyles.signRow}>
          <View style={globalStyles.signItem}>
            <Text style={globalStyles.signLabel}>Snoring</Text>
            <Text style={globalStyles.signValue}>4h 12m</Text>
          </View>
          <View style={globalStyles.verticalDivider} />
          <View style={globalStyles.signItem}>
            <Text style={globalStyles.signLabel}>Breathing</Text>
            <Text style={globalStyles.signValue}>12 – 21</Text>
          </View>
          <View style={globalStyles.verticalDivider} />
          <View style={globalStyles.signItem}>
            <Text style={globalStyles.signLabel}>Body movement</Text>
            <Text style={globalStyles.signValue}>2</Text>
          </View>
        </View>

        <View style={globalStyles.horizontalDivider} />

        <View style={globalStyles.signRow}>
          <View style={globalStyles.signItem}>
            <Text style={globalStyles.signLabel}>Heart beats</Text>
            <Text style={globalStyles.smallLabel}>BMP</Text>
            <Text style={globalStyles.signValue}>64 – 80</Text>
          </View>
          <View style={globalStyles.signItem}>
            <Text style={[globalStyles.signLabel, { opacity: 0 }]}>.</Text>
            <Text style={globalStyles.smallLabel}>HRV</Text>
            <Text style={globalStyles.signValue}>36 – 113</Text>
          </View>

          <View
            style={{
              flex: 1,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              source={require('../../assets/general_images/heart_rate.png')}
              style={{ width: 129, height: 41, resizeMode: 'contain' }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

// 仅用于本页面中圆环中心的文字布局
const localStyles = StyleSheet.create({
  // 容器：大小与 ScoreCircle 一致，用来叠加文字
  scoreWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // 绝对填满，用来居中两行文字
  scoreInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 中心的大数字
  scoreText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  // 数字下方的小标签
  scoreLabel: {
    color: '#C7CAE9',
    fontSize: 10,
  },
});

export default DayView;
