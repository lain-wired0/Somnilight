import React, { useState, useLayoutEffect } from 'react';
import { 
  View,
  Image,
  ImageBackground, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView,
  StatusBar,
  FlatList
} from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { deviceWidth, deviceHeight } from '../App.js';
import { containers, ele, textStyles } from '../styles';

// import { containers } from '../styles'; 

const { width } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Day'); // 控制显示 Day 还是 Week

    useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // 关键：隐藏头部
    });
  }, [navigation]);

  return (
    <View style={{
        backgroundColor:'#05011C',
        flex:1,
    }}>
        <ImageBackground 
            source={require('../assets/general_images/bg_stats.png')} 
            style={bg_style} 
        >
    <SafeAreaView style={[styles.container, {backgroundColor: 'transparent'}]}>
      <StatusBar barStyle="light-content" />
      
      {/* --- Header Area --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sleep</Text>
        
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {['Day', 'Week', 'Month'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeLine} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 根据 Tab 切换渲染不同组件 */}
        {activeTab === 'Day' && <DayView />}
        {activeTab === 'Week' && <WeekView />}
        {activeTab === 'Month' && <MonthView />}

      </ScrollView>

      {/* --- Bottom Navigation Simulation --- */}
      <View style={styles.bottomNav}>
        <Text style={styles.navIcon}>🏠</Text>
        <Text style={[styles.navIcon, {color: '#fff'}]}>Iı.</Text>
        <Text style={styles.navIcon}>👤</Text>
      </View>
    </SafeAreaView>
    </ImageBackground> 
    </View>
  );
};

