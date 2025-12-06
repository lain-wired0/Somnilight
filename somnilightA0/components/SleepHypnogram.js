// SleepStagesCard.js
// Apple-style "Sleep Stages" card for React Native
// - Dark card UI
// - Block-based hypnogram (Awake/REM/Core/Deep)
// - Stage breakdown bars with durations & percentages
// - All in-app text is English

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Svg, { Rect, Line, Defs, LinearGradient, Stop } from "react-native-svg";

// -----------------------------
// Types of sleep stages
// Apple naming style: Awake / REM / Core / Deep
// -----------------------------
const STAGES = ["Awake", "REM", "Core", "Deep"];

// -----------------------------
// Visual config
// -----------------------------
const COLORS = {
  bg: "#0F1118",
  card: "#151824",
  textPrimary: "#EDEFF6",
  textSecondary: "#9AA3B2",
  divider: "rgba(255,255,255,0.06)",

  Awake: "#FF8A4C", // orange
  REM: "#6FE6FF",   // cyan
  Core: "#5B8CFF",  // blue
  Deep: "#7A6BFF",  // purple
};

// Stage vertical positions (top chart)
// Higher = more awake
const LEVEL_INDEX = {
  Awake: 0,
  REM: 1,
  Core: 2,
  Deep: 3,
};

// -----------------------------
// Utility helpers
// -----------------------------
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);

const minutesToHM = (mins) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Convert "00:38" -> minutes from 00:00
const timeStrToMin = (t) => {
  if (!t) return 0;
  const [hh, mm] = t.split(":").map((x) => parseInt(x, 10));
  return (hh || 0) * 60 + (mm || 0);
};

// Handle crossing midnight if needed
const computeSpanMinutes = (startStr, endStr) => {
  const s = timeStrToMin(startStr);
  const e = timeStrToMin(endStr);
  if (e >= s) return e - s;
  return 24 * 60 - s + e;
};

// -----------------------------
// Main component
// -----------------------------
/**
 * @param {Array} segments
 *  Each segment:
 *  {
 *    stage: "Awake" | "REM" | "Core" | "Deep",
 *    duration: number (minutes)
 *  }
 *
 * @param {string} startTime "HH:mm"
 * @param {string} endTime "HH:mm"
 *
 * @param {number} width optional
 */
