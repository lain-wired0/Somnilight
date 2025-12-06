// ScoreCircle.js
// 功能：只绘制带动画的圆形进度条（不包含任何文字）
// 需求：每次分数变化从 0% 起动画，且视觉方向为逆时针

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ScoreCircle = ({
  score = 0,
  size = 80,
  strokeWidth = 8,
  color = '#5D5FEF',
  backgroundColor = 'rgba(255,255,255,0.15)',
  duration = 800,
}) => {
  // 当前动画进度（0-100）
  const animatedValue = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const clamped = Math.max(0, Math.min(100, score));

    // 每次从 0 重新开始
    animatedValue.setValue(0);

    const anim = Animated.timing(animatedValue, {
      toValue: clamped,
      duration,
      useNativeDriver: false,
    });

    anim.start();

    return () => {
      anim.stop();
    };
  }, [score, duration, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  return (
    // 在这里做水平镜像，圆环视觉方向就变成逆时针
    <Animated.View style={{ transform: [{ scaleX: -1 }] }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
    </Animated.View>
  );
};

export default ScoreCircle;
