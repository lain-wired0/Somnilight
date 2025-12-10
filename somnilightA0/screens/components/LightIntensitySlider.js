import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, PanResponder, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ele } from '../../styles';
import { sendLightStateToServer } from '../LightServerSync';

const SLIDER_WIDTH = 50;
const SLIDER_HEIGHT = 80;
const HANDLE_HEIGHT = 25;
const SERVER_URL = 'http://150.158.158.233:1880';

export default function LightIntensitySlider({ onBrightnessChange, refreshTrigger, onManualChange }) {
  const [brightness, setBrightness] = useState(65);
  const brightnessRef = useRef(65);
  const startBrightnessRef = useRef(65);
  const lastSendTime = useRef(0);
  const sliderRef = useRef(null);
  const onManualChangeRef = useRef(onManualChange);

  // Load brightness from AsyncStorage (or preset temp values)
  const loadBrightness = useCallback(async () => {
    try {
      // First check if there's a temporary preset brightness (one-way from preset)
      const tempBrightness = await AsyncStorage.getItem('tempBrightness');
      if (tempBrightness !== null) {
        const b = parseInt(tempBrightness, 10);
        setBrightness(b);
        brightnessRef.current = b;
        startBrightnessRef.current = b;
        console.log('[LightIntensitySlider] Loaded temp brightness from preset:', b);
        return;
      }

      // Otherwise load from regular storage
      const savedBrightness = await AsyncStorage.getItem('last_brightness');
      if (savedBrightness !== null) {
        const b = parseInt(savedBrightness, 10);
        setBrightness(b);
        brightnessRef.current = b;
        startBrightnessRef.current = b;
      }
    } catch (err) {
      console.error('Load brightness error:', err);
    }
  }, []);

  // Load initial brightness on mount
  useEffect(() => {
    loadBrightness();
  }, [loadBrightness]);

  // Keep ref in sync with onManualChange prop
  useEffect(() => {
    onManualChangeRef.current = onManualChange;
  }, [onManualChange]);

  // Reload brightness when refreshTrigger changes (modal closes)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadBrightness();
    }
  }, [refreshTrigger, loadBrightness]);

  const sendBrightnessToServer = useCallback(async (value) => {
    await sendLightStateToServer({ brightness: value });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        startBrightnessRef.current = brightness;
        // Clear active preset when user makes manual adjustment
        console.log('[LightIntensitySlider] Calling onManualChange');
        onManualChangeRef.current?.();
      },

      onPanResponderMove: (evt, gestureState) => {
        if (!sliderRef.current) return;

        sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
          const touchY = evt.nativeEvent.pageY;
          const relativeY = touchY - pageY;

          // Use actual measured height instead of constant
          const maxDragDistance = height - HANDLE_HEIGHT;
          let newBrightness = 100 - ((relativeY - HANDLE_HEIGHT / 2) / maxDragDistance) * 100;
          newBrightness = Math.max(0, Math.min(100, Math.round(newBrightness)));

          setBrightness(newBrightness);
          brightnessRef.current = newBrightness;
          sendBrightnessToServer(newBrightness);
          onBrightnessChange?.(newBrightness);
        });
      },

      onPanResponderRelease: () => {
        sendBrightnessToServer(brightnessRef.current);
      },
    })
  ).current;

  const fillHeight = `${brightness}%`;

  return (
    <View style={styles.container}>
      <View
        ref={sliderRef}
        style={styles.sliderTrack}
        onLayout={(e) => {
          // Handle layout changes if needed
        }}
      >
        {/* Fill background */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: fillHeight,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
          }}
        />

        {/* Invisible touch target */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: -10,
            right: -10,
            height: '100%',
          }}
          pointerEvents="box-only"
          {...panResponder.panHandlers}
        />
      </View>

      {/* Icon overlay */}
      <Image
        source={require('../../assets/icons/light_adj.png')}
        style={[ele.icon40, styles.iconOverlay]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sliderTrack: {
    width: '100%',
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  iconOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    height:36,
    width: 36,
    bottom:12
  },
});
