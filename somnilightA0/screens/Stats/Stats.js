import { useState, useLayoutEffect } from 'react';
import {
  View,
  ImageBackground,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// Styles
import { styles, bg_style } from './StatsStyles';

// Sub views
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
    <View style={{ backgroundColor: '#05011C', flex: 1 }}>
      <ImageBackground
        source={require('../../assets/general_images/bg_stats.png')}
        style={bg_style}
      >
        <SafeAreaView
          style={[styles.container, { backgroundColor: 'transparent' }]}
        >
          <StatusBar barStyle="light-content" />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sleep</Text>

            <View style={styles.tabContainer}>
              {['Day', 'Week', 'Month'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabItem, isActive && styles.activeTabItem]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        isActive && styles.activeTabText,
                      ]}
                    >
                      {tab}
                    </Text>
                    {isActive && <View style={styles.activeLine} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Main content area */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'Day' && <DayView />}
            {activeTab === 'Week' && <WeekView />}
            {activeTab === 'Month' && <MonthView />}
          </ScrollView>

          {/* Bottom nav */}
          
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export { StatsScreen };
