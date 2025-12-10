import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, PanResponder, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ele } from '../../styles';
import { sendLightStateToServer } from '../LightServerSync';

const SLIDER_WIDTH = 50;
const SLIDER_HEIGHT = 80;
const HANDLE_HEIGHT = 25;
const SERVER_URL = 'http://150.158.158.233:1880';

export default function LightIntensitySlider({ onBrightnessChange, refreshTrigger, onManualChange, timerFadeDownAmount = 0, timerMinutes = 0 }) {
  const [brightness, setBrightness] = useState(65);
  const [tempFadeOverride, setTempFadeOverride] = useState(null); // Override fade while dragging
  const [dragFadeValue, setDragFadeValue] = useState(0); // Tracks fade during/after drag (0 = no fade, 100 = full fade)
  const brightnessRef = useRef(65);
  const startBrightnessRef = useRef(65);
  const preDragBrightnessRef = useRef(65); // Store brightness before drag started
  const lastSendTime = useRef(0);
  const sliderRef = useRef(null);
  const onManualChangeRef = useRef(onManualChange);
  const dragTimeoutRef = useRef(null);
  const fadeReturnAnimationRef = useRef(null);
  const fadeReturnStartTimeRef = useRef(null); // Track when fade animation started
  
  // Use temporary override if dragging, otherwise use actual timer fade or drag fade
  // Only use drag fade when timer is exactly at 0 (not PERSIST which is -1)
  const effectiveFadeAmount = tempFadeOverride !== null ? tempFadeOverride : 
                             (timerFadeDownAmount === 0 && timerMinutes === 0 ? dragFadeValue : timerFadeDownAmount);
  
  // Calculate display brightness with timer fade applied
  const displayBrightness = Math.max(0, brightness - (brightness * effectiveFadeAmount / 100));

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
  
  // Send faded brightness to server when timer fade is active
  useEffect(() => {
    if (timerFadeDownAmount > 0) {
      const fadedBrightness = Math.round(displayBrightness);
      sendBrightnessToServer(fadedBrightness);
      console.log('[LightIntensitySlider] Timer fade active, sending brightness:', fadedBrightness);
    }
  }, [displayBrightness, timerFadeDownAmount, sendBrightnessToServer]);

  // Drag fade animation: gradually restore fade to 100% over 2 seconds (after drag ends + 3 second delay)
  useEffect(() => {
    if (timerFadeDownAmount !== 0 || timerMinutes !== 0) {
      // Timer is running or in PERSIST mode, don't use drag fade logic
      setDragFadeValue(0);
      return;
    }

    // If fade animation has been triggered (dragFadeValue is a small number like 0.001 to indicate "start animating")
    if (dragFadeValue > 0 && dragFadeValue < 100) {
      let animationFrameId = null;
      
      // Initialize animation start time if not set
      if (!fadeReturnStartTimeRef.current) {
        fadeReturnStartTimeRef.current = Date.now();
      }

      const animate = () => {
        const elapsedMs = Date.now() - fadeReturnStartTimeRef.current;
        const FADE_RETURN_DURATION = 2000; // 2 seconds to return to 100%
        const progress = Math.min(1, elapsedMs / FADE_RETURN_DURATION);
        const newFadeValue = progress * 100;
        
        setDragFadeValue(newFadeValue);
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete - reset brightness to pre-drag value
          setDragFadeValue(100);
          fadeReturnStartTimeRef.current = null;
          
          // Reset brightness to what it was before the drag started
          console.log('[LightIntensitySlider] Fade animation complete, resetting brightness from', brightnessRef.current, 'to', preDragBrightnessRef.current);
          setBrightness(preDragBrightnessRef.current);
          brightnessRef.current = preDragBrightnessRef.current;
          sendBrightnessToServer(preDragBrightnessRef.current);
        }
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [dragFadeValue, timerFadeDownAmount, timerMinutes, sendBrightnessToServer]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        startBrightnessRef.current = brightness;
        // Store the brightness value before drag starts so we can restore it later
        preDragBrightnessRef.current = brightness;
        // Clear active preset when user makes manual adjustment
        console.log('[LightIntensitySlider] Calling onManualChange');
        onManualChangeRef.current?.();
        
        // If timer is at 0 (not PERSIST) and user drags, temporarily set fade to 0
        if (timerFadeDownAmount === 0 && timerMinutes === 0) {
          console.log('[LightIntensitySlider] Drag started with timer at 0, setting fade to 0%');
          setDragFadeValue(0);
          
          // Clear any pending timeout
          if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
          }
          
          // Clear any pending animation
          if (fadeReturnAnimationRef.current) {
            cancelAnimationFrame(fadeReturnAnimationRef.current);
            fadeReturnAnimationRef.current = null;
          }
          
          // Reset animation start time
          fadeReturnStartTimeRef.current = null;
        }
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
        
        // If timer is at 0 (not PERSIST) and user was dragging, start 3-second countdown to fade back to 100%
        if (timerFadeDownAmount === 0 && timerMinutes === 0 && dragFadeValue === 0) {
          console.log('[LightIntensitySlider] Drag ended, starting 3-second timer before fade animation');
          
          // Clear any previous timeout
          if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
          }
          
          // Wait 3 seconds, then start fade animation
          dragTimeoutRef.current = setTimeout(() => {
            console.log('[LightIntensitySlider] 3-second delay complete, starting fade animation');
            setDragFadeValue(0.001); // Trigger animation by setting to small value > 0
          }, 3000);
        }
      },
    })
  ).current;

  // Cleanup timeouts and animations on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      if (fadeReturnAnimationRef.current) {
        cancelAnimationFrame(fadeReturnAnimationRef.current);
      }
    };
  }, []);

  const fillHeight = `${displayBrightness}%`;

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