// ==========================================
// Component: Day View (UI Page 1) 
// ==========================================
const DayView = () => {
  // 1. 状态：记录当前选中的日期，默认为今天
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 2. 数据：生成日期列表 (前后 14 天)
  // 使用 useMemo 防止每次渲染都重新计算
  const dates = React.useMemo(() => {
    const days = [];
    const today = new Date();
    // 生成从 14 天前 到 14 天后 的日期 (共29天)
    for (let i = -14; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  // 3. 辅助函数
  // 格式化顶部大标题 (例如: "June 18, 2025")
  const formatDateHeader = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // 判断是否是同一天 (用于高亮显示)
  const isSameDay = (d1, d2) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View>
      {/* --- Date Strip (左右滑动日期栏) --- */}
      <View style={styles.dateStrip}>
        <FlatList
          horizontal // 开启横向滚动
          data={dates}
          keyExtractor={(item) => item.toISOString()}
          showsHorizontalScrollIndicator={false} // 隐藏滚动条
          contentContainerStyle={{ paddingHorizontal: 15 }} // 列表两侧留白
          
          // 初始定位到“今天”
          // getItemLayout 帮助 FlatList 快速计算位置，提高性能
          initialScrollIndex={14} 
          getItemLayout={(data, index) => (
            { length: 55, offset: 55 * index, index } // 60 = 宽度45 + 间距15
          )}
          
          renderItem={({ item }) => {
            const isActive = isSameDay(item, selectedDate);
            const dayLabel = daysOfWeek[item.getDay()]; // Sun, Mon...
            const dateNum = item.getDate(); // 18, 19...

            return (
              <TouchableOpacity
                onPress={() => setSelectedDate(item)}
                style={[
                  styles.dateItem, 
                  isActive && styles.activeDateItem, 
                  { marginRight: 12 } // 给每个日期右侧加间距
                ]}
              >
                <Text style={[
                    styles.dateTextDay,
                    isActive && { color: 'white' } // 选中时星期变白
                ]}>{dayLabel}</Text>
                <Text style={styles.dateTextNum}>{dateNum}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 动态显示的日期标题 */}
      <Text style={styles.dateHeader}>{formatDateHeader(selectedDate)}</Text>

      {/* Main Sleep Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          {/* Donut Chart Simulation */}
          <View style={styles.donutContainer}>
            <ScoreCircle score={78} size={80} strokeWidth={8} color="#5D5FEF" />
          </View>
          
          {/* Stats Text */}
          <View style={styles.mainStatsText}>
            <Text style={styles.cardTitle}>Sleep time</Text>
            <Text style={styles.subText}>12:00 PM – 8:30 AM</Text>
            <View style={styles.rowSpaced}>
                <View>
                    <Text style={styles.statLabel}>Asleep</Text>
                    <Text style={styles.statValue}>08 h 10 m</Text>
                </View>
                <View style={{marginLeft: 20}}>
                    <Text style={styles.statLabel}>Awake</Text>
                    <Text style={styles.statValue}>20 min</Text>
                </View>
            </View>
          </View>
          <Image 
            source={require('../assets/general_images/moon.png')} 
            style={styles.moonIcon} 
          />
        </View>

        {/* Stages Chart Simulation */}
        <Text style={styles.sectionTitle}>Stages</Text>
        <Text style={styles.sectionSub}>During the whole sleep process</Text>
        
        <View style={styles.chartContainer}>
            {[40, 60, 30, 50, 40, 70, 30, 50].map((h, i) => (
                <View key={i} style={styles.barContainer}>
                    <View style={[styles.barSegment, { height: h, backgroundColor: '#8A84E2' }]} /> 
                    <View style={[styles.barSegment, { height: h * 0.5, backgroundColor: '#5D5FEF' }]} />
                    <View style={[styles.barSegment, { height: 10, backgroundColor: '#3A3A6A' }]} />
                </View>
            ))}
        </View>
        
        {/* X-Axis Labels */}
        <View style={styles.xAxis}>
            {['12PM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM'].map((t, i) => (
                <Text key={i} style={styles.xAxisText}>{t}</Text>
            ))}
        </View>
        
        {/* Legend */}
        <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#5D5FEF'}]}/><Text style={styles.legendText}>Deep sleep</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#8A84E2'}]}/><Text style={styles.legendText}>Light sleep</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#3A3A6A'}]}/><Text style={styles.legendText}>Awake</Text></View>
        </View>
      </View>

      <Text style={styles.sectionHeaderOutside}>Sleep signs</Text>

      {/* Sleep Signs Grid */}
      <View style={styles.signsCard}>
        <View style={styles.signRow}>
            <View style={styles.signItem}>
                <Text style={styles.signLabel}>Snoring</Text>
                <Text style={styles.signValue}>4h 12m</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.signItem}>
                <Text style={styles.signLabel}>Breathing</Text>
                <Text style={styles.signValue}>12 – 21</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.signItem}>
                <Text style={styles.signLabel}>Body movement</Text>
                <Text style={styles.signValue}>2</Text>
            </View>
        </View>
        
        <View style={styles.horizontalDivider} />

        <View style={styles.signRow}>
             <View style={styles.signItem}>
                <Text style={styles.signLabel}>Heart beats</Text>
                <Text style={styles.smallLabel}>BMP</Text>
                <Text style={styles.signValue}>64 – 80</Text>
            </View>
             <View style={styles.signItem}>
                <Text style={[styles.signLabel, {opacity:0}]}>.</Text> 
                <Text style={styles.smallLabel}>HRV</Text>
                <Text style={styles.signValue}>36 – 113</Text>
            </View>
            <View style={{flex:1, height: 40, justifyContent:'center', alignItems:'center'}}>
                <Image
                  source={require('../assets/general_images/heart_rate.png')}
                  style={{ width: 129, height: 41, resizeMode: 'contain' }} 
                />
            </View>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// Component: Week View (UI Page 2) - Modified
// ==========================================
const WeekView = () => {
  // 1. 状态：记录当前选中的周 (存周开始的日期对象)
  const [selectedWeekStart, setSelectedWeekStart] = useState(getStartOfWeek(new Date()));

  // 辅助函数：获取某天所在周的周日(起始日)
  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
  }

  // 2. 数据：生成周列表 (前后 4 周)
  const weeks = React.useMemo(() => {
    const weekList = [];
    const currentStart = getStartOfWeek(new Date());

    // 生成从 4 周前 到 4 周后
    for (let i = -4; i <= 4; i++) {
      const start = new Date(currentStart);
      start.setDate(start.getDate() + (i * 7)); // 每次加 7 天
      
      const end = new Date(start);
      end.setDate(end.getDate() + 6); // 结束日期是开始日期 + 6天

      weekList.push({ start, end });
    }
    return weekList;
  }, []);

  // 3. 辅助函数：判断是否选中
  const isSameWeek = (d1, d2) => {
    return d1.getTime() === d2.getTime();
  };

  // 格式化显示 (例如: "Jun 16 - 22")
  const formatWeekLabel = (start, end) => {
    // 如果跨月份 (Jun 28 - Jul 4)
    if (start.getMonth() !== end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()}`; // 简单显示数字，或者你可以写更复杂点
    }
    return `${start.getDate()} - ${end.getDate()}`;
  };

  const formatMonthLabel = (date) => {
     return date.toLocaleDateString('en-US', { month: 'short' }); // "Jun"
  };

  return (
    <View>
      {/* --- Week Selector (周选择器) --- */}
      <View style={styles.dateStrip}>
        <FlatList
          horizontal
          data={weeks}
          keyExtractor={(item) => item.start.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          
          // 初始定位到“本周” (中间位置)
          initialScrollIndex={4} 
          getItemLayout={(data, index) => (
            { length: 85, offset: 85 * index, index } // 宽度要设大一点
          )}
          
          renderItem={({ item }) => {
            const isActive = isSameWeek(item.start, selectedWeekStart);
            
            return (
              <TouchableOpacity
                onPress={() => setSelectedWeekStart(item.start)}
                style={[
                  styles.weekItem, // <--- 注意：这里用了一个新样式
                  isActive && styles.activeDateItem, 
                  { marginRight: 15 }
                ]}
              >
                <Text style={[
                    styles.dateTextDay,
                    isActive && { color: 'white' }
                ]}>{formatMonthLabel(item.start)}</Text>
                
                <Text style={[
                    styles.dateTextNum, // 复用数字样式，但可能需要缩小一点字体
                    { fontSize: 16 }    // 微调字体大小以适应
                ]}>
                    {formatWeekLabel(item.start, item.end)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Summary Stats */}
      <View style={styles.weekSummary}>
        <View>
            <Text style={styles.bigTime}>7<Text style={styles.unitText}>h</Text> 51<Text style={styles.unitText}>m</Text></Text>
            <Text style={styles.subLabel}>Average sleep time</Text>
        </View>
        <Image 
            source={require('../assets/general_images/moon.png')} 
            style={styles.moonIconBig} 
            />
      </View>

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

      {/* Weekly Chart Card */}
      <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly sleep condition statistics</Text>
          
          <View style={[styles.chartContainer, {height: 150, alignItems: 'flex-end', paddingTop: 30}]}>
             <View style={{position:'absolute', top: 50, left:0, right:0, height:1, backgroundColor:'#ffffff20'}} />
             <View style={{position:'absolute', bottom: 50, left:0, right:0, height:1, backgroundColor:'#ffffff20'}} />

             {[60, 40, 80, 100, 70, 90, 50].map((h, i) => (
                <View key={i} style={{alignItems:'center', flex:1}}>
                    <View style={[styles.weekBar, { height: h, backgroundColor: '#8A84E2' }]} /> 
                </View>
            ))}
          </View>

          <View style={styles.xAxis}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((t, i) => (
                <Text key={i} style={styles.xAxisText}>{t}</Text>
            ))}
          </View>
      </View>

      {/* Comparison Stats */}
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

      {/* Advice */}
      <Text style={styles.sectionHeaderOutside}>Sleep advice</Text>
      <View style={[styles.card, {backgroundColor: '#2D1B69'}]}>
          <Text style={{color:'white', fontSize: 14, lineHeight: 20}}>
              Try to maintain a regular schedule, go to bed 15 minutes early...
          </Text>
      </View>
    </View>
  );
};

// ==========================================
// Component: Month View (UI Page 3)
// ==========================================
const MonthView = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 = Jan

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // 模拟数据：这个月每一天的睡眠分数 (30个数据点)
  const mockTrendData = [
    65, 70, 75, 72, 80, 85, 82, 
    78, 70, 60, 65, 75, 88, 90, 
    85, 80, 75, 70, 72, 78, 85, 
    90, 92, 88, 85, 80, 75, 70, 75, 80
  ];

  return (
    <View>
      {/* 1. Month Selector (月份选择器) */}
      <View style={styles.dateStrip}>
        <FlatList
          horizontal
          data={months}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          initialScrollIndex={selectedMonth}
          getItemLayout={(data, index) => ({ length: 75, offset: 75 * index, index })}
          renderItem={({ item, index }) => {
            const isActive = index === selectedMonth;
            return (
              <TouchableOpacity
                onPress={() => setSelectedMonth(index)}
                style={[
                  styles.monthItem, // 新样式
                  isActive && styles.activeDateItem, 
                  { marginRight: 15 }
                ]}
              >
                <Text style={[
                    styles.dateTextNum, 
                    { fontSize: 16 },
                    isActive ? { color: 'white' } : { color: '#8E8E93' }
                ]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 2. Monthly Summary (月度大字总结) */}
      <View style={styles.weekSummary}>
        <View>
             <Text style={styles.bigTime}>82<Text style={styles.unitText}>avg</Text></Text>
             <Text style={styles.subLabel}>Sleep Quality Score</Text>
        </View>
        <View style={{alignItems:'flex-end'}}>
            <Text style={styles.statBig}>230<Text style={styles.unitText}>h</Text></Text>
            <Text style={styles.subLabel}>Total Sleep Time</Text>
        </View>
      </View>

      {/* 3. Sleep Quality Trend Chart (趋势图) */}
      <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Quality Trend</Text>
          <Text style={styles.subText}>Fluctuation over the month</Text>
          
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <MonthlyTrendChart data={mockTrendData} />
          </View>
      </View>

      {/* 4. Monthly Calendar Heatmap (日历热力点) */}
      <View style={styles.card}>
         <Text style={styles.cardTitle}>Consistency</Text>
         <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15}}>
             {Array.from({ length: 30 }).map((_, i) => {
                 // 随机生成一些颜色状态：深紫(达标)、浅紫(一般)、灰色(差)
                 const opacity = Math.random() > 0.7 ? 1 : (Math.random() > 0.4 ? 0.5 : 0.2);
                 return (
                     <View key={i} style={{
                         width: '12%', height: 20, 
                         backgroundColor: `rgba(93, 95, 239, ${opacity})`,
                         marginBottom: 10, borderRadius: 4
                     }} />
                 )
             })}
         </View>
      </View>

      {/* 5. Advice */}
      <Text style={styles.sectionHeaderOutside}>Monthly Advice</Text>
      <View style={[styles.card, {backgroundColor: '#2D1B69'}]}>
          <Text style={{color:'white', fontSize: 14, lineHeight: 20}}>
              Your sleep regularity has improved by 15% compared to last month. Keep maintaining a consistent wake-up time.
          </Text>
      </View>
    </View>
  );
};

// --- 子组件：简单的 SVG 曲线趋势图 ---
const MonthlyTrendChart = ({ data }) => {
    const width = deviceWidth - 80; // 卡片宽度减去内边距
    const height = 100;
    const maxVal = 100;
    
    // 生成 SVG Path 路径数据 (d属性)
    // 简单的线性插值：x坐标均匀分布，y坐标根据分数计算
    const stepX = width / (data.length - 1);
    
    let pathD = `M0 ${height - (data[0] / maxVal) * height}`;
    data.forEach((val, index) => {
        const x = index * stepX;
        const y = height - (val / maxVal) * height;
        pathD += ` L${x} ${y}`;
    });

    // 用于填充渐变的闭合路径
    const fillPathD = `${pathD} L${width} ${height} L0 ${height} Z`;

    return (
        <Svg width={width} height={height}>
            <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#5D5FEF" stopOpacity="0.8" />
                    <Stop offset="1" stopColor="#5D5FEF" stopOpacity="0" />
                </LinearGradient>
            </Defs>
            
            {/* 渐变填充区域 */}
            <Path d={fillPathD} fill="url(#grad)" />
            
            {/* 亮色的折线 */}
            <Path d={pathD} stroke="#fff" strokeWidth="3" fill="none" />
            
            {/* 选中几个关键点画圆圈 (装饰) */}
            <Circle cx={width * 0.5} cy={height - (data[15]/maxVal)*height} r="4" fill="white" />
        </Svg>
    );
}

// ==========================================
// Styles
// ==========================================
const styles = StyleSheet.create({
  // Global Layout
  container: {
    flex: 1,
    backgroundColor: '#120E26', // 深紫色背景
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  tabItem: {
    paddingBottom: 10,
    alignItems: 'center',
    flex: 1,
  },
  activeTabItem: {
    // Active state styles
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activeLine: {
    height: 2,
    width: 40,
    backgroundColor: 'white',
    marginTop: 5,
  },

  // Date Strip
  // Date Strip
  dateStrip: {
    marginTop: 20, // 稍微给点上边距
    marginBottom: 10,
    height: 70,    // 给一个固定高度，防止被截断
  },
  dateItem: {
    ...containers.violetLightC20,
    ...ele.gnrborder,
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    //backgroundColor: 'rgba(22, 9, 55, 0.5)',
    width: 45,
  },
  activeDateItem: {
    backgroundColor: '#5D5FEF', // Highlight color
  },
  dateTextDay: {
    color: '#A0A0A0',
    fontSize: 10,
    marginBottom: 4,
  },
  dateTextNum: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateHeader: {
    color: 'white',
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },

  // Cards & Charts
  card: {
    // 继承半透明紫色背景和圆角
    ...containers.violetLightC20, 
    // 继承边框
    ...ele.gnrborder,
    backgroundColor: 'rgba(48, 31, 68, 0.2)', 
    marginHorizontal: 20,
    borderRadius: 20,
    //overflow: 'hidden',
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#D1D1D6',
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  subText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 10,
  },
  statLabel: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  statValue: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 2,
  },
  rowSpaced: {
    flexDirection: 'row',
  },
  
  // Donut Chart Simulation
  donutContainer: {
    marginRight: 15,
  },
  scoreText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#A0A0A0',
    fontSize: 8,
  },
  moonIcon: {
    width: 70, 
    height: 70,
    resizeMode: 'contain',
    position: 'absolute',
    right: -20,
    top: -50,
  },
  
  // Bar Chart Layout
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 10,
  },
  barContainer: {
    width: 12,
    justifyContent: 'flex-end',
  },
  barSegment: {
    width: '100%',
    borderRadius: 6,
    marginVertical: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  xAxisText: {
    color: '#8E8E93',
    fontSize: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    color: '#D1D1D6',
    fontSize: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
  sectionSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 10,
  },

  // Signs Grid
  sectionHeaderOutside: {
    color: 'white',
    fontSize: 18,
    marginLeft: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  signsCard: {
    ...containers.violetLightC20,
    ...ele.gnrborder,
    marginHorizontal: 20,
    backgroundColor: 'rgba(31, 27, 60, 0.3)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  signRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signItem: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ffffff20',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#ffffff20',
    marginVertical: 15,
  },
  signLabel: {
    color: '#D1D1D6',
    fontSize: 12,
  },
  smallLabel: {
    color: '#8E8E93',
    fontSize: 10,
  },
  signValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 5,
  },

  // Week View Specifics
  
  // 专门给周视图用的胶囊，比日视图宽一些
  weekItem: {
    // 继承 dateItem 的所有基础属性 (圆角、颜色、边框等)
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    height: 65,
    width: 80, 
    borderRadius: 30,
    backgroundColor: 'rgba(30, 26, 56, 0.6)', 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

 
  // 月份选择器的格子
  monthItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: 60,                // 宽度适中
    height: 40,               // 高度较矮，像个小按钮
    borderRadius: 20,         // 圆角
    backgroundColor: 'rgba(30, 26, 56, 0.6)', 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  weekSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 25,
      marginBottom: 20,
      
      alignItems: 'center', 
  },
  bigTime: {
      color: 'white',
      fontSize: 40,
      fontWeight: 'bold',
  },
  unitText: {
      fontSize: 20,
      fontWeight: 'normal',
  },
  subLabel: {
      color: '#A0A0A0',
  },
  moonIconBig: {
    width: 70,       
    height: 70,
    resizeMode: 'contain',
  },
  threeColStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 20,
  },
  statBig: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
  },
  statSmall: {
      color: '#8E8E93',
      fontSize: 10,
      marginTop: 2,
  },
  weekBar: {
      width: 16,
      borderRadius: 8,
  },
  statsRowCard: {
    ...containers.violetLightC20,
    ...ele.gnrborder,
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 27, 60, 0.3)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCol: {
      flex:1,
      alignItems: 'center',
  },
  statUp: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
  },
  statNeutral: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
  },
  statDesc: {
      color: '#A0A0A0',
      fontSize: 9,
      marginTop: 4,
      textAlign: 'center',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'rgba(31, 27, 60, 0.3)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navIcon: {
      fontSize: 24,
      color: '#555',
  }
});

const bg_style = {
    width: deviceWidth,
    height: deviceHeight,
    resizeMode: 'cover', 
    flex:1,
}

// 动态圆环组件
const ScoreCircle = ({ score = 0, size = 80, strokeWidth = 8, color = '#5D5FEF' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // 计算进度偏移量：总周长 - (分数/100 * 总周长)
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* 1. 背景圆环 (Layer 1: Track) */}
      <Svg 
        height={size} 
        width={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ scaleX: -1 }] }}  
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)" // 轨道颜色 (半透明白)
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* 2. 进度圆环 (Layer 2: Progress) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" // 圆头效果
          rotation="-90" // 从顶部开始画
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      {/* 3. 中间的文字 (绝对定位在圆心) */}
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.scoreLabel}>Quality</Text>
      </View>
    </View>
  );
};



export { StatsScreen };