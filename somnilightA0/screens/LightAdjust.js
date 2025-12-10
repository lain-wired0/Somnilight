import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, PanResponder, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { textStyles, containers, colors, ele } from '../styles';

const COLOR_OPTIONS = ['#FFFFFF', '#FFF8E1', '#F6DBA3', '#F7CD62', '#BEDFDF'];
const SLIDER_WIDTH = 120;
const SLIDER_TRACK_HEIGHT = 320;
const HANDLE_HEIGHT = 30;
const SERVER_URL = 'http://150.158.158.233:1880';
const THROTTLE_INTERVAL = 200; // Increase to 1 second to avoid server-side queue buildup

export default function LightAdjust({ onClose, showHandle = false, onManualChange }) {
  const [brightness, setBrightness] = useState(65);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const brightnessRef = useRef(65);
  const selectedColorRef = useRef('#FFFFFF');
  const startBrightnessRef = useRef(65);
  const lastSendTime = useRef(0);
  const abortControllerRef = useRef(null); // Track current request to allow cancellation

  // 1) 初始加载：先从 AsyncStorage 再向服务器同步
  useEffect(() => {
    const loadState = async () => {
      try {
        // First check for temporary preset values (one-way from preset)
        const tempBrightness = await AsyncStorage.getItem('tempBrightness');
        const tempColorIndex = await AsyncStorage.getItem('tempColorIndex');
        
        if (tempBrightness !== null) {
          const b = parseInt(tempBrightness, 10);
          setBrightness(b);
          brightnessRef.current = b;
          startBrightnessRef.current = b;
          console.log('[LightAdjust] Loaded temp brightness from preset:', b);
        }
        
        if (tempColorIndex !== null) {
          const idx = parseInt(tempColorIndex, 10);
          if (idx >= 0 && idx < COLOR_OPTIONS.length) {
            const color = COLOR_OPTIONS[idx];
            setSelectedColor(color);
            selectedColorRef.current = color;
            setSelectedColorIndex(idx);
            console.log('[LightAdjust] Loaded temp color from preset:', color);
          }
        }
        
        // If no preset values, load from regular storage
        if (tempBrightness === null) {
          const savedBrightness = await AsyncStorage.getItem('last_brightness');
          if (savedBrightness !== null) {
            const b = parseInt(savedBrightness, 10);
            setBrightness(b);
            brightnessRef.current = b;
            startBrightnessRef.current = b;
          }
        }
        
        if (tempColorIndex === null) {
          const savedColor = await AsyncStorage.getItem('last_color');
          if (savedColor !== null) {
            setSelectedColor(savedColor);
            selectedColorRef.current = savedColor;
            const idx = COLOR_OPTIONS.indexOf(savedColor);
            if (idx >= 0) setSelectedColorIndex(idx);
          }
        }

        // 向 Node-RED 请求当前状态（/get_state）
        const res = await fetch(`${SERVER_URL}/get_state`);
        if (res.ok) {
          const data = await res.json();
          // Only update from server if we didn't have preset temp values
          if (data.brightness !== undefined && tempBrightness === null) {
            setBrightness(data.brightness);
            brightnessRef.current = data.brightness;
            startBrightnessRef.current = data.brightness;
            await AsyncStorage.setItem('last_brightness', data.brightness.toString());
          }
          if (data.color && tempColorIndex === null) {
            setSelectedColor(data.color);
            selectedColorRef.current = data.color;
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

  // Cleanup: Clear temp values when modal closes
  useEffect(() => {
    return () => {
      // When component unmounts, clear temp preset values so they don't persist
      AsyncStorage.removeItem('tempBrightness').catch(() => {});
      AsyncStorage.removeItem('tempColorIndex').catch(() => {});
    };
  }, []);

  // 2) 发送亮度/颜色到 Node-RED 的 /set_state（节流）
  const sendStateToServer = useCallback(async (payload) => {
    // payload 例如 { brightness: 60 } 或 { color: "#FFAABB" } 或 二者都有
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTime.current;
    console.log(`[LightAdjust] sendStateToServer called, time since last: ${timeSinceLastSend}ms, payload:`, payload);
    
    // 节流：至少间隔 1000ms (increased from 200ms to prevent server queue buildup)
    if (timeSinceLastSend < THROTTLE_INTERVAL) {
      console.log(`[LightAdjust] THROTTLED (${timeSinceLastSend}ms < ${THROTTLE_INTERVAL}ms)`);
      // 仍然保存到本地但不频繁发送
      if (payload.brightness !== undefined) {
        AsyncStorage.setItem('last_brightness', payload.brightness.toString()).catch(() => {});
      }
      if (payload.color !== undefined) {
        AsyncStorage.setItem('last_color', payload.color).catch(() => {});
      }
      return;
    }
    
    console.log(`[LightAdjust] SENDING to server:`, payload);
    lastSendTime.current = now;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('[LightAdjust] Cancelled previous request');
    }

    // 保存本地
    if (payload.brightness !== undefined) {
      AsyncStorage.setItem('last_brightness', payload.brightness.toString()).catch(() => {});
    }
    if (payload.color !== undefined) {
      AsyncStorage.setItem('last_color', payload.color).catch(() => {});
    }

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${SERVER_URL}/set_state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      abortControllerRef.current = null; // Clear reference after successful completion
      
      if (!response.ok) {
        console.warn(`[LightAdjust] Server returned error status: ${response.status}`);
        return;
      }
      
      console.log(`[LightAdjust] Server response status:`, response.status);
    } catch (err) {
      abortControllerRef.current = null; // Clear reference on error
      if (err.name === 'AbortError') {
        console.log('[LightAdjust] Request cancelled or timeout'); // Changed to log level since this is expected
      } else {
        console.error('[LightAdjust] Failed to POST /set_state', err);
      }
    }
  }, []);

  // 3) 亮度变化处理（滑动时）
  const handleBrightnessChange = useCallback((value) => {
    setBrightness(value);
    brightnessRef.current = value;
    sendStateToServer({ brightness: value, color: selectedColorRef.current }); // 每次带上当前颜色（便于服务器保存同步）
  }, [sendStateToServer]);

  // 4) 颜色选择处理
  const handleColorSelect = useCallback((color, index) => {
    setSelectedColor(color);
    selectedColorRef.current = color;
    setSelectedColorIndex(index);
    AsyncStorage.setItem('last_color', color).catch(() => {});
    // Clear active preset when user makes manual adjustment
    onManualChange?.();
    // 立即发送颜色
    sendStateToServer({ color, brightness: brightnessRef.current });
  }, [sendStateToServer, onManualChange]);

  // 滑块交互
  const sliderRef = useRef(null);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        // Store initial touch position for direct manipulation
        startBrightnessRef.current = brightness;
        // Clear active preset when user makes manual adjustment
        onManualChange?.();
      },

      onPanResponderMove: (evt, gestureState) => {
        if (!sliderRef.current) return;
        
        // Measure slider position on screen
        sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
          const touchY = evt.nativeEvent.pageY;
          const relativeY = touchY - pageY;
          
          // Calculate brightness from touch position (inverted: top = 100%, bottom = 0%)
          const maxDragDistance = SLIDER_TRACK_HEIGHT - HANDLE_HEIGHT;
          let newBrightness = 100 - ((relativeY - HANDLE_HEIGHT / 2) / maxDragDistance) * 100;
          newBrightness = Math.max(0, Math.min(100, Math.round(newBrightness)));
          
          setBrightness(newBrightness);
          brightnessRef.current = newBrightness;
          sendStateToServer({ brightness: newBrightness, color: selectedColorRef.current });
        });
      },

      onPanResponderRelease: () => {
        // Final confirmation - use refs to get latest values
        sendStateToServer({ brightness: brightnessRef.current, color: selectedColorRef.current });
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

      <View 
        ref={sliderRef}
        style={[styles.sliderContainer, { height: SLIDER_TRACK_HEIGHT }]}
      >
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

        {/* Invisible touch target (always full size for dragging) */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: -20,
            right: -20,
            height: SLIDER_TRACK_HEIGHT,
          }}
          pointerEvents="auto"
          {...panResponder.panHandlers}
        />

        {/* Visible handle (only shown when showHandle is true) */}
        {showHandle && (
          <View
            style={[styles.handle, { top: handleTop, backgroundColor: selectedColor }]}
            pointerEvents="none"
          >
            <View style={{ width: 20, height: 4, backgroundColor: '#ddd', borderRadius: 2 }} />
          </View>
        )}
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

      {/* Close button at bottom */}
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButtonBottom}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: '#05011C',
    padding: 20,
  },
  closeButtonBottom: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
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
    borderRadius: 30,
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
