import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

import { styles as globalStyles } from './StatsStyles.js';
import ScoreCircle from '../../components/ScoreCircle';
import SleepStagesCard from '../../components/SleepStagesCard';

const API_URL = 'http://150.158.158.233:1880';
const SLEEP_GOAL_MINUTES = 8 * 60;

const DayView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ---------- Overview state ----------
  const [sleepScore, setSleepScore] = useState(0);
  const [sleepStartTime, setSleepStartTime] = useState('--:--');
  const [sleepEndTime, setSleepEndTime] = useState('--:--');
  const [sleepDurationLabel, setSleepDurationLabel] = useState('--h --m');
  const [sleepTotalMinutes, setSleepTotalMinutes] = useState(null);
  const [sleepSource, setSleepSource] = useState(null);

  // ---------- Sleep stages state ----------
  const [sleepSegments, setSleepSegments] = useState([]);

  // ---------- Heart rate state ----------
  const [minHR, setMinHR] = useState(null);
  const [maxHR, setMaxHR] = useState(null);
  const [restingHR, setRestingHR] = useState(null);
  const [hrSeries, setHrSeries] = useState([]);
  const [linePath, setLinePath] = useState(null);
  const [areaPath, setAreaPath] = useState(null);
  const [hrAxisLabels, setHrAxisLabels] = useState(['', '', '', '']);
  const [hrScaleMin, setHrScaleMin] = useState(null);
  const [hrScaleMax, setHrScaleMax] = useState(null);

  // ---------- Sleep signs state ----------
  const [snoreMinutes, setSnoreMinutes] = useState(null);
  const [breathingMin, setBreathingMin] = useState(null);
  const [breathingMax, setBreathingMax] = useState(null);
  const [bodyMovements, setBodyMovements] = useState(null);

  // ---------- Date strip data ----------
  const dates = (() => {
    const days = [];
    const today = new Date();
    for (let i = -14; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  })();

  const formatToISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateHeader = (date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ==================== Backend requests ====================

  const resetSleepStates = () => {
    setSleepScore(0);
    setSleepStartTime('--:--');
    setSleepEndTime('--:--');
    setSleepTotalMinutes(null);
    setSleepDurationLabel('--h --m');
    setSleepSegments([]);
    setMinHR(null);
    setMaxHR(null);
    setRestingHR(null);
    setHrSeries([]);
    setSnoreMinutes(null);
    setBreathingMin(null);
    setBreathingMax(null);
    setBodyMovements(null);
    setSleepSource(null);
  };


  const applySleepReport = (data) => {
    if (!data || !data.ok) {
      resetSleepStates();
      return;
    }

    setSleepSource(data.source || null); 

    const summary = data.summary || {};
    const stages = data.stages || {};
    const hr = data.hr || {};
    const signs = data.signs || {};
    const scoreObj = data.score || {};

    // ---- score&time ----
    const scoreVal =
      typeof summary.quality_score === 'number'
        ? summary.quality_score
        : typeof scoreObj.value === 'number'
        ? scoreObj.value
        : 0;
    setSleepScore(scoreVal);

    const startTime = summary.start_time || '--:--';
    const endTime = summary.end_time || '--:--';
    setSleepStartTime(startTime);
    setSleepEndTime(endTime);

    const totalMin =
      typeof summary.total_minutes === 'number'
        ? summary.total_minutes
        : null;
    setSleepTotalMinutes(totalMin);

    if (totalMin != null) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      setSleepDurationLabel(`${h}h ${m}m`);
    } else {
      setSleepDurationLabel('--h --m');
    }

    // ---- sleep stage----
    let rawSegments = [];

    if (Array.isArray(stages.segments)) {
      rawSegments = stages.segments;
    } else if (Array.isArray(stages)) {
      rawSegments = stages;
    } else if (stages.summary) {
      const s = stages.summary;
      rawSegments = [];
      if (s.awake > 0) rawSegments.push({ stage: 'Awake', duration: s.awake });
      if (s.light > 0) rawSegments.push({ stage: 'Light', duration: s.light });
      if (s.deep > 0) rawSegments.push({ stage: 'Deep', duration: s.deep });
      if (s.rem > 0) rawSegments.push({ stage: 'REM', duration: s.rem });
    }

    const mapped = rawSegments.map((seg) => ({
      stage: seg.stage === 'Light' ? 'Core' : seg.stage,
      duration: seg.duration,
    }));
    setSleepSegments(mapped);

    // ---- hr ----
    setMinHR(typeof hr.hr_min === 'number' ? hr.hr_min : null);
    setMaxHR(typeof hr.hr_max === 'number' ? hr.hr_max : null);
    setRestingHR(typeof hr.hr_avg === 'number' ? hr.hr_avg : null);
    setHrSeries(Array.isArray(hr.series) ? hr.series : []);

    // ---- sign ----
    setSnoreMinutes(
      typeof signs.snore_minutes === 'number' ? signs.snore_minutes : null,
    );
    setBreathingMin(
      typeof signs.breathing_min === 'number' ? signs.breathing_min : null,
    );
    setBreathingMax(
      typeof signs.breathing_max === 'number' ? signs.breathing_max : null,
    );
    setBodyMovements(
      typeof signs.body_movements === 'number'
        ? signs.body_movements
        : null,
    );
  };


  const fetchSleepReport = async (jsDate) => {
    try {
      const dateStr = formatToISODate(jsDate);
      let report = null;


      try {
        const mqttRes = await fetch(
          `${API_URL}/pillow/sleep/night?date=${dateStr}`,
        );
        if (mqttRes.ok) {
          const mqttData = await mqttRes.json();
          if (mqttData && mqttData.ok) {
            console.log('使用 MQTT 数据');
            report = mqttData;
          }
        }
      } catch (err) {
        console.log('获取 MQTT night 失败，将尝试 HTTP 模拟数据', err);
      }


      if (!report) {
        try {
          const httpRes = await fetch(
            `${API_URL}/pillow/sleep/15days_default?date=${dateStr}`,
          );
          const httpData = await httpRes.json();

          if (httpData && httpData.ok) {
            console.log('使用 HTTP 模拟数据');
            report = httpData;
          }
        } catch (err) {
          console.log('获取 HTTP 模拟数据失败', err);
        }
      }

      if (!report) {
        resetSleepStates();
        return;
      }

      applySleepReport(report);
    } catch (e) {
      console.error('Error fetching sleep report:', e);
      resetSleepStates();
    }
  };


  useEffect(() => {
    fetchSleepReport(selectedDate);
  }, [selectedDate]);


  const handleRefreshToday = () => {
    fetchSleepReport(selectedDate);
  };
  // ==================== Heart rate path and vertical axis ====================
  useEffect(() => {
    if (!hrSeries || hrSeries.length === 0) {
      setLinePath(null);
      setAreaPath(null);
      setHrScaleMin(null);
      setHrScaleMax(null);
      return;
    }

    let rawMin = Infinity;
    let rawMax = -Infinity;
    hrSeries.forEach((p) => {
      const v = p.hr;
      if (typeof v === 'number') {
        if (v < rawMin) rawMin = v;
        if (v > rawMax) rawMax = v;
      }
    });

    if (!isFinite(rawMin) || !isFinite(rawMax)) {
      setLinePath(null);
      setAreaPath(null);
      setHrScaleMin(null);
      setHrScaleMax(null);
      return;
    }
    if (rawMin === rawMax) {
      rawMin -= 5;
      rawMax += 5;
    }

    const range = rawMax - rawMin;
    const margin = Math.max(5, range * 0.2);
    const lower = rawMin - margin;
    const upper = rawMax + margin;
    const niceMin = Math.floor(lower / 5) * 5;
    const niceMax = Math.ceil(upper / 5) * 5;

    const width = 100;
    const height = 100;
    const leftPad = 10;
    const rightPad = 2;
    const topPad = 5;
    const bottomPad = 18;
    const plotWidth = width - leftPad - rightPad;
    const usableHeight = height - topPad - bottomPad;

    const n = hrSeries.length;
    const scaleX = plotWidth / (n - 1);
    const scaleY = usableHeight / (niceMax - niceMin);
    const baselineY = height - bottomPad;

    const points = hrSeries.map((p, idx) => {
      const x = leftPad + idx * scaleX;
      const y = baselineY - (p.hr - niceMin) * scaleY;
      return { x, y };
    });

    let lineD = '';
    points.forEach((pt, idx) => {
      if (idx === 0) lineD += `M ${pt.x} ${pt.y}`;
      else lineD += ` L ${pt.x} ${pt.y}`;
    });

    let areaD = '';
    if (points.length > 1) {
      const first = points[0];
      const last = points[points.length - 1];
      areaD = `M ${first.x} ${baselineY}`;
      points.forEach((pt) => {
        areaD += ` L ${pt.x} ${pt.y}`;
      });
      areaD += ` L ${last.x} ${baselineY} Z`;
    }

    setLinePath(lineD);
    setAreaPath(areaD);
    setHrScaleMin(niceMin);
    setHrScaleMax(niceMax);
  }, [hrSeries]);

  // ==================== X axis time: full hours ====================
  const parseTimeToMinutes = (t) => {
    if (!t || typeof t !== 'string') return NaN;
    const parts = t.split(':');
    if (parts.length !== 2) return NaN;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return NaN;
    return h * 60 + m;
  };

  useEffect(() => {
    const s = parseTimeToMinutes(sleepStartTime);
    const e = parseTimeToMinutes(sleepEndTime);

    if (isNaN(s) || isNaN(e) || e <= s) {
      setHrAxisLabels(['', '', '', '']);
      return;
    }

    const firstHour = Math.ceil(s / 60);
    const lastHour = Math.floor(e / 60);

    if (lastHour < firstHour) {
      const startLabel = `${String(Math.round(s / 60) % 24).padStart(
        2,
        '0',
      )}:00`;
      const endLabel = `${String(Math.round(e / 60) % 24).padStart(
        2,
        '0',
      )}:00`;
      setHrAxisLabels([startLabel, '', '', endLabel]);
      return;
    }

    const hours = [];
    for (let h = firstHour; h <= lastHour; h++) hours.push(h);

    let chosen = [];
    if (hours.length <= 4) {
      chosen = hours;
    } else {
      const lastIdx = hours.length - 1;
      const idx1 = 0;
      const idx2 = Math.round(lastIdx / 3);
      const idx3 = Math.round((lastIdx * 2) / 3);
      const idx4 = lastIdx;
      chosen = [hours[idx1], hours[idx2], hours[idx3], hours[idx4]];
    }

    const labels = chosen.map(
      (h) => `${String(h % 24).padStart(2, '0')}:00`,
    );
    while (labels.length < 4) labels.push('');
    setHrAxisLabels(labels);
  }, [sleepStartTime, sleepEndTime]);

  // ==================== Overview text ====================
  let percentileText = null;
  if (sleepScore && sleepScore > 0) {
    let p = Math.round((sleepScore - 50) * 2);
    p = Math.max(1, Math.min(99, p));
    percentileText = `Better than ${p}% of users`;
  }

  let lastNightLabel = '--';
  if (sleepTotalMinutes != null) {
    const h = Math.floor(sleepTotalMinutes / 60);
    const m = sleepTotalMinutes % 60;
    lastNightLabel = `${h}h ${m}m`;
  }

  let goalCompareText = '';
  if (sleepTotalMinutes != null) {
    const diff = sleepTotalMinutes - SLEEP_GOAL_MINUTES;
    if (Math.abs(diff) < 10) {
      goalCompareText = 'Close to your 8h goal';
    } else if (diff > 0) {
      const overH = Math.floor(diff / 60);
      const overM = Math.abs(diff % 60);
      goalCompareText = `About ${overH > 0 ? `${overH}h ` : ''}${
        overM ? `${overM}m ` : ''
      }more than your 8h goal`;
    } else {
      const under = Math.abs(diff);
      const underH = Math.floor(under / 60);
      const underM = under % 60;
      goalCompareText = `About ${underH > 0 ? `${underH}h ` : ''}${
        underM ? `${underM}m ` : ''
      }less than your 8h goal`;
    }
  }

  let goalFillPercent = 0;
  if (sleepTotalMinutes != null && SLEEP_GOAL_MINUTES > 0) {
    goalFillPercent = Math.min(
      (sleepTotalMinutes / SLEEP_GOAL_MINUTES) * 100,
      100,
    );
  }

  const formatMinutesToHM = (min) => {
    if (typeof min !== 'number' || min < 0) return '--';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // ==================== UI ====================
  return (
    <View>
      {/* Date strip */}
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

      {/* Date title */}
      <Text style={globalStyles.dateHeader}>
        {formatDateHeader(selectedDate)}
      </Text>

      {/* Overview card */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Overview</Text>

        <View style={[globalStyles.cardHeaderRow, { marginTop: 4 }]}>
          <View style={globalStyles.donutContainer}>
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
            {percentileText ? (
              <Text style={globalStyles.subText}>{percentileText}</Text>
            ) : (
              <Text style={globalStyles.subText}>
                Your last night sleep overview
              </Text>
            )}

            <View style={{ marginTop: 8 }}>
              <View style={localStyles.goalBarTrack}>
                <View
                  style={[
                    localStyles.goalBarFill,
                    { width: `${goalFillPercent}%` },
                  ]}
                />
                <View style={localStyles.goalBarGoalMarker} />
              </View>

              <View style={localStyles.goalBarLabelsRow}>
                <Text style={localStyles.goalBarLabelLeft}>
                  Last night: {lastNightLabel}
                </Text>
                <Text style={localStyles.goalBarLabelRight}>Goal: 8h</Text>
              </View>

              {goalCompareText ? (
                <Text style={localStyles.goalBarHint}>{goalCompareText}</Text>
              ) : null}
            </View>
          </View>

          <Image
            source={require('../../assets/general_images/moon.png')}
            style={globalStyles.moonIcon}
          />
        </View>
      </View>

      {/* Sleep stages */}
      <View style={globalStyles.card}>
        <SleepStagesCard
          sleepScore={sleepScore}
          segments={sleepSegments}
          startTime={sleepStartTime}
          durationLabel={sleepDurationLabel}
          endTime={sleepEndTime}
        />
      </View>

      {/* Sleep signs */}
      <Text style={globalStyles.sectionHeaderOutside}>Sleep signs</Text>

      <View style={globalStyles.signsCard}>
        {/* Top metrics row */}
        <View style={globalStyles.signRow}>
          <View style={globalStyles.signItem}>
            <Text style={globalStyles.signLabel}>Snoring</Text>
            <Text style={globalStyles.signValue}>
              {snoreMinutes != null
                ? formatMinutesToHM(snoreMinutes)
                : '--'}
            </Text>
          </View>

          <View style={globalStyles.signItem}>
            <Text style={globalStyles.signLabel}>Breathing</Text>
            <Text style={globalStyles.signValue}>
              {breathingMin != null && breathingMax != null
                ? `${breathingMin} – ${breathingMax} rpm`
                : '--'}
            </Text>
          </View>

          <View style={globalStyles.signItem}>
            <Text style={globalStyles.signLabel}>Body movement</Text>
            <Text style={globalStyles.signValue}>
              {bodyMovements != null ? `${bodyMovements} times` : '--'}
            </Text>
          </View>
        </View>

        <View style={globalStyles.horizontalDivider} />

        {/* Heart rate chart */}
        <View style={localStyles.hrContainer}>
          <View style={localStyles.hrHeaderRow}>
            <Text style={localStyles.hrRangeNumber}>
              {minHR != null && maxHR != null ? `${minHR}–${maxHR}` : '--'}
            </Text>
            <Text style={localStyles.hrRangeUnit}>bpm</Text>
          </View>
          <Text style={localStyles.hrSubtitle}>Heart rate range</Text>

          <View style={localStyles.hrChartCard}>
            {hrScaleMin != null && hrScaleMax != null && (
              <View style={localStyles.hrYAxisLabels}>
                <Text style={localStyles.hrYAxisLabelText}>
                  {Math.round(hrScaleMax)}
                </Text>
                <Text style={localStyles.hrYAxisLabelText}>
                  {Math.round((hrScaleMin + hrScaleMax) / 2)}
                </Text>
                <Text style={localStyles.hrYAxisLabelText}>
                  {Math.round(hrScaleMin)}
                </Text>
              </View>
            )}

            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <Defs>
                <LinearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
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

              <Line
                x1="10"
                y1="0"
                x2="10"
                y2="100"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.6"
              />

              <Line
                x1="10"
                y1="25"
                x2="100"
                y2="25"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.6"
              />
              <Line
                x1="10"
                y1="50"
                x2="100"
                y2="50"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.6"
              />
              <Line
                x1="10"
                y1="75"
                x2="100"
                y2="75"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.6"
              />

              <Line
                x1="40"
                y1="0"
                x2="40"
                y2="100"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.6"
              />
              <Line
                x1="70"
                y1="0"
                x2="70"
                y2="100"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.6"
              />
              <Line
                x1="90"
                y1="0"
                x2="90"
                y2="100"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.6"
              />

              {areaPath ? (
                <Path d={areaPath} fill="url(#hrGradient)" stroke="none" />
              ) : null}

              {linePath ? (
                <Path
                  d={linePath}
                  stroke="#FF6B7F"
                  strokeWidth={0.8}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
            </Svg>

            <View style={localStyles.hrXAxisRow}>
              <Text style={localStyles.hrAxisLabel}>
                {hrAxisLabels[0] || '--:--'}
              </Text>
              <Text style={localStyles.hrAxisLabel}>
                {hrAxisLabels[1] || ''}
              </Text>
              <Text style={localStyles.hrAxisLabel}>
                {hrAxisLabels[2] || ''}
              </Text>
              <Text style={localStyles.hrAxisLabel}>
                {hrAxisLabels[3] || '--:--'}
              </Text>
            </View>
          </View>

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

          <View style={localStyles.hrStatRow}>
            <View>
              <Text style={localStyles.hrStatLabel}>Heart rate range</Text>
              <Text style={localStyles.hrStatValue}>
                {minHR != null && maxHR != null
                  ? `${minHR}–${maxHR} bpm`
                  : '--'}
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
        </View>
      </View>
    </View>
  );
};

// ---------- Local styles ----------
const localStyles = StyleSheet.create({
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

  goalBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  goalBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: '#5D5FEF',
  },
  goalBarGoalMarker: {
    position: 'absolute',
    right: 0,
    top: -2,
    bottom: -2,
    width: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  goalBarLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  goalBarLabelLeft: {
    color: '#D1D1D6',
    fontSize: 10,
  },
  goalBarLabelRight: {
    color: '#D1D1D6',
    fontSize: 10,
  },
  goalBarInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  goalBarInfoText: {
    color: '#A0A0A0',
    fontSize: 11,
  },
  goalBarHint: {
    marginTop: 2,
    color: '#C7CAE9',
    fontSize: 11,
  },

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
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 12,
    marginTop: 4,
    height: 160,
    overflow: 'hidden',
  },
  hrYAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 18,
    justifyContent: 'space-between',
    paddingLeft: 0,
  },
  hrYAxisLabelText: {
    color: '#7E82A5',
    fontSize: 10,
  },
  hrXAxisRow: {
    position: 'absolute',
    left: 10,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
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
