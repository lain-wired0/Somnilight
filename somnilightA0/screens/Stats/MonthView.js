import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { styles } from './StatsStyles';
const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

const MonthView = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const mockTrendData = [
    65, 70, 75, 72, 80, 85, 82, 
    78, 70, 60, 65, 75, 88, 90, 
    85, 80, 75, 70, 72, 78, 85, 
    90, 92, 88, 85, 80, 75, 70, 75, 80
  ];

  return (
    <View>
      {/* Month Selector */}
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
                  styles.monthItem, 
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

      {/* Summary */}
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

      {/* Trend Chart */}
      <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Quality Trend</Text>
          <Text style={styles.subText}>Fluctuation over the month</Text>
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <MonthlyTrendChart data={mockTrendData} />
          </View>
      </View>

      {/* Heatmap */}
      <View style={styles.card}>
         <Text style={styles.cardTitle}>Consistency</Text>
         <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15}}>
             {Array.from({ length: 30 }).map((_, i) => {
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

      {/* Advice */}
      <Text style={styles.sectionHeaderOutside}>Monthly Advice</Text>
      <View style={[styles.card, {backgroundColor: '#2D1B69'}]}>
          <Text style={{color:'white', fontSize: 14, lineHeight: 20}}>
              Your sleep regularity has improved by 15% compared to last month...
          </Text>
      </View>
    </View>
  );
};

const MonthlyTrendChart = ({ data }) => {
    const width = deviceWidth - 80; 
    const height = 100;
    const maxVal = 100;
    const stepX = width / (data.length - 1);
    
    let pathD = `M0 ${height - (data[0] / maxVal) * height}`;
    data.forEach((val, index) => {
        const x = index * stepX;
        const y = height - (val / maxVal) * height;
        pathD += ` L${x} ${y}`;
    });

    const fillPathD = `${pathD} L${width} ${height} L0 ${height} Z`;

    return (
        <Svg width={width} height={height}>
            <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#5D5FEF" stopOpacity="0.8" />
                    <Stop offset="1" stopColor="#5D5FEF" stopOpacity="0" />
                </LinearGradient>
            </Defs>
            <Path d={fillPathD} fill="url(#grad)" />
            <Path d={pathD} stroke="#fff" strokeWidth="3" fill="none" />
            <Circle cx={width * 0.5} cy={height - (data[15]/maxVal)*height} r="4" fill="white" />
        </Svg>
    );
}

export default MonthView;