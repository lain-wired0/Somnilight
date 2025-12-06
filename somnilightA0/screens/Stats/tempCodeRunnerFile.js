// DayView.js
// 说明：日视图页面（睡眠评分 + 睡眠阶段 + Sleep signs）
// 注意：APP 内文字为英文，注释为中文

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';

// 全局样式
import { styles as globalStyles } from './StatsStyles.js';

// 子组件
import ScoreCircle from '../../components/ScoreCircle';
// 使用修改后的 SleepStagesCard
import SleepStagesCard from '../../components/SleepStagesCard';

const API_URL = 'http://150.158.158.233:1880';

const DayView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sleepScore, setSleepScore] = useState(0);

  // ---------- 1) 模拟原始睡眠结构数据（与你之前一致） ----------
  const rawHypnogramData = useMemo(() => ([
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
  ]), []);

  // ---------- 2) 映射为 Apple 风格的阶段命名 ----------
  // Light -> Core，其它保持不变
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

  // ---------- 3) 日期逻辑 ----------
  const dates = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = -14; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
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
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---------- 4) 获取睡眠分数 ----------
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
      } catch (error) {
        setSleepScore(0);
      }
    };

    fetchSleepScore();
  }, [selectedDate]);

  // 这里先写死时间，后面可以改为从后端拿
  const startTime = '01:40';
  const endTime = '09:35';

  // ---------- 主渲染 ----------
  return (
    <View>
      {/* 顶部日期滑条 */}
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
            const isActive = isSameDay(item, selectedDate);
            const dayLabel = daysOfWeek[item.getDay()];
            const dateNum = item.getDate();

            return (
              <TouchableOpacity
                onPress={() => setSelectedDate(item)}
                style={[
                  globalStyles.dateItem,
                  isActive && globalStyles.activeDateItem,
                  { marginRight: 12 },
                ]}
              >
                <Text
                  style={[
                    globalStyles.dateTextDay,
                    isActive && { color: 'white' },
                  ]}
                >
                  {dayLabel}
                </Text>
                <Text style={globalStyles.dateTextNum}>{dateNum}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 当前选择日期标题 */}
      <Text style={globalStyles.dateHeader}>
        {formatDateHeader(selectedDate)}
      </Text>

      {/* Sleep Score 卡片 */}
      <View style={globalStyles.card}>
        <View style={globalStyles.cardHeaderRow}>
          <View style={globalStyles.donutContainer}>
            <ScoreCircle
              score={sleepScore || 0}
              size={80}
              strokeWidth={8}
              color="#5D5FEF"
            />
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={globalStyles.cardTitle}>Sleep Score</Text>
            <Text style={globalStyles.subText}>Based on your cycles</Text>

            <View style={globalStyles.rowSpaced}>
              <View>
                <Text style={globalStyles.statLabel}>Efficiency</Text>
                {/* 目前先写死，后续可以用 SleepStagesCard 的统计替换 */}
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

      {/* Sleep Stages 卡片：用外部 card 包裹 SleepStagesCard 内容 */}
      <View
        style={[
          globalStyles.card,
          { paddingVertical: 18, paddingHorizontal: 14 },
        ]}
      >
        <SleepStagesCard
          segments={appleSegments}
          startTime={startTime}
          endTime={endTime}
        />
      </View>

      {/* Sleep signs 区块（你原来的布局保持不变） */}
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
            <Text style={globalStyles.smallLabel}>BPM</Text>
            <Text style={globalStyles.signValue}>64 – 80</Text>
          </View>

          <View style={globalStyles.signItem}>
            {/* 隐形占位，保证两列对齐 */}
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

export default DayView;
