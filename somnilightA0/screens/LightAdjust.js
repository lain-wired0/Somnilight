// screens/light-adjust.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {View,Text,Image,PanResponder,StyleSheet,Dimensions,TouchableOpacity} from 'react-native';
import { textStyles, containers, colors, ele } from '../styles';

// 颜色选项
const COLOR_OPTIONS = [
  '#FFFFFF', '#FFF8E1', '#F6DBA3', '#F7CD62', '#BEDFDF'
];

// 滑块常量
const SLIDER_WIDTH = 80;
const SLIDER_TRACK_HEIGHT = 240; // 轨道高度
const HANDLE_HEIGHT = 10; // 手柄高度

export default function LightAdjust() {
  const [brightness, setBrightness] = useState(65); // 初始亮度 65%
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // 用于加载初始值
  useEffect(() => {
    const loadInitialBrightness = async () => {
      try {
        const res = await fetch('http://150.158.158.233:1880/get_state');
        const data = await res.json();
        if (data.brightness !== undefined) {
          setBrightness(data.brightness);
        }
      } catch (err) {
        console.error('Failed to load initial brightness:', err);
      }
    };
    loadInitialBrightness();
  }, []);

  // 滑块响应器
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const maxY = SLIDER_TRACK_HEIGHT - HANDLE_HEIGHT;
        let newTop = -gestureState.dy;
        newTop = Math.max(0, Math.min(maxY, newTop));

        const percent = Math.round(((maxY - newTop) / maxY) * 100);
        setBrightness(percent);
        sendToNodeRed(percent);
      },
    })
  ).current;

  // 发送数据到 Node-RED
  const sendToNodeRed = useCallback(async (value) => {
    try {
      const res = await fetch('http://150.158.158.233:1880/set_state', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brightness: value }),
      });
      const data = await res.json();
      console.log("Brightness updated:", data);
    } catch (err) {
      console.error("Failed to update brightness:", err);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/general_images/background_adj.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <View style={styles.header}>
        <Image
          source={require('../assets/icons/light_adj.png')}
          style={ele.icon50}
          resizeMode="contain"
        />
        <Text style={[textStyles.semibold15, styles.percentageText]}>
          Lighting currently {brightness}%
        </Text>
      </View>

      {/* 滑块区域 */}
      <View
        style={[
          styles.sliderContainer,
          { height: SLIDER_TRACK_HEIGHT },
        ]}
      >
        {/* 填充部分 */}
        <View
          style={{
            width: '100%',
            height: `${brightness}%`,
            backgroundColor: 'rgba(255,255,255,0.6)',
          }}
        />
        {/* 手柄 */}
        <View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              height: HANDLE_HEIGHT,
              backgroundColor: 'white',
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              top: ((100 - brightness) / 100) * (SLIDER_TRACK_HEIGHT - HANDLE_HEIGHT),
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>

      {/* 颜色选择器 */}
      <View style={styles.colorOptions}>
        {COLOR_OPTIONS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColorIndex === index && styles.selectedColorOption
            ]}
            onPress={() => setSelectedColorIndex(index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05011C',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    marginTop: 10,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: 'white',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(96, 68, 175, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});