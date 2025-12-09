import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';

import { styles as globalStyles } from './StatsStyles.js';
import ScoreCircle from '../../components/ScoreCircle';
import SleepStagesCard from '../../components/SleepStagesCard';

// 用于心率折线图
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const API_URL = 'http://150.158.158.233:1880';

const DayView = () => {

  //状态设计
  // 当前查看的日期
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 当晚睡眠概要（从 /pillow/sleep/score 来）
  const [sleepScore, setSleepScore] = useState(0);
  const [sleepStartTime, setSleepStartTime] = useState('--:--');
  const [sleepEndTime, setSleepEndTime] = useState('--:--');
  const [sleepTotalMinutes, setSleepTotalMinutes] = useState(null);

  // ☆ 当晚心率概要（从 /pillow/sleep/hr 来）
  const [hrMin, setHrMin] = useState(null);
  const [hrMax, setHrMax] = useState(null);
  const [hrvMin, setHrvMin] = useState(null);
  const [hrvMax, setHrvMax] = useState(null);
  // 预留：整晚心率时间序列，后面画图用
  const [hrSeries, setHrSeries] = useState([]);


  //请求逻辑
  // 把“某一天睡眠 summary 从后端取回来”的逻辑集中在一个函数里
  const fetchSleepSummary = async (jsDate) => {
    try {
      const dateStr = formatToISODate(jsDate);
      const response = await fetch(`${API_URL}/pillow/sleep/score?date=${dateStr}`);
      const data = await response.json();

      if (data && data.ok) {
        setSleepScore(data.quality_score || 0);
        setSleepStartTime(data.start_time || '--:--');
        setSleepEndTime(data.end_time || '--:--');
        setSleepTotalMinutes(
          typeof data.total_minutes === 'number' ? data.total_minutes : null
        );
      } else {
        // 没数据：统一置空
        setSleepScore(0);
        setSleepStartTime('--:--');
        setSleepEndTime('--:--');
        setSleepTotalMinutes(null);
      }
    } catch (error) {
      console.error('Error fetching sleep summary:', error);
      setSleepScore(0);
      setSleepStartTime('--:--');
      setSleepEndTime('--:--');
      setSleepTotalMinutes(null);
    }
  };

  // 从后端获取“某一天的心率时间序列 + 统计值”
  const fetchHeartRateData = async (jsDate) => {
    try {
      const dateStr = formatToISODate(jsDate);
      const response = await fetch(`${API_URL}/pillow/sleep/hr?date=${dateStr}`);
      const data = await response.json();

      if (data && data.ok) {
        setHrMin(typeof data.hr_min === 'number' ? data.hr_min : null);
        setHrMax(typeof data.hr_max === 'number' ? data.hr_max : null);
        setHrvMin(typeof data.hrv_min === 'number' ? data.hrv_min : null);
        setHrvMax(typeof data.hrv_max === 'number' ? data.hrv_max : null);
        setHrSeries(Array.isArray(data.series) ? data.series : []);
      } else {
        setHrMin(null);
        setHrMax(null);
        setHrvMin(null);
        setHrvMax(null);
        setHrSeries([]);
      }
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      setHrMin(null);
      setHrMax(null);
      setHrvMin(null);
      setHrvMax(null);
      setHrSeries([]);
    }
  };



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

  // ---------- 3) 顶部日期条逻辑 ----------
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

  // ---------- 4) Sleep Score：从后端获取 ----------
  useEffect(() => {
    fetchSleepSummary(selectedDate);
    fetchHeartRateData(selectedDate);
  }, [selectedDate]);

  // 根据 hrSeries 计算 SVG 折线图的路径（linePath / areaPath）
  useEffect(() => {
    // 没数据：清空路径，SVG 那里就不画
    if (!hrSeries || hrSeries.length === 0) {
      setLinePath(null);
      setAreaPath(null);
      return;
    }

    // 1）找出这一晚心率的最小 / 最大值，用来做 Y 轴归一化
    let localMin = Infinity;
    let localMax = -Infinity;

    hrSeries.forEach((p) => {
      const v = p.hr;
      if (typeof v === 'number') {
        if (v < localMin) localMin = v;
        if (v > localMax) localMax = v;
      }
    });

    // 防止所有点一样（min == max）或者数据异常
    if (!isFinite(localMin) || !isFinite(localMax) || localMin === localMax) {
      setLinePath(null);
      setAreaPath(null);
      return;
    }

    // viewBox 是 0 0 100 100，所以我们用 100x100 的坐标系
    const width = 100;
    const height = 100;
    const n = hrSeries.length;

    // X 轴平均铺开：0 → width
    const scaleX = width / (n - 1);
    // Y 轴根据 (max - min) 缩放：数值越大，位置越高
    const scaleY = height / (localMax - localMin);

    // 把每个点映射到 (x, y)
    const points = hrSeries.map((p, idx) => {
      const x = idx * scaleX;
      // SVG 坐标系 y 向下，所以高心率要减掉
      const y = height - (p.hr - localMin) * scaleY;
      return { x, y };
    });

    // 2）生成折线路径：M x0 y0 L x1 y1 L x2 y2 ...
    let lineD = '';
    points.forEach((pt, idx) => {
      if (idx === 0) {
        lineD += `M ${pt.x} ${pt.y}`;
      } else {
        lineD += ` L ${pt.x} ${pt.y}`;
      }
    });

    // 3）生成面积路径：从底边开始，沿折线走，最后回到底边闭合
    let areaD = '';
    if (points.length > 1) {
      const first = points[0];
      const last = points[points.length - 1];

      // 底边起点
      areaD = `M ${first.x} ${height}`;
      // 沿着折线走
      points.forEach((pt) => {
        areaD += ` L ${pt.x} ${pt.y}`;
      });
      // 回到底边终点，闭合
      areaD += ` L ${last.x} ${height} Z`;
    }

    // 更新 state，触发 SVG 重新渲染
    setLinePath(lineD);
    setAreaPath(areaD);
  }, [hrSeries]);



  // ---------- 5) 心率：使用静态假数据（不连后台） ----------
  // 一整天心率变化的假数据（你之后可以替换成真实数据）
  const heartRateData = useMemo(
    () => [62, 60, 64, 68, 72, 78, 80, 84, 88, 90, 86, 82, 78, 74, 70],
    []
  );

  const minHR = useMemo(
    () => Math.min(...heartRateData),
    [heartRateData]
  );
  const maxHR = useMemo(
    () => Math.max(...heartRateData),
    [heartRateData]
  );

  // 用最常见的静息心率假设值（可以改成 heartRateData 的最小值）
  const restingHR = useMemo(() => 58, []);

  // 折线和面积的 Path（用 0~100 归一化坐标）
  const { linePath, areaPath } = useMemo(() => {
    const n = heartRateData.length;
    if (n === 0) {
      return { linePath: '', areaPath: '' };
    }

    const minVal = minHR;
    const maxVal = maxHR;
    const diff = maxVal - minVal || 1;

    // 生成所有点坐标
    const points = heartRateData.map((v, idx) => {
      const x = (idx / (n - 1)) * 100; // 0~100
      const norm = (v - minVal) / diff; // 0~1
      // y 反向：越高的心率越靠上，这里留一点上下边距
      const yTop = 20;
      const yBottom = 80;
      const y = yBottom - norm * (yBottom - yTop);
      return { x, y };
    });

    // 折线路径
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      line += ` L ${points[i].x} ${points[i].y}`;
    }

    // 面积路径（下方填充）
    let area = `M ${points[0].x} 100 L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      area += ` L ${points[i].x} ${points[i].y}`;
    }
    area += ` L ${points[points.length - 1].x} 100 Z`;

    return { linePath: line, areaPath: area };
  }, [heartRateData, minHR, maxHR]);

  // ---------- 6) 主渲染 ----------
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
          startTime={sleepStartTime}
          // 下一步我们会用 sleepTotalMinutes 动态算 “xh ym”
          durationLabel="7h 55m"
          endTime={sleepEndTime}
        />

      </View>

      {/* ---------- Sleep signs ---------- */}
      <Text style={globalStyles.sectionHeaderOutside}>Sleep signs</Text>

      <View style={globalStyles.signsCard}>
        {/* 第一行：鼾声 / 呼吸 / 身体动作 */}
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

        {/* 第二块：心率监测区域（静态假数据） */}
        <View style={localStyles.hrContainer}>
          {/* 顶部大号范围数字 */}
          <View style={localStyles.hrHeaderRow}>
            <Text style={localStyles.hrRangeNumber}>
              {minHR != null && maxHR != null ? `${minHR}–${maxHR}` : '--'}
            </Text>
            <Text style={localStyles.hrRangeUnit}>bpm</Text>
          </View>
          <Text style={localStyles.hrSubtitle}>Heart rate range</Text>

          {/* 折线图卡片 */}
          <View style={localStyles.hrChartCard}>
            <View style={localStyles.hrChartInner}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <Defs>
                  {/* 填充渐变 */}
                  <LinearGradient
                    id="hrGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop
                      offset="0"
                      stopColor="rgba(255,107,127,0.6)"
                      stopOpacity="1"
                    />
                    <Stop
                      offset="1"
                      stopColor="rgba(255,107,127,0)"
                      stopOpacity="0"
                    />
                  </LinearGradient>
                </Defs>

                {/* 面积填充 */}
                {areaPath ? (
                  <Path
                    d={areaPath}
                    fill="url(#hrGradient)"
                    stroke="none"
                  />
                ) : null}

                {/* 折线 */}
                {linePath ? (
                  <Path
                    d={linePath}
                    stroke="#FF6B7F"
                    strokeWidth={1.8}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
              </Svg>

              {/* X 轴时间刻度 */}
              <View style={localStyles.hrXAxisRow}>
                <Text style={localStyles.hrAxisLabel}>00:00</Text>
                <Text style={localStyles.hrAxisLabel}>06:00</Text>
                <Text style={localStyles.hrAxisLabel}>12:00</Text>
                <Text style={localStyles.hrAxisLabel}>18:00</Text>
              </View>
            </View>
          </View>

          {/* 切换按钮：Heart rate / HRV（暂时静态） */}
          <View style={localStyles.hrSegmentRow}>
            <View style={[localStyles.hrSegment, localStyles.hrSegmentActive]}>
              <Text
                style={[
                  localStyles.hrSegmentText,
                  localStyles.hrSegmentTextActive,
                ]}
              >
                Heart rate
              </Text>
            </View>
            <View style={localStyles.hrSegment}>
              <Text style={localStyles.hrSegmentText}>HRV</Text>
            </View>
          </View>

          {/* 底部两行摘要数据 */}
          <View style={localStyles.hrStatRow}>
            <View>
              <Text style={localStyles.hrStatLabel}>Heart rate range</Text>
              <Text style={localStyles.hrStatValue}>
                {minHR != null && maxHR != null ? `${minHR}–${maxHR} bpm` : '--'}
              </Text>
            </View>
          </View>
          <View style={localStyles.hrStatRow}>
            <View>
              <Text style={localStyles.hrStatLabel}>Resting heart rate</Text>
              <Text style={localStyles.hrStatValue}>
                {restingHR != null ? `${restingHR} bpm` : '--'}
              </Text>
            </View>
          </View>

          );
};

          // 仅用于本页面中圆环中心的文字布局 + 心率区域样式
          const localStyles = StyleSheet.create({
            // ------ 圆环中心文字 ------
            scoreWrapper: {
            width: 80,
          height: 80,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
  },
          scoreInner: {
            ...StyleSheet.absoluteFillObject,
            alignItems: 'center',
          justifyContent: 'center',
  },
          scoreText: {
            color: '#FFFFFF',
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 2,
  },
          scoreLabel: {
            color: '#C7CAE9',
          fontSize: 10,
  },

          // ------ 心率监测块 ------
          hrContainer: {
            marginTop: 4,
  },
          hrHeaderRow: {
            flexDirection: 'row',
          alignItems: 'flex-end',
  },
          hrRangeNumber: {
            color: '#FFFFFF',
          fontSize: 30,
          fontWeight: '700',
  },
          hrRangeUnit: {
            color: '#FFFFFF',
          fontSize: 16,
          marginLeft: 6,
          marginBottom: 3,
  },
          hrSubtitle: {
            color: '#A0A4C3',
          fontSize: 12,
          marginTop: 4,
          marginBottom: 10,
  },
          hrChartCard: {
            borderRadius: 18,
          backgroundColor: 'rgba(20, 18, 48, 0.8)',
          borderWidth: 1,
          borderColor: 'rgba(120,120,160,0.5)',
          padding: 12,
          marginBottom: 12,
          marginTop: 2,
  },
          hrChartInner: {
            height: 140,
  },
          hrXAxisRow: {
            position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 2,
  },
          hrAxisLabel: {
            color: '#7E82A5',
          fontSize: 10,
  },

          hrSegmentRow: {
            flexDirection: 'row',
          marginBottom: 10,
  },
          hrSegment: {
            flex: 1,
          paddingVertical: 8,
          borderRadius: 18,
          backgroundColor: 'rgba(24, 22, 60, 0.9)',
          borderWidth: 1,
          borderColor: 'rgba(110,110,150,0.7)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
  },
          hrSegmentActive: {
            backgroundColor: '#FFFFFF',
          borderColor: '#FFFFFF',
  },
          hrSegmentText: {
            fontSize: 13,
          color: '#C0C4E4',
          fontWeight: '600',
  },
          hrSegmentTextActive: {
            color: '#2A215F',
  },

          hrStatRow: {
            flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 4,
  },
          hrStatLabel: {
            color: '#A3A7C7',
          fontSize: 12,
  },
          hrStatValue: {
            color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
          marginTop: 2,
  },
});

          export default DayView;
