import React, { useRef, useState, useEffect } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';

export default function VolumeSlider({ 
  value = 0.5, 
  onValueChange, 
  onGestureStart, 
  onGestureEnd, 
  totalWidth = 140 
}) {
  const [localValue, setLocalValue] = useState(value);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleTouch = (evt) => {
    const { locationX } = evt.nativeEvent;
    
    // 计算比例
    let newValue = locationX / totalWidth;
    newValue = Math.max(0, Math.min(1, newValue));
    
    setLocalValue(newValue);
    
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        if (onGestureStart) onGestureStart();
        handleTouch(evt);
      },

      onPanResponderMove: (evt) => {
        handleTouch(evt);
      },

      onPanResponderRelease: () => {
        isDragging.current = false;
        if (onGestureEnd) onGestureEnd();
      },
      
      onPanResponderTerminate: () => {
        isDragging.current = false;
        if (onGestureEnd) onGestureEnd();
      }
    })
  ).current;

  return (
    <View 
      style={[styles.container, { width: totalWidth }]} 
      {...panResponder.panHandlers}
    >
      {/* ⭐ 核心修复：用 pointerEvents="none" 包裹所有视觉元素 
         这样手指永远摸不到里面的圆点，只能摸到最外层的 container。
         从而保证 locationX 永远是相对于 140 宽度的，彻底消灭闪烁。
      */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        
        {/* 轨道背景 */}
        <View style={styles.trackBackground} />
        
        {/* 激活的紫色进度条 */}
        <View style={[styles.fillTrack, { width: `${localValue * 100}%` }]} />
        
        {/* 滑块圆点 (纯视觉装饰) */}
        <View style={[styles.knobContainer, { left: `${localValue * 100}%` }]}>
           <View style={styles.knob} />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36, // 整体高度，保证手指容易按中
    justifyContent: 'center',
  },
  // 轨道背景：深灰色
  trackBackground: {
    position: 'absolute',
    top: 14, // (36 - 8) / 2 -> 垂直居中
    height: 8, 
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
  },
  // 填充条：紫色
  fillTrack: {
    position: 'absolute',
    top: 14,
    height: 8,
    backgroundColor: '#8068E9',
    borderRadius: 4,
  },
  // 滑块容器
  knobContainer: {
    position: 'absolute',
    top: 0,
    height: 36, // 和容器一样高
    width: 36,
    marginLeft: -18, // 居中: -width/2
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 实际的白色小圆球
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    // 阴影让它更有立体感
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)'
  }
});