const SleepStagesCard = ({
  segments = [
    // default mock data (roughly similar rhythm to Apple style)
    { stage: "Core", duration: 20 },
    { stage: "Deep", duration: 35 },
    { stage: "Core", duration: 30 },
    { stage: "REM", duration: 25 },
    { stage: "Core", duration: 50 },
    { stage: "Deep", duration: 28 },
    { stage: "Core", duration: 45 },
    { stage: "REM", duration: 30 },
    { stage: "Awake", duration: 5 },
    { stage: "Core", duration: 40 },
    { stage: "REM", duration: 17 },
    { stage: "Deep", duration: 20 },
  ],
  startTime = "00:38",
  endTime = "07:00",
  width,
  onShare,
  onEdit,
}) => {
  const screenW = Dimensions.get("window").width;
  const cardW = width || Math.min(screenW - 32, 420);

  // Chart layout
  const chartW = cardW - 28;  // internal padding considered
  const chartH = 150;
  const blockH = 26;
  const rowGap = 8;

  // -----------------------------
  // Compute totals
  // -----------------------------
  const stats = useMemo(() => {
    const totalInBed = computeSpanMinutes(startTime, endTime);

    const stageMins = {
      Awake: 0,
      REM: 0,
      Core: 0,
      Deep: 0,
    };

    let totalFromSegments = 0;
    segments.forEach((s) => {
      const st = STAGES.includes(s.stage) ? s.stage : "Core";
      const d = Math.max(0, s.duration || 0);
      stageMins[st] += d;
      totalFromSegments += d;
    });

    // Define "sleep time" as non-awake stages
    const totalSleep = stageMins.REM + stageMins.Core + stageMins.Deep;

    // Sleep efficiency:
    // Prefer in-bed window if user provides plausible times,
    // else fall back to segments sum
    const denom = totalInBed > 0 ? totalInBed : totalFromSegments;
    const efficiency = denom > 0 ? (totalSleep / denom) * 100 : 0;

    // Percent of sleep (exclude Awake) - Apple-style
    const pctOfSleep = {
      Awake: denom > 0 ? (stageMins.Awake / denom) * 100 : 0, // shown as tiny in Apple card
      REM: totalSleep > 0 ? (stageMins.REM / totalSleep) * 100 : 0,
      Core: totalSleep > 0 ? (stageMins.Core / totalSleep) * 100 : 0,
      Deep: totalSleep > 0 ? (stageMins.Deep / totalSleep) * 100 : 0,
    };

    return {
      totalInBed,
      totalSleep,
      efficiency,
      stageMins,
      pctOfSleep,
    };
  }, [segments, startTime, endTime]);

  // -----------------------------
  // Build hypnogram geometry
  // -----------------------------
  const hypno = useMemo(() => {
    const total = segments.reduce((acc, s) => acc + (s.duration || 0), 0);
    const unit = total > 0 ? chartW / total : 0;

    let x = 0;
    const blocks = [];
    const transitions = [];

    segments.forEach((s, idx) => {
      const stage = STAGES.includes(s.stage) ? s.stage : "Core";
      const w = Math.max(2, (s.duration || 0) * unit);

      const level = LEVEL_INDEX[stage] ?? 2;

      // Compute y by level: top row = Awake
      const y =
        level * (blockH + rowGap) +
        8; // top padding inside chart

      blocks.push({
        key: `b-${idx}`,
        stage,
        x,
        y,
        w,
        h: blockH,
      });

      // Create a subtle vertical transition line at stage change
      if (idx > 0) {
        const prevStage = STAGES.includes(segments[idx - 1].stage)
          ? segments[idx - 1].stage
          : "Core";
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
  }, [segments, chartW, blockH, rowGap]);

  // -----------------------------
  // Render helpers
  // -----------------------------
  const StageBar = ({ stage }) => {
    const mins = stats.stageMins[stage] || 0;

    // For bar percent display
    // Awake uses % of in-bed, others use % of sleep (Apple-like feel)
    const percent =
      stage === "Awake"
        ? stats.totalInBed > 0
          ? (mins / stats.totalInBed) * 100
          : 0
        : stats.pctOfSleep[stage] || 0;

    const pctText = `${percent.toFixed(1)}%`;

    // progress bar width
    const trackW = chartW - 110; // leave space for right percent label
    const fillW = Math.max(0, Math.min(trackW, (trackW * percent) / 100));

    return (
      <View style={styles.barRow}>
        <View style={styles.barLeft}>
          <Text style={styles.barStage}>{stage}</Text>
          <Text style={styles.barDuration}>{minutesToHM(mins)}</Text>
        </View>

        <View style={[styles.barTrack, { width: trackW }]}>
          <View
            style={[
              styles.barFill,
              {
                width: fillW,
                backgroundColor: COLORS[stage],
              },
            ]}
          />
          {/* small marker segments like Apple (decorative) */}
          <View style={styles.barTick} />
          <View style={[styles.barTick, { left: "60%" }]} />
        </View>

        <Text style={styles.barPct}>{pctText}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.card, { width: cardW }]}>
      {/* ---------------- Header row ---------------- */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.title}>Sleep Stages</Text>
          <View style={styles.infoDot}>
            <Text style={styles.infoDotText}>i</Text>
          </View>
        </View>

        <View style={styles.headerIcons}>
          {!!onShare && (
            <TouchableOpacity onPress={onShare} style={styles.iconBtn}>
              <Text style={styles.iconText}>⤴︎</Text>
            </TouchableOpacity>
          )}
          {!!onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
              <Text style={styles.iconText}>✎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ---------------- Sub header stats ---------------- */}
      <View style={styles.subRow}>
        <Text style={styles.subText}>
          Sleep duration:{" "}
          <Text style={styles.subStrong}>{minutesToHM(stats.totalSleep)}</Text>
        </Text>
        <Text style={styles.subText}>
          Sleep efficiency:{" "}
          <Text style={styles.subStrong}>{stats.efficiency.toFixed(1)}%</Text>
        </Text>
      </View>

      {/* ---------------- Hypnogram chart ---------------- */}
      <View style={{ marginTop: 10 }}>
        <Svg width={chartW} height={chartH}>
          <Defs>
            {/* subtle glow gradient for blocks */}
            <LinearGradient id="blockGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </LinearGradient>
          </Defs>

          {/* faint baseline grid dots range */}
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

          {/* transition lines */}
          {hypno.transitions.map((t) => {
            const yFrom =
              t.from * (blockH + rowGap) + 8 + blockH / 2;
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

          {/* blocks */}
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
              {/* subtle top glow overlay */}
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

        {/* time labels under chart (English) */}
        <View style={[styles.timeRow, { width: chartW }]}>
          <View style={styles.timeLeft}>
            <Text style={styles.timeIcon}>🌙</Text>
            <Text style={styles.timeText}>{startTime}</Text>
          </View>

          <View style={styles.timeCenter}>
            <Text style={styles.timeIcon}>🛏️</Text>
            <Text style={styles.timeText}>
              {minutesToHM(stats.totalInBed || stats.totalSleep)}
            </Text>
          </View>

          <View style={styles.timeRight}>
            <Text style={styles.timeText}>{endTime}</Text>
            <Text style={styles.timeIcon}>🌅</Text>
          </View>
        </View>
      </View>

      {/* ---------------- Breakdown bars ---------------- */}
      <View style={styles.barsContainer}>
        <StageBar stage="Awake" />
        <StageBar stage="REM" />
        <StageBar stage="Core" />
        <StageBar stage="Deep" />
      </View>

      {/* Footer tiny hint (optional, keep English) */}
      <View style={styles.footerRow}>
        <View style={styles.legendDot} />
        <Text style={styles.footerText}>Optimal range</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.footerTextMuted}>Source: Apple-style UI mock</Text>
      </View>
    </View>
  );
};

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  infoDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  infoDotText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  subStrong: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  // Time labels row under chart
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeIcon: {
    fontSize: 11,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  // Breakdown bars
  barsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 10,
  },

  barRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  barLeft: {
    width: 70,
  },
  barStage: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  barDuration: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },

  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginHorizontal: 10,
    position: "relative",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },

  // Decorative ticks inside track
  barTick: {
    position: "absolute",
    left: "30%",
    top: 2,
    bottom: 2,
    width: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  barPct: {
    width: 50,
    textAlign: "right",
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  // Footer
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginRight: 6,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "600",
  },
  footerTextMuted: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontWeight: "500",
  },
});

export default SleepStagesCard;
