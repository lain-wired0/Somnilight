import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, PanResponder, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ele } from '../../styles';
import { sendVolumeToServer as sendVolumeToServerShared } from '../VolumeServerSync';

const SLIDER_WIDTH = 50;
const SLIDER_HEIGHT = 80;
const HANDLE_HEIGHT = 25;
const SERVER_URL = 'http://150.158.158.233:1880';

export default function VolumeIntensitySlider({ onVolumeChange, refreshTrigger }) {
  const [volume, setVolume] = useState(60);
  const volumeRef = useRef(60);
  const startVolumeRef = useRef(60);
  const lastSendTime = useRef(0);
  const sliderRef = useRef(null);

  // Load volume from AsyncStorage
  const loadVolume = useCallback(async () => {
    try {
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

  // Reload volume when refreshTrigger changes (modal closes)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadVolume();
    }
  }, [refreshTrigger, loadVolume]);

  const sendVolumeToServer = useCallback(async (value) => {
    await sendVolumeToServerShared({ volume: value });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        startVolumeRef.current = volume;
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
        });
      },

      onPanResponderRelease: () => {
        sendVolumeToServer(volumeRef.current);
      },
    })
  ).current;

  const fillHeight = `${volume}%`;

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
            backgroundColor: 'rgba(226, 226, 226, 0.3)',
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
