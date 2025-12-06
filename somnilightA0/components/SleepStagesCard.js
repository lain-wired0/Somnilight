// SleepStagesCard.js
// 说明：Apple 风格睡眠阶段组件（无内层卡片背景）
// 只负责内容布局，请用外层页面的 card 样式包裹
// 注意：APP 内文字全部为英文，注释为中文

import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Rect, Line, Defs, LinearGradient, Stop } from "react-native-svg";

// 睡眠阶段类型（Apple 风格命名）
const STAGES = ["Awake", "REM", "Core", "Deep"];

// 颜色配置（可根据整体主题再微调）
const COLORS = {
  textPrimary: "#EDEFF6",
  textSecondary: "#9AA3B2",
  divider: "rgba(255,255,255,0.08)",

  Awake: "#FFC850",  
  REM: "#FF8585",    
  Core: "#A86CFA",   
  Deep: "#703EFF",  
};

// 每一层的垂直索引（越上越清醒）
const LEVEL_INDEX = {
  Awake: 0,
  REM: 1,
  Core: 2,
  Deep: 3,
};

// ---------- 工具函数 ----------

// 分钟 → “xh ym” 文本
const minutesToHM = (mins) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// "HH:mm" → 距离 00:00 的分钟数
const timeStrToMin = (t) => {
  if (!t) return 0;
  const [hh, mm] = t.split(":").map((x) => parseInt(x, 10));
  return (hh || 0) * 60 + (mm || 0);
};

// 计算在床时长（处理跨天）
const computeSpanMinutes = (startStr, endStr) => {
  const s = timeStrToMin(startStr);
  const e = timeStrToMin(endStr);
  if (e >= s) return e - s;
  return 24 * 60 - s + e;
};

// ---------- 主组件 ----------

/**
 * @param {Array} segments
 *   每段形如：{ stage: 'Awake'|'REM'|'Core'|'Deep', duration: number(分钟) }
 * @param {string} startTime "HH:mm"
 * @param {string} endTime "HH:mm"
 * @param {boolean} showHeaderIcons 是否显示右上角图标（默认 false）
 */
