import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  TextInput,
  Alert, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { textStyles } from '../styles';
import InteractiveArcSlider from './components/InteractiveArcSlider';
import VolumeSlider from './components/VolumeSlider';
import SoundPlayingIcon from './components/SoundPlayingIcon';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const bgImage = require('../assets/general_images/bg_preset.png');
const morningImg = require('../assets/general_images/preJade.png');
const sleepImg = require('../assets/general_images/preMist.png');
const relaxImg = require('../assets/general_images/preCloud.png');
const add4Img = require('../assets/general_images/preWater.png'); 
const add5Img = require('../assets/general_images/preMount.png'); 
const add6Img = require('../assets/general_images/preGreen.png');   


const PRESET_COVERS = [
  morningImg,
  sleepImg,
  relaxImg, 
  add4Img,   
  add5Img, 
  add6Img,   
];


const forestImg = require('../assets/general_images/preF.png');
const valleyImg = require('../assets/general_images/preV.png');
const rainImg = require('../assets/general_images/preR.png');


const GRADIENT_MAP = [
  ['#B0B0B0', '#F0F0F0'],
  ['#f1e2bdff', '#FBF5E4'],
  ['#FFCC99', '#F6DBA3'],
  ['#F7CD62', '#FFEAB4'],
  ['#87d2d2ff', '#ceefefff'],
];

const colorsArr = ['#F0F0F0', '#FBF5E4', '#F6DBA3', '#F7CD62', '#BEDFDF'];


const SOUND_OPTIONS = [
  { id: 'forest', name: 'Forest', image: forestImg },
  { id: 'valley', name: 'Valley', image: valleyImg },
  { id: 'rain', name: 'Rain', image: rainImg },
];


const INITIAL_PRESETS = [
  {
    id: 'morning_1',
    label: 'Morning_1',
    cover: PRESET_COVERS[0],
    lighting: {
      brightness: 80,
      colorIndex: 3,
    },
    volume: 0.6,
    vibration: true,
    soundId: 'forest',
    isSoundPlaying: false,
  },
  {
    id: 'sleep',
    label: 'Sleep',
    cover: PRESET_COVERS[1],
    lighting: {
      brightness: 30,
      colorIndex: 1,
    },
    volume: 0.3,
    vibration: false,
    soundId: 'rain',
    isSoundPlaying: false,
  },
];

