import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const SleepHypnogram = ({ data, startTime = "01:40", endTime = "09:35", dateLabel = "12/6" }) => {
  // --- 1. 布局与视觉配置 ---
  const chartHeight = 180;
  const chartWidth = width - 60; 
  
  // 核心技巧：增加描边宽度来模拟"液态"圆角
  // 描边越宽，转折处的圆角就越大
  const strokeWidth = 20; 
  const actualHeight = chartHeight - strokeWidth; // 减去描边宽度防止被切掉
  const paddingY = strokeWidth / 2; // 垂直方向的内边距

  // --- 2. 关键配置：四阶段高度映射 (Top/Bottom Map) ---
  // 原理：每个阶段占据不同的 Y 轴区间。
  // 为了保证图形不断裂，相邻阶段必须有"重叠 (Overlap)"。
  // 0 是顶部，180 是底部
  const STAGE_MAP = {
    // [Top Y, Bottom Y]
    // Awake: 冲到最顶端，底部只到中间
    'Awake': { top: 0,   bottom: 90 }, 
    
    // REM: 顶部比 Awake 低，底部比 Awake 深
    'REM':   { top: 40,  bottom: 120 }, 
    
    // Light: 核心基准线，居中
    'Light': { top: 80,  bottom: 150 }, 
    
    // Deep: 顶部在下方，底部触底
    'Deep':  { top: 120, bottom: 180 }  
  };

  // 数据预处理
  const totalDuration = data.reduce((acc, cur) => acc + cur.duration, 0);
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;
  const unitWidth = totalDuration > 0 ? chartWidth / totalDuration : 0;

  // --- 3. 生成 SVG 路径 (双线闭合逻辑) ---
  
  // A. 上轮廓线 (Top Line) -> 从左向右画
  let topPathOps = [];
  let currentX = 0;
  
  data.forEach((item, index) => {
    const stageConf = STAGE_MAP[item.stage] || STAGE_MAP['Light'];
    const segmentWidth = item.duration * unitWidth;
    const targetY = stageConf.top + paddingY;

    if (index === 0) {
      topPathOps.push(`M 0 ${targetY}`); 
    } else {
      // 垂直画线连接上一段和这一段的高度
      // 注意：这里用 L (直线)，圆角靠 strokeLinejoin="round" 自动生成
      const prevStage = STAGE_MAP[data[index-1].stage] || STAGE_MAP['Light'];
      const prevY = prevStage.top + paddingY;
      
      // 两个点定住转折，防止斜切
      topPathOps.push(`L ${currentX} ${prevY}`); 
      topPathOps.push(`L ${currentX} ${targetY}`);
    }
    
    topPathOps.push(`L ${currentX + segmentWidth} ${targetY}`);
    currentX += segmentWidth;
  });

  // B. 下轮廓线 (Bottom Line) -> 从右向左回画
  let bottomPathOps = [];
  currentX = chartWidth; 

  for (let i = data.length - 1; i >= 0; i--) {
    const item = data[i];
    const stageConf = STAGE_MAP[item.stage] || STAGE_MAP['Light'];
    const segmentWidth = item.duration * unitWidth;
    const targetY = stageConf.bottom - paddingY;

    if (i === data.length - 1) {
      bottomPathOps.push(`L ${chartWidth} ${targetY}`);
    } 

    // 先往左画水平线
    bottomPathOps.push(`L ${currentX - segmentWidth} ${targetY}`);
    
    // 处理垂直跳变
    if (i > 0) {
        const nextStage = STAGE_MAP[data[i-1].stage] || STAGE_MAP['Light'];
        const nextY = nextStage.bottom - paddingY;
        // 两个点定住转折
        bottomPathOps.push(`L ${currentX - segmentWidth} ${targetY}`);
        bottomPathOps.push(`L ${currentX - segmentWidth} ${nextY}`);
    }

    currentX -= segmentWidth;
  }

  const fullPath = [
    ...topPathOps,
    ...bottomPathOps,
    "Z" // 闭合
  ].join(" ");

  return (
    <View style={styles.container}>
      
      {/* 顶部总睡眠时间 */}
      <View style={styles.headerContainer}>
          <Text style={styles.headerLabel}>Night Sleep</Text>
          <View style={styles.timeRow}>
            <Text style={styles.bigNum}>{totalHours}</Text>
            <Text style={styles.smallUnit}> h </Text>
            <Text style={styles.bigNum}>{totalMinutes}</Text>
            <Text style={styles.smallUnit}> min</Text>
          </View>
      </View>

      {/* --- 核心图表区域 --- */}
      <View style={{ alignItems: 'center', marginVertical: 10, height: chartHeight }}>
        <Svg height={chartHeight} width={chartWidth} style={{overflow: 'visible'}}>
          <Defs>
            {/* 严格匹配图片的四色渐变 */}
            <LinearGradient id="fourStageGrad" x1="0" y1="0" x2="0" y2="1">
              {/* Awake 区域 (0-25%) - 黄色 */}
              <Stop offset="0%" stopColor="#FFC850" />
              <Stop offset="20%" stopColor="#FFC850" />
              
              {/* REM 区域 (25-50%) - 粉红/橙红 */}
              <Stop offset="30%" stopColor="#FF8585" />
              <Stop offset="50%" stopColor="#FF8585" />
              
              {/* Light 区域 (50-75%) - 亮紫 */}
              <Stop offset="60%" stopColor="#A86CFA" />
              <Stop offset="75%" stopColor="#A86CFA" />
              
              {/* Deep 区域 (75-100%) - 深紫 */}
              <Stop offset="85%" stopColor="#703EFF" />
              <Stop offset="100%" stopColor="#703EFF" />
            </LinearGradient>
          </Defs>

          {/* 关键渲染:
            strokeWidth={20} -> 让线条变得非常粗，这是圆角的来源
            strokeLinejoin="round" -> 让粗线条的拐角变圆
          */}
          <Path 
              d={fullPath} 
              fill="url(#fourStageGrad)" 
              stroke="url(#fourStageGrad)"
              strokeWidth={strokeWidth} 
              strokeLinejoin="round" 
          />
        </Svg>
      </View>

      {/* 底部时间标签 */}
      <View style={[styles.bottomLabels, { width: chartWidth }]}>
          <View>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              <Text style={styles.timeLabel}>Bedtime {startTime}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              <Text style={styles.timeLabel}>Wake up {endTime}</Text>
          </View>
      </View>

      {/* 底部图例 - 颜色对应渐变 */}
      <View style={[styles.legendRow, { width: chartWidth }]}>
          <LegendItem color="#703EFF" label="Deep" />
          <LegendItem color="#A86CFA" label="Light" />
          <LegendItem color="#FF8585" label="REM" />
          <LegendItem color="#FFC850" label="Awake" />
      </View>
    </View>
  );
};

const LegendItem = ({color, label}) => (
    <View style={{flexDirection:'row', alignItems:'center'}}>
        <View style={{width:8, height:8, borderRadius:4, backgroundColor:color, marginRight:6}} />
        <Text style={{color:'#D1D1D6', fontSize:10}}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 5,
    },
    headerLabel: {
        color: '#A0A0A0',
        fontSize: 12,
        marginBottom: 2,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    bigNum: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    smallUnit: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10, // 增加间距以免碰到粗线条
    },
    dateLabel: {
        color: '#A0A0A0',
        fontSize: 10,
    },
    timeLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    legendRow: {
        flexDirection: 'row', 
        justifyContent:'space-between', 
        marginTop: 20, 
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 15,
    }
});

export default SleepHypnogram;