import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';

const WIDTH = 240;
const HEIGHT = 120;
const STROKE_WIDTH = 14;
const RADIUS = 100;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT;
const KNOB_RADIUS = 10;

// ⭐ 新增：接收 colors 参数 (默认为原本的金色渐变，防止报错)
export default function InteractiveArcSlider({ 
  percentage = 50, 
  onValueChange, 
  onGestureStart, 
  onGestureEnd,
  colors = ['#F7CD62', '#FFEAB4'] // 默认值：[深金, 浅金]
}) {
  
  const percentageToAngle = (p) => Math.PI * (1 - p / 100);
  
  const polarToCartesian = (angle) => {
    const x = CENTER_X + RADIUS * Math.cos(angle);
    const y = CENTER_Y - RADIUS * Math.sin(angle);
    return { x, y };
  };

  const createArcPath = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", RADIUS, RADIUS, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");
  };

  const currentAngle = percentageToAngle(percentage);
  const knobPosition = polarToCartesian(currentAngle);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        if (onGestureStart) onGestureStart();
        handleTouch(evt);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt);
      },
      onPanResponderRelease: () => {
        if (onGestureEnd) onGestureEnd();
      },
      onPanResponderTerminate: () => {
        if (onGestureEnd) onGestureEnd();
      }
    })
  ).current;

  const handleTouch = (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    
    // 增加一点触摸容错，确保只在组件范围内计算
    // (这里保持原样，也可以根据需要优化)
    
    const dx = locationX - CENTER_X;
    const dy = CENTER_Y - locationY; 

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle = 0;
    if (angle > Math.PI) angle = Math.PI;

    const newPercentage = Math.round((1 - angle / Math.PI) * 100);
    if (newPercentage !== percentage && onValueChange) {
       onValueChange(newPercentage);
    }
  };

  return (
    <View 
      style={styles.container} 
      {...panResponder.panHandlers}
      pointerEvents="box-only"
    >
      <Svg width={WIDTH} height={HEIGHT + KNOB_RADIUS + 5} style={{ overflow: 'visible' }}>
        <Defs>
          {/* ⭐⭐ 修改：使用传入的 colors 数组 ⭐⭐ */}
          <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors[0]} /> 
            <Stop offset="100%" stopColor={colors[1]} /> 
          </LinearGradient>
        </Defs>

        <Path
          d={createArcPath(Math.PI, 0)}
          stroke="rgba(0,0,0,0.2)" 
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
        />

        <Path
          d={createArcPath(Math.PI, currentAngle)}
          stroke="url(#arcGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
        />

        <G x={knobPosition.x} y={knobPosition.y}>
          <Circle r={KNOB_RADIUS} fill="#FFF" style={styles.knobShadow} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0, 
    marginBottom: 10,
    backgroundColor: 'transparent',
    height: HEIGHT, 
    width: WIDTH,
  },
  knobShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  }
});