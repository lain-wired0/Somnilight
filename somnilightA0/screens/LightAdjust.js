import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, PanResponder, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { textStyles, containers, colors, ele } from '../styles';

const COLOR_OPTIONS = ['#FFFFFF', '#FFF8E1', '#F6DBA3', '#F7CD62', '#BEDFDF'];
const SLIDER_WIDTH = 80;
const SLIDER_TRACK_HEIGHT = 240;
const HANDLE_HEIGHT = 30;
const SERVER_URL = 'http://150.158.158.233:1880';

export default function LightAdjust() {
  const [brightness, setBrightness] = useState(65);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const startBrightnessRef = useRef(65);
  const lastSendTime = useRef(0);

  // 1) 初始加载：先从 AsyncStorage 再向服务器同步
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedBrightness = await AsyncStorage.getItem('last_brightness');
        const savedColor = await AsyncStorage.getItem('last_color');

        if (savedBrightness !== null) {
          const b = parseInt(savedBrightness, 10);
          setBrightness(b);
          startBrightnessRef.current = b;
        }
        if (savedColor !== null) {
          setSelectedColor(savedColor);
          const idx = COLOR_OPTIONS.indexOf(savedColor);
          if (idx >= 0) setSelectedColorIndex(idx);
        }

        // 向 Node-RED 请求当前状态（/get_state）
        const res = await fetch(`${SERVER_URL}/get_state`);
        if (res.ok) {
          const data = await res.json();
          if (data.brightness !== undefined) {
            setBrightness(data.brightness);
            startBrightnessRef.current = data.brightness;
            await AsyncStorage.setItem('last_brightness', data.brightness.toString());
          }
          if (data.color) {
            setSelectedColor(data.color);
            const idx2 = COLOR_OPTIONS.indexOf(data.color);
            if (idx2 >= 0) setSelectedColorIndex(idx2);
            await AsyncStorage.setItem('last_color', data.color);
          }
        } else {
          console.warn('GET /get_state 返回非 200:', res.status);
        }
      } catch (err) {
        console.error('Load state error:', err);
      }
    };
    loadState();
  }, []);

  // 2) 发送亮度/颜色到 Node-RED 的 /set_state（节流）
  const sendStateToServer = useCallback(async (payload) => {
    // payload 例如 { brightness: 60 } 或 { color: "#FFAABB" } 或 二者都有
    const now = Date.now();
    // 节流：至少间隔 200ms
    if (now - lastSendTime.current < 200) {
      // 仍然保存到本地但不频繁发送
      if (payload.brightness !== undefined) {
        AsyncStorage.setItem('last_brightness', payload.brightness.toString()).catch(() => {});
      }
      if (payload.color !== undefined) {
        AsyncStorage.setItem('last_color', payload.color).catch(() => {});
      }
      return;
    }
    lastSendTime.current = now;

    // 保存本地
    if (payload.brightness !== undefined) {
      AsyncStorage.setItem('last_brightness', payload.brightness.toString()).catch(() => {});
    }
    if (payload.color !== undefined) {
      AsyncStorage.setItem('last_color', payload.color).catch(() => {});
    }

    try {
      await fetch(`${SERVER_URL}/set_state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Failed to POST /set_state', err);
    }
  }, []);

  // 3) 亮度变化处理（滑动时）
  const handleBrightnessChange = useCallback((value) => {
    setBrightness(value);
    sendStateToServer({ brightness: value, color: selectedColor }); // 每次带上当前颜色（便于服务器保存同步）
  }, [selectedColor, sendStateToServer]);

  // 4) 颜色选择处理
  const handleColorSelect = useCallback((color, index) => {
    setSelectedColor(color);
    setSelectedColorIndex(index);
    AsyncStorage.setItem('last_color', color).catch(() => {});
    // 立即发送颜色
    sendStateToServer({ color, brightness });
  }, [brightness, sendStateToServer]);

  // 滑块交互
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        startBrightnessRef.current = brightness;
      },

      onPanResponderMove: (_, gestureState) => {
        const maxDragDistance = SLIDER_TRACK_HEIGHT - HANDLE_HEIGHT;
        const deltaPercent = (gestureState.dy / maxDragDistance) * 100;
        let newBrightness = startBrightnessRef.current - deltaPercent;
        newBrightness = Math.max(0, Math.min(100, Math.round(newBrightness)));
        setBrightness(newBrightness);
        // 不要频繁写 AsyncStorage：交给 sendStateToServer 节流处理
        sendStateToServer({ brightness: newBrightness, color: selectedColor });
      },

      onPanResponderRelease: () => {
        // 最终确认一次
        sendStateToServer({ brightness, color: selectedColor });
      }
    })
  ).current;

  // UI 计算
  const fillHeight = `${brightness}%`;
  const handleTop = ((100 - brightness) / 100) * (SLIDER_TRACK_HEIGHT - HANDLE_HEIGHT);

  // 将 hex 颜色转成带透明度的 fill
  const colorFill = (hex, alpha = 0.5) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0,2), 16);
    const g = parseInt(c.substring(2,4), 16);
    const b = parseInt(c.substring(4,6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

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

      <View style={[styles.sliderContainer, { height: SLIDER_TRACK_HEIGHT }]}>
        {/* fill 区域：颜色响应选择 */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: fillHeight,
            backgroundColor: colorFill(selectedColor, 0.55),
          }}
        />

        <View
          style={[styles.handle, { top: handleTop, backgroundColor: selectedColor }]}
          {...panResponder.panHandlers}
        >
          <View style={{ width: 20, height: 4, backgroundColor: '#ddd', borderRadius: 2 }} />
        </View>
      </View>

      <View style={styles.colorOptions}>
        {COLOR_OPTIONS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColorIndex === index && styles.selectedColorOption
            ]}
            onPress={() => handleColorSelect(color, index)}
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
    marginBottom: 40,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    marginTop: 15,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  handle: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HANDLE_HEIGHT,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: 'white',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
