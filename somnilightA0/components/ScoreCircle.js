import { useEffect, useRef } from 'react';
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
  const animatedValue = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const clamped = Math.max(0, Math.min(100, score));

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