const SleepStagesCard = ({
  segments = [],
  startTime = "01:40",
  endTime = "09:35",
  showHeaderIcons = false,
  onShare,
  onEdit,
}) => {
  // 用 onLayout 拿到外层容器真实宽度，避免用屏幕宽度“猜”
  const [containerW, setContainerW] = useState(0);

  const handleLayout = useCallback(
    (e) => {
      const w = e?.nativeEvent?.layout?.width || 0;
      if (w && w !== containerW) setContainerW(w);
    },
    [containerW]
  );

  // 给一个兜底宽度，防止首次渲染为 0
  const safeW = Math.max(containerW, 260);

  // 顶部图表的尺寸基于真实宽度
  const chartW = safeW;
  const chartH = 150;
  const blockH = 26;
  const rowGap = 8;

  // ---------- 统计睡眠时长 / 效率 ----------

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
      const st = STAGES.includes(s.stage) ? s.stage : "Core";
      const d = Math.max(0, s.duration || 0);
      stageMins[st] += d;
      totalFromSegments += d;
    });

    // 睡眠时长 = 除 Awake 之外的时间
    const totalSleep = stageMins.REM + stageMins.Core + stageMins.Deep;

    // 睡眠效率：优先用在床时长；若没传 start/end 就退化为 segments 总和
    const denom = totalInBed > 0 ? totalInBed : totalFromSegments;
    const efficiency = denom > 0 ? (totalSleep / denom) * 100 : 0;

    // 阶段百分比：Awake 用在床百分比，其余用睡眠内百分比
    const pctOfSleep = {
      Awake: denom > 0 ? (stageMins.Awake / denom) * 100 : 0,
      REM: totalSleep > 0 ? (stageMins.REM / totalSleep) * 100 : 0,
      Core: totalSleep > 0 ? (stageMins.Core / totalSleep) * 100 : 0,
      Deep: totalSleep > 0 ? (stageMins.Deep / totalSleep) * 100 : 0,
    };

    return { totalInBed, totalSleep, efficiency, stageMins, pctOfSleep };
  }, [segments, startTime, endTime]);

  // ---------- 构建 hypnogram 路径 ----------

  const hypno = useMemo(() => {
    const list = segments || [];
    const total = list.reduce((acc, s) => acc + (s.duration || 0), 0);
    const unit = total > 0 ? chartW / total : 0;

    let x = 0;
    const blocks = [];
    const transitions = [];

    list.forEach((s, idx) => {
      const stage = STAGES.includes(s.stage) ? s.stage : "Core";
      const w = Math.max(2, (s.duration || 0) * unit);
      const level = LEVEL_INDEX[stage] ?? 2;
      const y = level * (blockH + rowGap) + 8; // 顶部留一点空隙

      blocks.push({ key: `b-${idx}`, stage, x, y, w, h: blockH });

      // 阶段切换处加一条细竖线，增强节奏感
      if (idx > 0) {
        const prevStage = STAGES.includes(list[idx - 1].stage)
          ? list[idx - 1].stage
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
  }, [segments, chartW]);

  // ---------- 单行阶段进度条 ----------

  const StageBar = ({ stage }) => {
    const mins = stats.stageMins[stage] || 0;

    // 百分比计算
    const percent =
      stage === "Awake"
        ? stats.totalInBed > 0
          ? (mins / stats.totalInBed) * 100
          : 0
        : stats.pctOfSleep[stage] || 0;

    const pctText = `${percent.toFixed(1)}%`;

    // 固定三段宽度：左侧标题区、中间进度条、右侧百分比
    const leftW = 78;
    const rightW = 52;
    const gap = 10;

    const trackW = Math.max(120, safeW - leftW - rightW - gap * 2);
    const fillW = Math.max(0, Math.min(trackW, (trackW * percent) / 100));

    return (
      <View style={styles.barRow}>
        {/* 左侧：阶段名称 + 时长 */}
        <View style={[styles.barLeft, { width: leftW }]}>
          <Text style={styles.barStage}>{stage}</Text>
          <Text style={styles.barDuration}>{minutesToHM(mins)}</Text>
        </View>

        <View style={{ width: gap }} />

        {/* 中间：进度条本体 */}
        <View style={[styles.barTrack, { width: trackW }]}>
          <View
            style={[
              styles.barFill,
              { width: fillW, backgroundColor: COLORS[stage] },
            ]}
          />
          {/* 装饰性刻度，模仿 Apple 的“最佳区间”视觉 */}
          <View style={styles.barTick} />
          <View style={[styles.barTick, { left: "60%" }]} />
        </View>

        <View style={{ width: gap }} />

        {/* 右侧：百分比 */}
        <Text style={[styles.barPct, { width: rightW }]}>{pctText}</Text>
      </View>
    );
  };

  // ---------- 渲染 ----------

  return (
    // 用 onLayout 获取宽度；不设置背景/圆角，交给外层卡片处理
    <View onLayout={handleLayout} style={styles.root}>
      {/* 头部标题行 */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.title}>Sleep Stages</Text>
          <View style={styles.infoDot}>
            <Text style={styles.infoDotText}>i</Text>
          </View>
        </View>

        {showHeaderIcons ? (
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
        ) : (
          <View />
        )}
      </View>

      {/* 二级信息：时长 + 效率 */}
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

      {/* 上方 hypnogram 图表 */}
      <View style={{ marginTop: 10 }}>
        <Svg width={chartW} height={150}>
          <Defs>
            {/* 方块的顶部高光渐变 */}
            <LinearGradient id="blockGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </LinearGradient>
          </Defs>

          {/* 底部小刻度点 */}
          {Array.from({ length: 13 }).map((_, i) => {
            const gx = (chartW / 12) * i;
            return (
              <Line
                key={`g-${i}`}
                x1={gx}
                y1={150 - 8}
                x2={gx}
                y2={150 - 4}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {/* 阶段切换竖线 */}
          {hypno.transitions.map((t) => {
            const yFrom =
              t.from * (blockH + rowGap) + 8 + blockH / 2;
            const yTo =
              t.to * (blockH + rowGap) + 8 + blockH / 2;
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

          {/* 方块主体 */}
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

        {/* 时间行（英文） */}
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

      {/* 下方阶段条 */}
      <View style={styles.barsContainer}>
        <StageBar stage="Awake" />
        <StageBar stage="REM" />
        <StageBar stage="Core" />
        <StageBar stage="Deep" />
      </View>

      {/* 小脚注 */}
      <View style={styles.footerRow}>
        <View style={styles.legendDot} />
        <Text style={styles.footerText}>Optimal range</Text>
      </View>
    </View>
  );
};

// ---------- 样式 ----------

const styles = StyleSheet.create({
  // 根容器不设置背景/圆角，由外层 card 决定
  root: {
    width: "100%",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  infoDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  infoDotText: {
    color: COLORS.textSecondary,
    fontSize: 11,
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
    backgroundColor: "rgba(255,255,255,0.08)",
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
    flexWrap: "wrap",
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  subStrong: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  barsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barLeft: {},
  barStage: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  barDuration: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
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
    textAlign: "right",
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginRight: 8,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
});

export default SleepStagesCard;
