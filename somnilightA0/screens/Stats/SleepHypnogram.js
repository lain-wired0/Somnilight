import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const SleepHypnogram = ({ data, startTime = "01:40", endTime = "09:35", dateLabel = "12/6" }) => {
  // --- 配置参数 ---
  const chartHeight = 180;
  const chartWidth = width - 60; // 卡片宽度减去内边距
  
  // Y轴映射 (0是顶部，180是底部)
  // 参考图逻辑：清醒(Awake)在最高处，深睡(Deep)在最低处
  const STAGE_Y = {
    'Awake': 10,   // 黄色 (最高)
    'REM': 70,     // 红色
    'Light': 120,  // 浅紫
    'Deep': 170    // 深紫 (最低)
  };

  // 1. 计算总睡眠时长
  // 假设 data 中的 duration 单位是分钟
  const totalDuration = data.reduce((acc, cur) => acc + cur.duration, 0);
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;
  
  const unitWidth = totalDuration > 0 ? chartWidth / totalDuration : 0;

  // 2. 生成 SVG 路径
  let pathD = `M0 ${chartHeight}`; // 起点左下角
  let currentX = 0;
  
  data.forEach((item, index) => {
    const y = STAGE_Y[item.stage];
    const segmentWidth = item.duration * unitWidth;
    
    if (index === 0) {
        // 第一个点直接移动到位
        pathD += ` L0 ${y}`;
    } else {
        // 连接上一个点到当前点 (垂直线)
        // 技巧：虽然画的是直线，但稍后我们在 <Path> 上加 strokeLinejoin="round" 
        // 这些直角折线会自动变得圆润，形成像带子一样的效果，完全符合参考图
        pathD += ` L${currentX} ${y}`; 
    }

    // 画水平线 (持续时间)
    pathD += ` L${currentX + segmentWidth} ${y}`;
    
    currentX += segmentWidth;
  });

  // 闭合路径回到底部，用于填充渐变背景
  const fillPathD = `${pathD} L${chartWidth} ${chartHeight} L0 ${chartHeight} Z`;

  return (
    <View style={styles.container}>
      
      {/* 1. 顶部信息：睡眠总时长 */}
      <View style={styles.headerContainer}>
          <Text style={styles.headerLabel}>Night Sleep</Text>
          <View style={styles.timeRow}>
            <Text style={styles.bigNum}>{totalHours}</Text>
            <Text style={styles.smallUnit}> h </Text>
            <Text style={styles.bigNum}>{totalMinutes}</Text>
            <Text style={styles.smallUnit}> min</Text>
          </View>
      </View>

      {/* 2. 中间图表 */}
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <Svg height={chartHeight + 10} width={chartWidth}>
          <Defs>
            {/* 纵向渐变：模仿参考图配色 (上黄下紫) */}
            <LinearGradient id="hypnoGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FCCB4D" />   {/* Awake: 金黄 */}
              <Stop offset="40%" stopColor="#FF8787" />  {/* REM: 粉红 */}
              <Stop offset="70%" stopColor="#A56DFB" />  {/* Light: 亮紫 */}
              <Stop offset="100%" stopColor="#6E44FF" /> {/* Deep: 深紫 */}
            </LinearGradient>
          </Defs>

          {/* 填充层 (半透明背景) */}
          <Path 
              d={fillPathD} 
              fill="url(#hypnoGrad)" 
              fillOpacity="0.8"
          />

          {/* 轮廓层 (白色粗线条 + 圆角连接 = 带状效果) */}
          <Path 
              d={pathD} 
              stroke="white" 
              strokeWidth="3"
              strokeLinejoin="round" // 【关键】让折角变圆润
              fill="none"
          />
        </Svg>
      </View>

      {/* 3. 底部标签：入睡和醒来时间 */}
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

      {/* 4. 底部图例 */}
      <View style={[styles.legendRow, { width: chartWidth }]}>
          <LegendItem color="#6E44FF" label="Deep" />
          <LegendItem color="#A56DFB" label="Light" />
          <LegendItem color="#FF8787" label="REM" />
          <LegendItem color="#FCCB4D" label="Awake" />
      </View>
    </View>
  );
};

// 内部小组件：图例项
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
        marginBottom: 10,
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
        marginTop: 5,
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