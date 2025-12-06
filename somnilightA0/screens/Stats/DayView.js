import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';

import { styles as globalStyles } from './StatsStyles.js'; 

import ScoreCircle from '../../components/ScoreCircle'; 

const API_URL = 'http://150.158.158.233:1880'; 
const { width } = Dimensions.get('window');

const DayView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sleepScore, setSleepScore] = useState(0);

  // --- 1. 模拟睡眠结构数据 ---
  const hypnogramData = [
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
  ];

  // --- 2. 日期生成逻辑 ---
  const dates = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = -14; i <= 14; i++) {
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

  const isSameDay = (d1, d2) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- 3. 获取分数逻辑 ---
  useEffect(() => {
    const fetchSleepScore = async () => {
      try {
        const dateStr = formatToISODate(selectedDate);
        const response = await fetch(`${API_URL}/pillow/sleep/score?date=${dateStr}`);
        const data = await response.json();

        if (data.ok) {
          setSleepScore(data.quality_score);
        } else {
          setSleepScore(0);
        }
      } catch (error) {
        // 网络错误时不崩坏，只打印日志
        // console.log("Fetch failed:", error); 
        setSleepScore(0);
      }
    };
    fetchSleepScore();
  }, [selectedDate]);

  // --- 4. 渲染睡眠结构图 ---
  const renderHypnogram = () => {
    const chartHeight = 180;
    const chartWidth = width - 70; 
    
    const STAGE_Y = {
      'Awake': 10,   
      'REM': 70,     
      'Light': 120,  
      'Deep': 170    
    };

    const totalDuration = hypnogramData.reduce((acc, cur) => acc + cur.duration, 0);
    const totalHours = Math.floor(totalDuration / 60);
    const totalMinutes = totalDuration % 60;
    
    const unitWidth = totalDuration > 0 ? chartWidth / totalDuration : 0;

    let pathD = `M0 ${chartHeight}`;
    let currentX = 0;
    
    hypnogramData.forEach((item, index) => {
      const y = STAGE_Y[item.stage];
      const segmentWidth = item.duration * unitWidth;
      
      if (index === 0) {
          pathD += ` L0 ${y}`;
      } else {
          pathD += ` L${currentX} ${y}`; 
      }
      pathD += ` L${currentX + segmentWidth} ${y}`;
      currentX += segmentWidth;
    });

    const fillPathD = `${pathD} L${chartWidth} ${chartHeight} L0 ${chartHeight} Z`;

    return (
      <View style={{ width: '100%', alignItems: 'center' }}>
        
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>{totalHours}</Text>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}> hr </Text>
                <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>{totalMinutes}</Text>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}> min</Text>
            </View>
        </View>

        <View style={{ height: chartHeight + 20 }}>
            <Svg height={chartHeight + 20} width={chartWidth}>
            <Defs>
                <LinearGradient id="hypnoGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FCCB4D" />   
                <Stop offset="40%" stopColor="#FF8787" />  
                <Stop offset="70%" stopColor="#A56DFB" />  
                <Stop offset="100%" stopColor="#6E44FF" /> 
                </LinearGradient>
            </Defs>

            <Path 
                d={fillPathD} 
                fill="url(#hypnoGrad)" 
                fillOpacity="0.8"
            />

            <Path 
                d={pathD} 
                stroke="white" 
                strokeWidth="3"
                strokeLinejoin="round" 
                fill="none"
            />
            </Svg>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: chartWidth, marginTop: 5 }}>
            <View>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>12/6</Text>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600', marginTop: 2 }}>Bed time 01:40</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#A0A0A0', fontSize: 12 }}>12/6</Text>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600', marginTop: 2 }}>Woke up 09:35</Text>
            </View>
        </View>

        <View style={localStyles.legendRow}>
            <LegendItem color="#6E44FF" label="Deep sleep" />
            <LegendItem color="#A56DFB" label="Light sleep" />
            <LegendItem color="#FF8787" label="REM sleep" />
            <LegendItem color="#FCCB4D" label="Awake" />
        </View>

      </View>
    );
  };

  // --- 主渲染 ---
  return (
    <View>
      <View style={globalStyles.dateStrip}>
        <FlatList
          horizontal
          data={dates}
          keyExtractor={(item) => item.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          initialScrollIndex={14} 
          getItemLayout={(data, index) => ({ length: 55, offset: 55 * index, index })}
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
                  { marginRight: 12 }
                ]}
              >
                <Text style={[globalStyles.dateTextDay, isActive && { color: 'white' }]}>{dayLabel}</Text>
                <Text style={globalStyles.dateTextNum}>{dateNum}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <Text style={globalStyles.dateHeader}>{formatDateHeader(selectedDate)}</Text>

      {/* Main Sleep Score Card */}
      <View style={globalStyles.card}>
        <View style={globalStyles.cardHeaderRow}>
          <View style={globalStyles.donutContainer}>
            {/* 这里的 score 属性必须存在，否则 ScoreCircle 可能会报错 */}
            <ScoreCircle score={sleepScore || 0} size={80} strokeWidth={8} color="#5D5FEF" />
          </View>
          
          <View style={globalStyles.mainStatsText}>
            <Text style={globalStyles.cardTitle}>Sleep Score</Text>
            <Text style={globalStyles.subText}>Based on your cycles</Text>
            <View style={globalStyles.rowSpaced}>
                <View>
                    <Text style={globalStyles.statLabel}>Efficiency</Text>
                    <Text style={globalStyles.statValue}>92%</Text>
                </View>
            </View>
          </View>
          {/* 确保这些图片存在于你的 assets 目录中 */}
          <Image 
            source={require('../../assets/general_images/moon.png')} 
            style={globalStyles.moonIcon} 
          />
        </View>
      </View>

      {/* --- Sleep Chart --- */}
      <View style={[globalStyles.card, { paddingVertical: 25 }]}>
        {renderHypnogram()}
      </View>

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
                <Text style={[globalStyles.signLabel, {opacity:0}]}>.</Text> 
                <Text style={globalStyles.smallLabel}>HRV</Text>
                <Text style={globalStyles.signValue}>36 – 113</Text>
            </View>
            <View style={{flex:1, height: 40, justifyContent:'center', alignItems:'center'}}>
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

const LegendItem = ({color, label}) => (
    <View style={{flexDirection:'row', alignItems:'center'}}>
        <View style={{width:8, height:8, borderRadius:4, backgroundColor:color, marginRight:6}} />
        <Text style={{color:'#D1D1D6', fontSize:12, fontWeight:'500'}}>{label}</Text>
    </View>
);

const localStyles = StyleSheet.create({
    legendRow: {
        flexDirection: 'row', 
        justifyContent:'space-between', 
        width: '110%', 
        marginTop: 25, 
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 15,
    }
});

// 3. 确保这里有 export default
export default DayView;