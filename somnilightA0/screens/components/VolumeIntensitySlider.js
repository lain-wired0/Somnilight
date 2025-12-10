import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, PanResponder, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ele } from '../../styles';
import { sendVolumeToServer as sendVolumeToServerShared } from '../VolumeServerSync';

const SLIDER_WIDTH = 50;
const SLIDER_HEIGHT = 80;
const HANDLE_HEIGHT = 25;
const SERVER_URL = 'http://150.158.158.233:1880';

export default function VolumeIntensitySlider({ onVolumeChange, refreshTrigger, onManualChange, timerFadeDownAmount = 0, timerMinutes = 0, updateTimerSoundVolume }) {
  const [volume, setVolume] = useState(60);
  const [dragFadeValue, setDragFadeValue] = useState(0); // Tracks fade during/after drag
  const volumeRef = useRef(60);
  const startVolumeRef = useRef(60);
  const preDragVolumeRef = useRef(60); // Store volume before drag started
  const lastSendTime = useRef(0);
  const sliderRef = useRef(null);
  const onManualChangeRef = useRef(onManualChange);
  const dragTimeoutRef = useRef(null);
  const fadeReturnAnimationRef = useRef(null);
  const fadeReturnStartTimeRef = useRef(null); // Track when fade animation started
  
  // Calculate effective fade (use drag fade when timer is at 0, not PERSIST)
  const effectiveFadeAmount = timerFadeDownAmount === 0 && timerMinutes === 0 ? dragFadeValue : timerFadeDownAmount;
  
  // Calculate display volume with timer fade applied
  const displayVolume = Math.max(0, volume - (volume * effectiveFadeAmount / 100));

  // Load volume from AsyncStorage (or preset temp values)
  const loadVolume = useCallback(async () => {
    try {
      // First check if there's a temporary preset volume (one-way from preset)
      const tempVolume = await AsyncStorage.getItem('tempVolume');
      if (tempVolume !== null) {
        const v = parseInt(tempVolume, 10);
        setVolume(v);
        volumeRef.current = v;
        startVolumeRef.current = v;
        console.log('[VolumeIntensitySlider] Loaded temp volume from preset:', v);
        return;
      }

      // Otherwise load from regular storage
      const savedVolume = await AsyncStorage.getItem('last_volume');
      if (savedVolume !== null) {
        const v = parseInt(savedVolume, 10);
        setVolume(v);
        volumeRef.current = v;
        startVolumeRef.current = v;
      }
    } catch (err) {
      console.error('Load volume error:', err);
    }
  }, []);

  // Load initial volume on mount
  useEffect(() => {
    loadVolume();
  }, [loadVolume]);

  // Keep ref in sync with onManualChange prop
  useEffect(() => {
    onManualChangeRef.current = onManualChange;
  }, [onManualChange]);

  // Reload volume when refreshTrigger changes (modal closes)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadVolume();
    }
  }, [refreshTrigger, loadVolume]);
  
  const sendVolumeToServer = useCallback(async (value) => {
    await sendVolumeToServerShared({ volume: value });
  }, []);
  
  // Send faded volume to server when timer fade is active
  useEffect(() => {
    if (timerFadeDownAmount > 0) {
      const fadedVolume = Math.round(displayVolume);
      sendVolumeToServer(fadedVolume);
      console.log('[VolumeIntensitySlider] Timer fade active, sending volume:', fadedVolume);
    }
  }, [displayVolume, timerFadeDownAmount, sendVolumeToServer]);

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
          // Animation complete - reset volume to pre-drag value
          setDragFadeValue(100);
          fadeReturnStartTimeRef.current = null;
          
          // Reset volume to what it was before the drag started
          console.log('[VolumeIntensitySlider] Fade animation complete, resetting volume from', volumeRef.current, 'to', preDragVolumeRef.current);
          setVolume(preDragVolumeRef.current);
          volumeRef.current = preDragVolumeRef.current;
          sendVolumeToServer(preDragVolumeRef.current);
        }
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [dragFadeValue, timerFadeDownAmount, timerMinutes, sendVolumeToServer]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        startVolumeRef.current = volume;
        // Store the volume value before drag starts so we can restore it later
        preDragVolumeRef.current = volume;
        // Clear active preset when user makes manual adjustment
        console.log('[VolumeIntensitySlider] Calling onManualChange');
        onManualChangeRef.current?.();
        
        // If timer is at 0 (not PERSIST) and user drags, temporarily set fade to 0
        if (timerFadeDownAmount === 0 && timerMinutes === 0) {
          console.log('[VolumeIntensitySlider] Drag started with timer at 0, setting fade to 0%');
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
          let newVolume = 100 - ((relativeY - HANDLE_HEIGHT / 2) / maxDragDistance) * 100;
          newVolume = Math.max(0, Math.min(100, Math.round(newVolume)));

          setVolume(newVolume);
          volumeRef.current = newVolume;
          sendVolumeToServer(newVolume);
          onVolumeChange?.(newVolume);
          // Update timer sound volume if callback provided
          updateTimerSoundVolume?.(newVolume);
        });
      },

      onPanResponderRelease: () => {
        sendVolumeToServer(volumeRef.current);
        // Update timer sound volume on release
        updateTimerSoundVolume?.(volumeRef.current);
        
        // If timer is at 0 (not PERSIST) and user was dragging, start 3-second countdown to fade back to 100%
        if (timerFadeDownAmount === 0 && timerMinutes === 0 && dragFadeValue === 0) {
          console.log('[VolumeIntensitySlider] Drag ended, starting 3-second timer before fade animation');
          
          // Clear any previous timeout
          if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
          }
          
          // Wait 3 seconds, then start fade animation
          dragTimeoutRef.current = setTimeout(() => {
            console.log('[VolumeIntensitySlider] 3-second delay complete, starting fade animation');
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

  const fillHeight = `${displayVolume}%`;

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
        source={require('../../assets/icons/Volumn_adj.png')}
        style={[styles.icon, styles.iconOverlay]}
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
  icon: {
    height: 30,
    width: 25,
  },
  iconOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    bottom:15
  },
});
