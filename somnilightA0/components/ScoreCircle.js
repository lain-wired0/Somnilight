import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { styles } from '../screens/Stats/StatsStyles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ScoreCircle = ({ score = 0, size = 80, strokeWidth = 8, color = '#5D5FEF' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 500, // 动画时长
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [score]);

  const animatedStrokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference - (score / 100) * circumference],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg 
        height={size} 
        width={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ scaleX: -1 }] }}  
      >
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={strokeWidth} fill="transparent" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.scoreLabel}>Quality</Text>
      </View>
    </View>
  );
};

export default ScoreCircle;