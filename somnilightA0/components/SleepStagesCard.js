// SleepStagesCard.js
// Sleep stage hypnogram and summary bars

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const STAGES = ['Awake', 'REM', 'Core', 'Deep'];

const COLORS = {
  textPrimary: '#EDEFF6',
  textSecondary: '#9AA3B2',
  divider: 'rgba(255,255,255,0.08)',

  Awake: '#FFC850',
  REM: '#FF8585',
  Core: '#A86CFA',
  Deep: '#703EFF',
};

const LEVEL_INDEX = {
  Awake: 0,
  REM: 1,
  Core: 2,
  Deep: 3,
};

// ---------- Utils ----------

const minutesToHM = (mins) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const timeStrToMin = (t) => {
  if (!t) return 0;
  const [hh, mm] = t.split(':').map((x) => parseInt(x, 10));
  return (hh || 0) * 60 + (mm || 0);
};

const computeSpanMinutes = (startStr, endStr) => {
  const s = timeStrToMin(startStr);
  const e = timeStrToMin(endStr);
  if (e >= s) return e - s;
  return 24 * 60 - s + e;
};

// ---------- Component ----------

const SleepStagesCard = ({
  segments = [],
  startTime = '01:40',
  endTime = '09:35',
  showHeaderIcons = false,
  onShare,
  onEdit,
}) => {
  const [containerW, setContainerW] = useState(0);

  const handleLayout = useCallback(
    (e) => {
      const w = e?.nativeEvent?.layout?.width || 0;
      if (w && w !== containerW) setContainerW(w);
    },
    [containerW],
  );

  const safeW = Math.max(containerW, 260);
  const chartW = safeW;
  const chartH = 150;
  const blockH = 26;
  const rowGap = 8;

  const stats = useMemo(() => {
    const totalInBed = computeSpanMinutes(startTime, endTime);

    const stageMins = {
      Awake: 0,
      REM: 0,
      Core: 0,
      Deep: 0,
    };

    let totalFromSegments = 0;

    (segments || []).forEach((s) => {
      const st = STAGES.includes(s.stage) ? s.stage : 'Core';
      const d = Math.max(0, s.duration || 0);
      stageMins[st] += d;
      totalFromSegments += d;
    });

    const totalSleep = stageMins.REM + stageMins.Core + stageMins.Deep;

    const denom = totalInBed > 0 ? totalInBed : totalFromSegments;
    const efficiency = denom > 0 ? (totalSleep / denom) * 100 : 0;

    const pctOfSleep = {
      Awake: denom > 0 ? (stageMins.Awake / denom) * 100 : 0,
      REM: totalSleep > 0 ? (stageMins.REM / totalSleep) * 100 : 0,
      Core: totalSleep > 0 ? (stageMins.Core / totalSleep) * 100 : 0,
      Deep: totalSleep > 0 ? (stageMins.Deep / totalSleep) * 100 : 0,
    };

    return { totalInBed, totalSleep, efficiency, stageMins, pctOfSleep };
  }, [segments, startTime, endTime]);

  const hypno = useMemo(() => {
    const list = segments || [];
    const total = list.reduce((acc, s) => acc + (s.duration || 0), 0);
    const unit = total > 0 ? chartW / total : 0;

    let x = 0;
    const blocks = [];
    const transitions = [];

    list.forEach((s, idx) => {
      const stage = STAGES.includes(s.stage) ? s.stage : 'Core';
      const w = Math.max(2, (s.duration || 0) * unit);
      const level = LEVEL_INDEX[stage] ?? 2;
      const y = level * (blockH + rowGap) + 8;

      blocks.push({ key: `b-${idx}`, stage, x, y, w, h: blockH });

      if (idx > 0) {
        const prevStage = STAGES.includes(list[idx - 1].stage)
          ? list[idx - 1].stage
          : 'Core';
        if (prevStage !== stage) {
          transitions.push({
            key: `t-${idx}`,
            x,
            from: LEVEL_INDEX[prevStage] ?? 2,
            to: level,
          });
        }
      }

      x += w;
    });

    return { blocks, transitions };
  }, [segments, chartW]);

  const StageBar = ({ stage }) => {
    const mins = stats.stageMins[stage] || 0;

    const percent =
      stage === 'Awake'
        ? stats.totalInBed > 0
          ? (mins / stats.totalInBed) * 100
          : 0
        : stats.pctOfSleep[stage] || 0;

    const pctText = `${percent.toFixed(1)}%`;

    const leftW = 78;
    const rightW = 52;
    const gap = 10;

    const trackW = Math.max(120, safeW - leftW - rightW - gap * 2);
    const fillW = Math.max(0, Math.min(trackW, (trackW * percent) / 100));

    return (
      <View style={styles.barRow}>
        <View style={[styles.barLeft, { width: leftW }]}>
          <Text style={styles.barStage}>{stage}</Text>
          <Text style={styles.barDuration}>{minutesToHM(mins)}</Text>
        </View>

        <View style={{ width: gap }} />

        <View style={[styles.barTrack, { width: trackW }]}>
          <View
            style={[
              styles.barFill,
              { width: fillW, backgroundColor: COLORS[stage] },
            ]}
          />
          <View style={styles.barTick} />
          <View style={[styles.barTick, { left: '60%' }]} />
        </View>

        <View style={{ width: gap }} />

        <Text style={[styles.barPct, { width: rightW }]}>{pctText}</Text>
      </View>
    );
  };

  return (
    <View onLayout={handleLayout} style={styles.root}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.title}>Sleep Stages</Text>
          <View style={styles.infoDot}>
            <Text style={styles.infoDotText}>i</Text>
          </View>
        </View>

        {showHeaderIcons ? (
          <View style={styles.headerIcons}>
            {!!onShare && (
              <TouchableOpacity onPress={onShare} style={styles.iconBtn}>
                <MaterialCommunityIcons
                  name="share-variant"
                  size={14}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
            {!!onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={14}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.subRow}>
        <Text style={styles.subText}>
          Sleep duration:{' '}
          <Text style={styles.subStrong}>{minutesToHM(stats.totalSleep)}</Text>
        </Text>
      </View>

      <View style={{ marginTop: 10 }}>
        <Svg width={chartW} height={chartH}>
          <Defs>
            <LinearGradient id="blockGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </LinearGradient>
          </Defs>

          {Array.from({ length: 13 }).map((_, i) => {
            const gx = (chartW / 12) * i;
            return (
              <Line
                key={`g-${i}`}
                x1={gx}
                y1={chartH - 8}
                x2={gx}
                y2={chartH - 4}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {hypno.transitions.map((t) => {
            const yFrom = t.from * (blockH + rowGap) + 8 + blockH / 2;
            const yTo = t.to * (blockH + rowGap) + 8 + blockH / 2;
            return (
              <Line
                key={t.key}
                x1={t.x}
                y1={yFrom}
                x2={t.x}
                y2={yTo}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {hypno.blocks.map((b) => (
            <React.Fragment key={b.key}>
              <Rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={8}
                ry={8}
                fill={COLORS[b.stage]}
                opacity={0.95}
              />
              <Rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={8}
                ry={8}
                fill="url(#blockGlow)"
                opacity={0.22}
              />
            </React.Fragment>
          ))}
        </Svg>

        <View style={[styles.timeRow, { width: chartW }]}>
          <View style={styles.timeLeft}>
            <MaterialCommunityIcons
              name="weather-night"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.timeText}>{startTime}</Text>
          </View>

          <View style={styles.timeRight}>
            <Text style={styles.timeText}>{endTime}</Text>
            <MaterialCommunityIcons
              name="white-balance-sunny"
              size={14}
              color={COLORS.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.barsContainer}>
        <StageBar stage="Awake" />
        <StageBar stage="REM" />
        <StageBar stage="Core" />
        <StageBar stage="Deep" />
      </View>
    </View>
  );
};

// ---------- Styles ----------

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  infoDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  infoDotText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  subStrong: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  barsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLeft: {},
  barStage: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  barDuration: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barTick: {
    position: 'absolute',
    left: '30%',
    top: 2,
    bottom: 2,
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  barPct: {
    textAlign: 'right',
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SleepStagesCard;
