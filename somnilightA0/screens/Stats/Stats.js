import React, { useState, useLayoutEffect } from 'react';
import { 
  View,
  ImageBackground, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
} from 'react-native';
// 引用样式
import { styles, bg_style } from './StatsStyles';
// 引用拆分出去的子组件
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

const StatsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Day'); 

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, 
    });
  }, [navigation]);

  return (
    <View style={{ backgroundColor:'#05011C', flex:1 }}>
      <ImageBackground 
          source={require('../../assets/general_images/bg_stats.png')} 
          style={bg_style} 
      >
        <SafeAreaView style={[styles.container, {backgroundColor: 'transparent'}]}>
          <StatusBar barStyle="light-content" />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sleep</Text>
            
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

          {/* Main Content Area */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'Day' && <DayView />}
            {activeTab === 'Week' && <WeekView />}
            {activeTab === 'Month' && <MonthView />}
          </ScrollView>

          {/* Bottom Nav */}
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

export { StatsScreen };