export default function PresetScreen({ navigation }) {
  
  const [presets, setPresets] = useState(INITIAL_PRESETS);
  
  const [activePresetId, setActivePresetId] = useState('morning_1');

  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  
  const [canScroll, setCanScroll] = useState(true);

  const activePreset =
    presets.find(p => p.id === activePresetId) || presets[0];

  
  const brightness = activePreset?.lighting.brightness ?? 80;
  const selectedColor = activePreset?.lighting.colorIndex ?? 3;
  const volume = activePreset?.volume ?? 0.6;
  const isVibrationOn = activePreset?.vibration ?? true;
  const selectedSoundId = activePreset?.soundId ?? 'forest';
  const isSoundPlaying = activePreset?.isSoundPlaying ?? false;


  
  const updateActivePreset = patch => {
    setPresets(prev =>
      prev.map(p =>
        p.id === activePresetId ? { ...p, ...patch } : p,
      ),
    );
  };

  
  const updateActiveLighting = lightingPatch => {
    setPresets(prev =>
      prev.map(p =>
        p.id === activePresetId
          ? { ...p, lighting: { ...p.lighting, ...lightingPatch } }
          : p,
      ),
    );
  };

  
  const handleAddPreset = () => {
    const base = activePreset || presets[0];
    const newId = `preset_${Date.now()}`;

    
    const nextCoverIndex = presets.length % PRESET_COVERS.length;
    const nextCover = PRESET_COVERS[nextCoverIndex];

    const newPreset = {
      ...base,
      id: newId,
      label: `Preset_${presets.length + 1}`,
      cover: nextCover,
    };
    setPresets(prev => [...prev, newPreset]);
    setActivePresetId(newId);
  };

  
const handleDeletePreset = id => {
  if (presets.length <= 1) {
    Alert.alert('Cannot Delete', 'At least one preset must remain.');
    return;
  }

  const target = presets.find(p => p.id === id);

  Alert.alert(
    'Delete Preset',
    `Are you sure to delete "${target?.label ?? 'this preset'}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const remaining = presets.filter(p => p.id !== id);
          setPresets(remaining);

          
          if (activePresetId === id && remaining[0]) {
            setActivePresetId(remaining[0].id);
          }
        },
      },
    ],
  );
};


  
  const startEditName = () => {
    setEditingName(activePreset?.label ?? '');
    setIsEditingName(true);
  };

  
  const commitEditName = () => {
    if (editingName.trim().length === 0) {
      setIsEditingName(false);
      return;
    }
    updateActivePreset({ label: editingName.trim() });
    setIsEditingName(false);
  };

  return (
    <ImageBackground
      source={bgImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={canScroll}
        >
          {/* --- Header --- */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconButton}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ ...textStyles.medium16, fontSize: 20 }}>
                Presets
              </Text>
            </View>

            {/* 右侧加号（可以先留着，后面看需求要不要用） */}
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* --- Top Preset Tabs --- */}
          <View style={styles.topTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topTabsScrollContent}
            >
              {presets.map(item => {
                const isActive = item.id === activePresetId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.tabItem}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActivePresetId(item.id);
                      setIsEditingName(false);
                    }}
                    onLongPress={() => handleDeletePreset(item.id)}
                    delayLongPress={500}
                  >
                    <Image
                      source={item.cover}
                      style={[
                        styles.circleImage,
                        isActive && styles.circleImageActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.presetTabLabel,
                        isActive && styles.presetTabLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Add preset */}
              <TouchableOpacity
                style={styles.tabItem}
                onPress={handleAddPreset}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.circleIconBase,
                    { backgroundColor: 'rgba(255,255,255,0.1)' },
                  ]}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                </View>
                <Text style={{ ...textStyles.reg11, marginTop: 8 }}>
                  Add
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>


          {/* --- Label --- */}
          <BlurView
            tint="dark"
            intensity={30}
            style={styles.glassCardSmall}
          >
            <Text style={{ ...textStyles.medium16 }}>Label</Text>
            {isEditingName ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  justifyContent: 'flex-end',
                }}
              >
                <TextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  style={{
                    ...textStyles.medium16,
                    color: '#FFF',
                    marginRight: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#FFF',
                    paddingVertical: 0,
                    minWidth: 80,
                    textAlign: 'right',
                  }}
                  autoFocus={true}
                  onBlur={commitEditName}
                  onSubmitEditing={commitEditName}
                />
                <TouchableOpacity onPress={commitEditName}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#4cd964"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={startEditName}
              >
                <Text
                  style={{
                    ...textStyles.medium16,
                    color: 'rgba(255,255,255,0.7)',
                    marginRight: 5,
                  }}
                >
                  {activePreset?.label}
                </Text>
                <Ionicons
                  name="pencil"
                  size={14}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            )}
          </BlurView>

          {/* --- Lighting Card --- */}
          <BlurView
            tint="dark"
            intensity={30}
            style={styles.glassCardLarge}
          >
            <Text
              style={{
                ...textStyles.semibold15,
                fontSize: 17,
                marginBottom: 5,
              }}
            >
              Lighting
            </Text>
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <InteractiveArcSlider
                key={activePresetId}
                percentage={brightness}
                onValueChange={val =>
                  updateActiveLighting({ brightness: val })
                }
                onGestureStart={() => setCanScroll(false)}
                onGestureEnd={() => setCanScroll(true)}
                colors={GRADIENT_MAP[selectedColor]}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 80,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    width: 140,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      updateActiveLighting({
                        brightness: Math.max(0, brightness - 5),
                      })
                    }
                  >
                    <View style={styles.smallCircleButton}>
                      <Ionicons
                        name="remove"
                        size={20}
                        color="#FFF"
                      />
                    </View>
                  </TouchableOpacity>
                  <Text
                    style={{
                      ...textStyles.semibold15,
                      fontSize: 16,
                    }}
                  >
                    {brightness}%
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      updateActiveLighting({
                        brightness: Math.min(100, brightness + 5),
                      })
                    }
                  >
                    <View style={styles.smallCircleButton}>
                      <Ionicons name="add" size={20} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.colorRow}>
              {colorsArr.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() =>
                    updateActiveLighting({ colorIndex: index })
                  }
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === index &&
                      styles.selectedColorDot,
                  ]}
                />
              ))}
            </View>
          </BlurView>

          {/* --- Control Card --- */}
          <BlurView
            tint="dark"
            intensity={30}
            style={styles.glassCardLarge}
          >
            <View style={styles.controlRow}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#FFF"
                />
                <Text
                  style={{
                    ...textStyles.medium16,
                    marginLeft: 10,
                  }}
                >
                  Volume
                </Text>
              </View>
              <View
                style={{ width: 140, justifyContent: 'center' }}
              >
                <VolumeSlider
                  value={volume}
                  onValueChange={val =>
                    updateActivePreset({ volume: val })
                  }
                  totalWidth={140}
                  onGestureStart={() => setCanScroll(false)}
                  onGestureEnd={() => setCanScroll(true)}
                />
              </View>
            </View>
            <View style={[styles.controlRow, { marginTop: 25 }]}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color="#FFF"
                />
                <Text
                  style={{
                    ...textStyles.medium16,
                    marginLeft: 10,
                  }}
                >
                  Vibration
                </Text>
              </View>
              <Switch
                value={isVibrationOn}
                onValueChange={val =>
                  updateActivePreset({ vibration: val })
                }
                trackColor={{
                  true: '#8068E9',
                  false: 'rgba(61, 43, 142, 1)',
                }}
                thumbColor={'rgba(255, 255, 255, 1)'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </BlurView>

          {/* --- Sounds Grid --- */}
          <View style={{ marginTop: 5, marginBottom: 20 }}>
            <View style={styles.sectionHeader}>
              <Text
                style={{
                  ...textStyles.semibold15,
                  fontSize: 17,
                }}
              >
                Sounds
              </Text>
              <TouchableOpacity>
                <Text
                  style={{
                    ...textStyles.reg11,
                    color: '#F7CD62', 
                  }}
                >
                  More
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.soundGrid}>
              {SOUND_OPTIONS.map(item => {
                const isSelected = selectedSoundId === item.id;
                const isPlaying = isSelected && isSoundPlaying; 

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.soundItem}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (selectedSoundId === item.id) {
                        
                        updateActivePreset({
                          isSoundPlaying: !isSoundPlaying,
                        });
                      } else {
                        
                        updateActivePreset({
                          soundId: item.id,
                          isSoundPlaying: true,
                        });
                      }
                    }}
                  >
                    {/* 外层阴影 */}
                    <View
                      style={[
                        styles.soundCardWrapper,
                        isSelected && styles.soundCardWrapperActive,
                      ]}
                    >
                      {isSelected ? (
                        
                        <LinearGradient
                          colors={['#7962DD', '#423577']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.soundCardInner}
                        >
                          <View style={styles.soundIconContainer}>
                            <ImageBackground
                              source={item.image}
                              style={styles.roundInner}
                              imageStyle={{ borderRadius: 32 }}
                            >
                              {isPlaying ? (
                                
                                <SoundPlayingIcon active />
                              ) : (
                                
                                <Ionicons name="play" size={24} color="#FFF" />
                                
                              )}
                            </ImageBackground>
                          </View>
                          <Text style={styles.soundLabelActive}>
                            {item.name}
                          </Text>
                        </LinearGradient>
                      ) : (
                        
                        <BlurView
                          tint="dark"
                          intensity={30}
                          style={[
                            styles.soundCardInner,
                            styles.soundCardInnerInactive,
                          ]}
                        >
                          <View style={styles.soundIconContainer}>
                            <ImageBackground
                              source={item.image}
                              style={styles.roundInner}
                              imageStyle={{ borderRadius: 32 }}
                            />
                          </View>
                          <Text style={styles.soundLabelInactive}>
                            {item.name}
                          </Text>
                        </BlurView>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

// --- styles ---
const styles = StyleSheet.create({
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    flex: 1,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  scrollContent: {
    padding: 20,
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight + 20
        : 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  
  topTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  topTabsScrollContent: {
  paddingRight: 10,
},
  tabItem: { alignItems: 'center', marginRight: 20 },
  circleImage: { width: 50, height: 50, borderRadius: 25, opacity: 0.7 },
  circleImageActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  presetTabLabel: {
    ...textStyles.reg11,
    marginTop: 8,
    color: 'rgba(255,255,255,0.55)',
  },
  presetTabLabelActive: {
    ...textStyles.reg11,
    marginTop: 8,
    color: '#FFFFFF',
  },
  circleIconBase: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  glassCardSmall: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassCardLarge: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  smallCircleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  selectedColorDot: { borderWidth: 3, borderColor: '#FFF' },

  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },

  // Sounds
  soundGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  soundItem: {
    marginRight: 12,
  },

  soundCardWrapper: {
    borderRadius: 26,
  },
  soundCardWrapperActive: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  soundCardInner: {
    width: 110,
    height: 140,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  soundCardInnerInactive: {
    backgroundColor: 'rgba(8, 5, 33, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  soundIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  roundInner: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },

  soundLabelActive: {
    marginTop: 6,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'PingFangSC-Semibold',
  },
  soundLabelInactive: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'PingFangSC-Regular',
  },
});
