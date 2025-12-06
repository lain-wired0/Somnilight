import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { styles } from './StatsStyles';

const WeekView = () => {
  const [selectedWeekStart, setSelectedWeekStart] = useState(getStartOfWeek(new Date()));

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
  }

  const weeks = React.useMemo(() => {
    const weekList = [];
    const currentStart = getStartOfWeek(new Date());

    for (let i = -4; i <= 4; i++) {
      const start = new Date(currentStart);
      start.setDate(start.getDate() + (i * 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 6); 
      weekList.push({ start, end });
    }
    return weekList;
  }, []);

  const isSameWeek = (d1, d2) => {
    return d1.getTime() === d2.getTime();
  };

  const formatWeekLabel = (start, end) => {
    if (start.getMonth() !== end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()}`;
    }
    return `${start.getDate()} - ${end.getDate()}`;
  };

  const formatMonthLabel = (date) => {
     return date.toLocaleDateString('en-US', { month: 'short' }); 
  };

  return (
    <View>
      {/* Week Selector */}
      <View style={styles.dateStrip}>
        <FlatList
          horizontal
          data={weeks}
          keyExtractor={(item) => item.start.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          initialScrollIndex={4} 
          getItemLayout={(data, index) => ({ length: 85, offset: 85 * index, index })}
          renderItem={({ item }) => {
            const isActive = isSameWeek(item.start, selectedWeekStart);
            return (
              <TouchableOpacity
                onPress={() => setSelectedWeekStart(item.start)}
                style={[
                  styles.weekItem, 
                  isActive && styles.activeDateItem, 
                  { marginRight: 15 }
                ]}
              >
                <Text style={[styles.dateTextDay, isActive && { color: 'white' }]}>
                    {formatMonthLabel(item.start)}
                </Text>
                <Text style={[styles.dateTextNum, { fontSize: 16 }]}>
                    {formatWeekLabel(item.start, item.end)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Summary */}
      <View style={styles.weekSummary}>
        <View>
            <Text style={styles.bigTime}>7<Text style={styles.unitText}>h</Text> 51<Text style={styles.unitText}>m</Text></Text>
            <Text style={styles.subLabel}>Average sleep time</Text>
        </View>
        <Image 
            source={require('../../assets/general_images/moon.png')} 
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

      {/* Chart */}
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

      {/* Comparison */}
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

export default WeekView;