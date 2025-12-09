import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, PanResponder, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { textStyles, ele } from '../styles';

const SLIDER_WIDTH = 80;
const SLIDER_TRACK_HEIGHT = 240;
const HANDLE_HEIGHT = 30;

const SERVER_URL = 'http://150.158.158.233:1880';

export default function VolumeAdjust() {
  const [volume, setVolume] = useState(60);
  const [musicIndex, setMusicIndex] = useState(0);

  const startVolumeRef = useRef(60);
  const lastSendTime = useRef(0);

  const MUSIC_OPTIONS = [
    require('../assets/general_images/preRain.png'),
    require('../assets/general_images/preValley.png'),
    require('../assets/general_images/preForest.png'),
    require('../assets/general_images/preSea.png'),
    require('../assets/general_images/preMore.png'),
  ];

  // Start-up: Load volume + music
  useEffect(() => {
    const loadState = async () => {
      try {
        const localVolume = await AsyncStorage.getItem('last_volume');
        const localMusic = await AsyncStorage.getItem('last_music');

        if (localVolume !== null) {
          const v = parseInt(localVolume, 10);
          setVolume(v);
          startVolumeRef.current = v;
        }
        if (localMusic !== null) setMusicIndex(parseInt(localMusic, 10));

        // Fetch server state
        const res = await fetch(`${SERVER_URL}/get_state`);
        if (res.ok) {
          const json = await res.json();

          if (json.volume !== undefined) {
            setVolume(json.volume);
            AsyncStorage.setItem('last_volume', json.volume.toString());
          }
          if (json.music !== undefined) {
            setMusicIndex(json.music);
            AsyncStorage.setItem('last_music', json.music.toString());
          }
        }
      } catch (err) {
        console.error('Load State Error:', err);
      }
    };

    loadState();
  }, []);

  // send volume to Node-RED
  const sendVolumeToServer = useCallback(async (value) => {
    const now = Date.now();
    if (now - lastSendTime.current < 200) {
      AsyncStorage.setItem('last_volume', value.toString());
      return;
    }
    lastSendTime.current = now;

    AsyncStorage.setItem('last_volume', value.toString());

    try {
      await fetch(`${SERVER_URL}/set_volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: value }),
      });
    } catch (err) {
      console.error('POST /set_volume Error:', err);
    }
  }, []);

  // send music index
  const sendMusicToServer = async (index) => {
    setMusicIndex(index);
    AsyncStorage.setItem('last_music', index.toString());

    try {
      await fetch(`${SERVER_URL}/set_music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ music: index }),
      });
    } catch (err) {
      console.error('POST /set_music Error:', err);
    }
  };

  // slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        startVolumeRef.current = volume;
      },

      onPanResponderMove: (_, gestureState) => {
        const maxDrag = SLIDER_TRACK_HEIGHT - HANDLE_HEIGHT;
        const deltaPercent = (gestureState.dy / maxDrag) * 100;

        let newVolume = startVolumeRef.current - deltaPercent;
        newVolume = Math.max(0, Math.min(100, Math.round(newVolume)));

        setVolume(newVolume);
        sendVolumeToServer(newVolume);
      },

      onPanResponderRelease: () => {
        sendVolumeToServer(volume);
      },
    })
  ).current;

  const fillHeight = `${volume}%`;
  const handleTop = ((100 - volume) / 100) * (SLIDER_TRACK_HEIGHT - HANDLE_HEIGHT);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/general_images/background_adj.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <View style={styles.header}>
        <Image
          source={require('../assets/icons/Volumn_adj.png')}
          style={ele.icon50}
          resizeMode="contain"
        />
        <Text style={styles.percentageText}>Volume {volume}%</Text>
      </View>

      <View style={[styles.sliderContainer, { height: SLIDER_TRACK_HEIGHT }]}>
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: fillHeight,
          backgroundColor: 'rgba(226,226,226,0.45)'
        }}/>
        <View
          style={[styles.handle, { top: handleTop }]}
          {...panResponder.panHandlers}
        >
          <View style={{ width: 20, height: 4, backgroundColor: '#ddd', borderRadius: 2 }} />
        </View>
      </View>

      {/* Music Buttons */}
      <View style={styles.musicRow}>
        {MUSIC_OPTIONS.map((img, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.musicButton,
              musicIndex === index && styles.musicButtonSelected
            ]}
            onPress={() => sendMusicToServer(index)}
          >
            <Image source={img} style={styles.musicIcon} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#05011C'
  },
  header: { alignItems: 'center', marginBottom: 40 },
  percentageText: { fontSize: 18, color: 'white', marginTop: 15 },
  sliderContainer: {
    width: SLIDER_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  handle: {
    position: 'absolute', left: 0, right: 0,
    height: HANDLE_HEIGHT, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'white'
  },
  musicRow: {
    flexDirection: 'row',
    marginTop: 40,
    width: '90%',
    justifyContent: 'space-between'
  },
  musicButton: {
    width: 50, height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  musicButtonSelected: {
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.35)'
  },
  musicIcon: { width: 30, height: 30, resizeMode: 'contain' }
});
