import React, { useState, useEffect, useRef ,useCallback, useMemo} from 'react';
import { Image, ImageBackground, Text, View, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Switch, Button, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

//react-navigation
import { createStaticNavigation, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

//Dragable view
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

//Online Assets

//Local style
import { textStyles, colors, containers, ele } from '../styles';
import { deviceHeight, deviceWidth} from '../App.js'
import { Icon12text11 } from '../styles';
import { loadPresetsFromStorage, loadActivePresetId, saveActivePresetId } from '../utils/PresetStorage';

//Local Navigation
import { Tabs } from '../App.js';
import { Stacks } from '../App.js';

//Local Screens
import { HomeAlarmSetScreen } from './HomeAlarmSet.js';
import LightAdjust from './LightAdjust.js';
import VolumnAdjust from './VolumnAdjust.js';
import LightIntensitySlider from './components/LightIntensitySlider.js';
import VolumeIntensitySlider from './components/VolumeIntensitySlider.js';
import { HeaderBackground } from '@react-navigation/elements';

let user_name = 'Mushroom'

function getTodayDate() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var date = new Date();
  var year = date.getFullYear().toString();
  var month = monthNames[date.getMonth()]
  var day = date.getDate().toString();
  return (`${month} ${day}, ${year}`)
}

export function HomeStack() {
    return(
        <Stacks.Navigator
            screenOptions={({route}) => ({
                headerShown: false
            })}
        >
            <Stacks.Screen name = "Home" component = { HomeScreen }/>

        </Stacks.Navigator>
    )
}

const HomeScreen = (pass = {navigation, route}) => {
    const [lightAdjustVisible, setLightAdjustVisible] = useState(false);
    const [volumeAdjustVisible, setVolumeAdjustVisible] = useState(false);
    const [brightnessRefreshTrigger, setBrightnessRefreshTrigger] = useState(0);
    const [volumeRefreshTrigger, setVolumeRefreshTrigger] = useState(0);
    
    // Active preset tracking (shared state between HomeControlPanel and modals)
    const [activePresetId, setActivePresetId] = useState(null);
    
    // Live sound tracking for timer playback
    const [liveSoundId, setLiveSoundId] = useState('forest'); // Default to forest
    const timerSoundRef = useRef(null); // Ref for timer sound playback
    
    // Sound files mapping
    const SOUND_FILES = {
        forest: require('../assets/sounds/Forest.mp3'),
        valley: require('../assets/sounds/Valley.mp3'),
        rain: require('../assets/sounds/Rain.mp3'),
    };
    
    // Clear active preset when user makes manual adjustments
    const clearActivePreset = useCallback(async () => {
        console.log('[HomeScreen] clearActivePreset called, current activePresetId:', activePresetId);
        if (activePresetId !== null) {
            setActivePresetId(null);
            await saveActivePresetId(null);
            console.log('[HomeScreen] Cleared active preset (manual adjustment made)');
        }
    }, [activePresetId]);
    
    // Sleep Timer State
    const [timerMinutes, setTimerMinutes] = useState(0); // Default 0 minutes
    const [timerRunning, setTimerRunning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [timerPulseOpacity, setTimerPulseOpacity] = useState(0.85); // For text brightness pulse
    const [timerFadeDownAmount, setTimerFadeDownAmount] = useState(0); // Amount to fade brightness/volume (0-100)
    const timerIntervalRef = useRef(null);
    const fadeStartTimeRef = useRef(null); // Track when we entered the last 60 seconds
    const flickerIntervalRef = useRef(null);
    const flickerTimeoutsRef = useRef([]);
    
    // Timer countdown effect - decrements remaining seconds every second
    useEffect(() => {
        if (timerRunning && remainingSeconds > 0) {
            timerIntervalRef.current = setInterval(() => {
                setRemainingSeconds(prev => {
                    if (prev <= 1) {
                        setTimerRunning(false);
                        setTimerMinutes(0); // Set picker to 0 when timer completes
                        setTimerFadeDownAmount(100); // Keep at 100% fade when timer completes
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }
        
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [timerRunning, remainingSeconds]);
    
    // Smooth fade-down effect for last 60 seconds using animation frame with time-based calculation
    useEffect(() => {
        if (timerRunning && remainingSeconds <= 60 && remainingSeconds > 0) {
            let animationFrameId = null;
            
            // Initialize fade start time when entering last 60 seconds
            if (!fadeStartTimeRef.current) {
                fadeStartTimeRef.current = Date.now();
            }
            
            const animate = () => {
                const elapsedMs = Date.now() - fadeStartTimeRef.current;
                // We want to fade over 60 seconds = 60000ms
                // Fade goes from 0 to 100 as we progress from start to 60 seconds
                const fadeAmount = Math.max(0, Math.min(100, (elapsedMs / 60000) * 100));
                setTimerFadeDownAmount(fadeAmount);
                animationFrameId = requestAnimationFrame(animate);
            };
            
            animationFrameId = requestAnimationFrame(animate);
            
            return () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            };
        } else if (!timerRunning && remainingSeconds === 0 && timerMinutes === 0) {
            // Timer at 0 (never started or user manually set to 0) - NO fade
            setTimerFadeDownAmount(0);
            fadeStartTimeRef.current = null;
        } else if (timerMinutes === -1) {
            // PERSIST mode selected - no fade
            setTimerFadeDownAmount(0);
            fadeStartTimeRef.current = null;
        } else if (remainingSeconds > 60) {
            // Not in fade period yet - reset fade
            setTimerFadeDownAmount(0);
            fadeStartTimeRef.current = null;
        }
        // Don't reset fade in other cases (preserves fade at 100% when timer completes)
    }, [timerRunning, remainingSeconds, timerMinutes]);
    
    // Continuous pulse effect for timer text when running: gradually drop then sudden rise
    useEffect(() => {
        if (timerRunning) {
            let animationFrameId = null;
            let startTime = null;
            const cycleDuration = 1000; // Complete cycle in 1 second
            const stayHighDuration = 0.3; // Stay at max opacity for 30% of cycle
            const dropDuration = 0.5; // 50% of cycle for gradual drop
            
            const animate = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const elapsed = (currentTime - startTime) % cycleDuration;
                const progress = elapsed / cycleDuration;
                
                let opacity;
                if (progress < stayHighDuration) {
                  // First 30%: stay at maximum
                  opacity = 1.0;
                } else if (progress < stayHighDuration + dropDuration) {
                  // Next 50%: gradual drop from 1.0 to 0.65
                  const dropProgress = (progress - stayHighDuration) / dropDuration;
                  opacity = 1.0 - dropProgress * 0.35; // 1.0 -> 0.65
                } else {
                  // Last 20%: sudden jump back to 1.0
                  opacity = 1.0;
                }
                
                setTimerPulseOpacity(opacity);
                animationFrameId = requestAnimationFrame(animate);
            };
            
            animationFrameId = requestAnimationFrame(animate);
            
            return () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            };
        } else {
            setTimerPulseOpacity(0.85); // Reset to default brightness
        }
    }, [timerRunning]);
    
    // Sound playback functions
    const playTimerSound = useCallback(async (soundId) => {
        try {
            // Prevent multiple simultaneous calls
            if (timerSoundRef.current) {
                console.log('[HomeScreen] Sound already playing, skipping');
                return;
            }
            
            console.log(`[HomeScreen] Starting timer sound: ${soundId}`);
            
            const soundFile = SOUND_FILES[soundId];
            if (!soundFile) {
                console.warn(`[HomeScreen] Sound file not found for: ${soundId}`);
                return;
            }
            
            const { sound } = await Audio.Sound.createAsync(soundFile, { shouldPlay: false });
            timerSoundRef.current = sound;
            
            await sound.setIsLoopingAsync(true);
            
            // Get current volume from AsyncStorage
            const savedVolume = await AsyncStorage.getItem('last_volume');
            const volumeValue = savedVolume ? parseInt(savedVolume, 10) / 100 : 0.6; // Convert 0-100 to 0-1
            await sound.setVolumeAsync(volumeValue);
            
            await sound.playAsync();
            console.log(`[HomeScreen] Timer sound playing: ${soundId} at volume ${volumeValue}`);
        } catch (err) {
            console.error('[HomeScreen] Error playing timer sound:', err);
            // Clean up ref on error
            timerSoundRef.current = null;
        }
    }, []);
    
    const stopTimerSound = useCallback(async () => {
        try {
            console.log('[HomeScreen] Stopping timer sound...');
            if (timerSoundRef.current) {
                await timerSoundRef.current.stopAsync();
                await timerSoundRef.current.unloadAsync();
                timerSoundRef.current = null;
            }
        } catch (err) {
            console.error('[HomeScreen] Error stopping timer sound:', err);
            timerSoundRef.current = null;
        }
    }, []);
    
    // Update sound volume when volume slider changes
    const updateTimerSoundVolume = useCallback(async (volume) => {
        try {
            if (timerSoundRef.current) {
                const volumeValue = volume / 100; // Convert 0-100 to 0-1
                await timerSoundRef.current.setVolumeAsync(volumeValue);
                console.log(`[HomeScreen] Updated timer sound volume to: ${volumeValue}`);
            }
        } catch (err) {
            console.error('[HomeScreen] Error updating sound volume:', err);
        }
    }, []);
    
    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (timerSoundRef.current) {
                timerSoundRef.current.unloadAsync();
            }
        };
    }, []);
    
    // Start/stop sound based on timer running state
    useEffect(() => {
        // Play sound if timer is running OR in PERSIST mode
        if ((timerRunning || timerMinutes === -1) && liveSoundId) {
            playTimerSound(liveSoundId);
        } else if (!timerRunning && timerMinutes !== -1) {
            stopTimerSound();
        }
        
        // Cleanup when effect re-runs or unmounts
        return () => {
            // Don't stop on every re-render, only when timer stops
        };
    }, [timerRunning, liveSoundId, timerMinutes]); // Added timerMinutes to deps
    
    const startTimer = (minutes) => {
        setRemainingSeconds(minutes * 60);
        setTimerRunning(true);
        setTimerFadeDownAmount(0); // Reset fade when starting a new timer
        fadeStartTimeRef.current = null; // Clear fade start time
    };
    
    const stopTimer = () => {
        setTimerRunning(false);
        setRemainingSeconds(0);
        setTimerFadeDownAmount(0); // Reset fade when manually stopping
        fadeStartTimeRef.current = null; // Clear fade start time
    };
    
    const formatRemainingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    // --- BEGIN: Auto-fade playback volume sync ---
    // Track the current display volume (including fade) and update playback volume in real time
    useEffect(() => {
        // Only update if timer is running or in PERSIST mode
        if (!(timerRunning || timerMinutes === -1)) return;

        // Get the current volume and fade from VolumeIntensitySlider logic
        // We'll need to replicate the calculation here
        const getDisplayVolume = async () => {
            // Try to get the last set volume from AsyncStorage (same as VolumeIntensitySlider)
            let baseVolume = 60;
            try {
                const tempVolume = await AsyncStorage.getItem('tempVolume');
                if (tempVolume !== null) {
                    baseVolume = parseInt(tempVolume, 10);
                } else {
                    const savedVolume = await AsyncStorage.getItem('last_volume');
                    if (savedVolume !== null) {
                        baseVolume = parseInt(savedVolume, 10);
                    }
                }
            } catch (err) {
                // fallback to default
            }
            // timerFadeDownAmount is 0-100
            const displayVolume = Math.max(0, baseVolume - (baseVolume * timerFadeDownAmount / 100));
            return displayVolume;
        };

        // Update playback volume whenever timerFadeDownAmount or timerRunning changes
        getDisplayVolume().then((displayVolume) => {
            updateTimerSoundVolume(Math.round(displayVolume));
        });
    }, [timerFadeDownAmount, timerRunning, timerMinutes, updateTimerSoundVolume]);
    // --- END: Auto-fade playback volume sync ---

    return (
    <View style = {{
        backgroundColor:'#05011C',
        flex:1,
    }}>
        <ImageBackground 
            source = {require('../assets/general_images/hp_asm.png') } 
            style = {hp_style}>
            <Text style={{
                ...textStyles.semibold15, 
                fontSize: 20,
                position:'absolute',
                left: 29,
                top: 88,
                }}>
                Good night, {user_name}</Text>
            <Text style={{
                ...textStyles.medium16,
                fontSize: 12,
                position:'absolute',
                left: 29,
                top: 114,
                }}>
                {getTodayDate()}</Text>   
                    
            <TouchableOpacity   style = {{
                left: 322, top:82, size:30, flex:1
                }}>
                <MaterialCommunityIcons 
                    name = {'bell-outline'} size={30} color = {'white'} style={{flex:1}}
                />
            </TouchableOpacity>
            <View style = {{
                ...StyleSheet.absoluteFill
            }}>
                <HomeConfigSlide pass = {{
                    ...pass, 
                    lightAdjustVisible, 
                    setLightAdjustVisible, 
                    volumeAdjustVisible, 
                    setVolumeAdjustVisible,
                    timerRunning,
                    remainingSeconds,
                    setRemainingSeconds,
                    timerMinutes,
                    setTimerMinutes,
                    startTimer,
                    stopTimer,
                    timerPulseOpacity,
                    timerFadeDownAmount,
                    formatRemainingTime,
                    brightnessRefreshTrigger,
                    volumeRefreshTrigger,
                    setBrightnessRefreshTrigger,
                    setVolumeRefreshTrigger,
                    activePresetId,
                    setActivePresetId,
                    clearActivePreset,
                    setLiveSoundId,
                    updateTimerSoundVolume
                }}/>
            </View>
            
            {/* Light Adjust Modal */}
            <LightAdjustModal 
                visible={lightAdjustVisible} 
                clearActivePreset={clearActivePreset}
                onClose={() => {
                    setLightAdjustVisible(false);
                    setBrightnessRefreshTrigger(prev => prev + 1);
                }} 
            />
            
            {/* Volume Adjust Modal */}
            <VolumeAdjustModal 
                visible={volumeAdjustVisible} 
                clearActivePreset={clearActivePreset}
                onClose={() => {
                    setVolumeAdjustVisible(false);
                    setVolumeRefreshTrigger(prev => prev + 1);
                }} 
            />
            
            {/* Sleep Timer Modal */}
        </ImageBackground>
    </View>

    )

}

const HomeConfigSlide = ({pass}) => {
    // BottomSheetView ref
    const bottomSheetRef = useRef(null);
    // callbacks
    const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
    }, []);
    return(
        <GestureHandlerRootView style={{
            flex: 1,
            marginLeft:15,
            marginRight:15,
            top:-15,
        }}>
            
            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={["40%","90%"]}
                onChange={handleSheetChanges}
                backgroundComponent = { BlurSlideBG }
                enableContentPanningGesture={false}
                handleStyle = {{height:25, paddingTop: 13,}}
                handleIndicatorStyle = {{
                    height:8,
                    width:54,
                    backgroundColor:'rgba(255, 255, 255, 0.6)',
                    borderRadius:4,
                }}
            >
                <BottomSheetView style={{
                    flex: 1,
                    padding: 15,
                    alignItems: 'left',
                }}>

                    <Text style={{
                        ...textStyles.medium16,
                        fontSize:10,
                        alignSelf:'left',
                        }}>
                        Device</Text>

                    <Text style={{
                        ...textStyles.medium16,
                        fontSize:20,
                        alignSelf:'left',
                    }}>
                        Pillow Alarm</Text>
                    
                    <Image //wifi_icon
                        source = {require('../assets/icons/wifi_act.png')}
                        style = {{
                            height:20,
                            width:20,
                            position:'absolute',
                            top:34,
                            left:142,
                        }}/>

                    <DeviceSwitch location = {{
                        position:'absolute',
                        right:20,
                        top:25,}}/>

                    <View style = {{padding:15}}>
                        <Image //pillow
                            source = {require('../assets/general_images/pillow_legacy.png')}
                            style = {pillow_legacy}/>
                    </View>
                    <HomeControlPanel pass = {pass}/>
                    <HomeFeedbackPanel pass = {pass}/>        

                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
    )
}


const DeviceSwitch = ({location}) => {
    const [isDeviceOn, setIsDeviceOn] = useState(false); // Start with false, will be updated by useEffect
    const [powerLoaded, setPowerLoaded] = useState(false); // Track if power state has been loaded

    // Load initial power state from server when component mounts
    useEffect(() => {
        const loadPowerState = async () => {
            try {
                const powerState = await initPower();
                setIsDeviceOn(powerState);
                setPowerLoaded(true);
                console.log('[DeviceSwitch] Power state loaded from server:', powerState);
            } catch (error) {
                console.error('[DeviceSwitch] Error loading power state:', error);
                setPowerLoaded(true); // Mark as loaded even on error
            }
        };

        loadPowerState();
    }, []);

    const toggleSwitch = () => {
        const newState = !isDeviceOn;
        setIsDeviceOn(newState);
        setPower(newState);
    };

    return (
        <Switch 
            trackColor = {{true: '#8068E9',false:'rgba(61, 43, 142, 1)'}}
            thumbColor = {'rgba(255, 255, 255, 1)'}
            ios_backgroundColor = "#3e3e3e"
            onValueChange = {toggleSwitch}
            value = {isDeviceOn}
            style= {location}
            disabled = {!powerLoaded} // Disable switch until power state is loaded
            />
    )
}

async function initPower() {
    try {
        const response = await fetch('http://somnilight.online:1880/pillow/power');
        const data = await response.json();
        console.log('[initPower] Response:', data);
        return (data.power === 'on' ? true : false);
    } catch (error) {
        console.error('[initPower] Error fetching power state:', error);
        return false; // Default to off on error
    }
}

// Light Adjust Modal Component
const LightAdjustModal = ({ visible, onClose, clearActivePreset }) => {
    if (!visible) return null;
    
    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
            duration={200}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{ flex: 1 }}>
                    {/* Blur background */}
                    <BlurView tint="dark" intensity={80} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    {/* Gradient overlay */}
                    <View style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                        <LinearGradient 
                            colors={['rgba(140, 117, 241, 0.50)' , 'rgba(24, 15, 40, 0.50)', 'rgba(0, 0, 0, 0.50)']}
                            locations={[0, 0.3, 1]}
                            style={{ width: '100%', height: '100%' }}
                            start={{x: 1, y: 0.2}}
                        />
                    </View>
                    {/* Content - box-none allows background tap to pass through empty areas */}
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', pointerEvents: 'box-none' }}>
                            <LightAdjust onClose={onClose} onManualChange={clearActivePreset} />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// Volume Adjust Modal Component
const VolumeAdjustModal = ({ visible, onClose, clearActivePreset }) => {
    if (!visible) return null;
    
    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
            duration={200}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{ flex: 1 }}>
                    {/* Blur background */}
                    <BlurView tint="dark" intensity={80} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    {/* Gradient overlay */}
                    <View style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                        <LinearGradient 
                            colors={['rgba(140, 117, 241, 0.50)' , 'rgba(24, 15, 40, 0.50)', 'rgba(0, 0, 0, 0.50)']}
                            locations={[0, 0.3, 1]}
                            style={{ width: '100%', height: '100%' }}
                            start={{x: 1, y: 0.2}}
                        />
                    </View>
                    {/* Content - box-none allows background tap to pass through empty areas */}
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', pointerEvents: 'box-none' }}>
                            <VolumnAdjust onClose={onClose} onManualChange={clearActivePreset} />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

async function setPower(isOn) {
    const res = await fetch('http://somnilight.online:1880/pillow/power',{
        method: "POST",
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            power: isOn ? "on" : "off"
        })
    });

    const data = await res.json();
    console.log("set_power response:",data)

}

const HomeControlPanel = ({pass}) => {
    const [presets, setPresets] = useState([]);
    const [panelIndex, setPanelIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const scrollViewRef = useRef(null);

    // Load presets from storage
    const loadPresetsData = useCallback(async () => {
        try {
            const storedPresets = await loadPresetsFromStorage();
            if (storedPresets && storedPresets.length > 0) {
                setPresets(storedPresets);
                console.log('[HomeControlPanel] Loaded presets:', storedPresets.length);
            }

            const activeId = await loadActivePresetId();
            if (activeId) {
                pass.setActivePresetId(activeId);
                console.log('[HomeControlPanel] Loaded active preset:', activeId);
            }
        } catch (error) {
            console.error('[HomeControlPanel] Error loading presets:', error);
        }
    }, []);

    // Load presets on mount only
    useEffect(() => {
        loadPresetsData();
    }, [loadPresetsData]);

    // Reload presets when screen comes into focus (after returning from Preset screen)
    useEffect(() => {
        const unsubscribe = pass.navigation.addListener('focus', () => {
            console.log('[HomeControlPanel] Screen focused, reloading presets');
            loadPresetsData();
        });
        
        return unsubscribe;
    }, [pass.navigation, loadPresetsData]);

    // Apply preset settings when selected (read-only, one-way sync from preset to UI)
    const applyPreset = async (preset) => {
        try {
            console.log('[HomeControlPanel] Applying preset:', preset.label);
            
            // Update UI sliders/modals with preset values WITHOUT saving to AsyncStorage
            // This is one-way only: preset -> UI (not UI -> preset)
            
            // Update brightness and color in UI
            if (preset.lighting) {
                console.log('[HomeControlPanel] Updating brightness:', preset.lighting.brightness, 'color index:', preset.lighting.colorIndex);
                // Store temporarily in a state that LightIntensitySlider can watch
                await AsyncStorage.setItem('tempBrightness', JSON.stringify(preset.lighting.brightness));
                await AsyncStorage.setItem('tempColorIndex', JSON.stringify(preset.lighting.colorIndex));
                // Trigger UI refresh
                pass.setBrightnessRefreshTrigger(prev => prev + 1);
            }

            // Update volume in UI
            if (preset.volume !== undefined) {
                // Convert decimal volume (0-1) to percentage (0-100)
                const volumePercent = Math.round(preset.volume * 100);
                console.log('[HomeControlPanel] Updating volume:', preset.volume, '-> percentage:', volumePercent);
                await AsyncStorage.setItem('tempVolume', JSON.stringify(volumePercent));
                pass.setVolumeRefreshTrigger(prev => prev + 1);
            }

            // Update sound settings in UI (for Preset.js)
            if (preset.soundId !== undefined) {
                await AsyncStorage.setItem('tempSoundId', preset.soundId);
                // Update live sound ID for timer playback
                pass.setLiveSoundId(preset.soundId);
                console.log('[HomeControlPanel] Set live sound ID:', preset.soundId);
            }

            if (preset.isSoundPlaying !== undefined) {
                await AsyncStorage.setItem('tempSoundPlaying', JSON.stringify(preset.isSoundPlaying));
            }

            // Update vibration in UI
            if (preset.vibration !== undefined) {
                await AsyncStorage.setItem('tempVibrationEnabled', JSON.stringify(preset.vibration));
            }

            // Mark this preset as selected (for visual indicator only)
            pass.setActivePresetId(preset.id);
            await saveActivePresetId(preset.id);
            
            console.log('[HomeControlPanel] Preset applied to UI (one-way sync)');
        } catch (error) {
            console.error('[HomeControlPanel] Error applying preset:', error);
        }
    };

    const handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const width = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(offsetX / width);
        setPanelIndex(index);
    };

    return (
        <BlurView 
                tint="dark" intensity={30}
                style = {{
                    ...containers.violetLightC20,
                    padding:5,
                    height:280,
                    borderRadius:20,
                    overflow:'hidden',
                    ...ele.gnrborder,
                    }}>
            <Text style = {TitleInRoundView}>Control</Text>
            <View style = {{flexDirection:'row', height:100,flex:7}}>
                <View 
                    style = {{...containers.violetDarkC20,flex:2, overflow: 'hidden'}}
                    onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleScroll}
                        scrollEventThrottle={16}
                        style={{ flex: 1 }}
                    >
                        {/* Panel 1: HomeAlarmSetPanel */}
                        <View style={{ width: containerWidth }}>
                            <HomeAlarmSetPanel pass={pass}/>
                        </View>

                        {/* Panel 2: Sleep Timer Panel */}
                        <View style={{ width: containerWidth, justifyContent: 'center', alignItems: 'center' ,padding:20}}>
                            <Text style={{...textStyles.medium16,top:15,left:20,position:'absolute', opacity: pass.timerRunning ? pass.timerPulseOpacity : 1.0}}>Sleep Timer</Text>

                            {/* Inline timer picker that reflects remaining time */}
                            <View style={{ opacity: 1.0 }}>
                                <Picker
                                    selectedValue={pass.timerRunning ? Math.max(0, Math.ceil(pass.remainingSeconds / 60)) : pass.timerMinutes}
                                    style={{ width: 140, height: 30, color: 'white' , bottom:23}}
                                    itemStyle={{ color: 'white', height: 150 }}
                                    onValueChange={(itemValue) => {
                                        console.log('[Sleep Timer] User selected:', itemValue, 'minutes');
                                        if (itemValue === -1) {
                                            // User selected PERSIST: stop timer and reset fade
                                            pass.setTimerMinutes(-1);
                                            pass.stopTimer();
                                            console.log('[Sleep Timer] PERSIST mode selected');
                                        } else if (itemValue <= 0) {
                                            // User dragged to 0: stop timer and reset
                                            pass.setTimerMinutes(0);
                                            pass.stopTimer();
                                            console.log('[Sleep Timer] Timer stopped by user');
                                        } else {
                                            // User selected new minutes: update remaining time if running, or set for later start
                                            if (pass.timerRunning) {
                                                const newSeconds = itemValue * 60;
                                                pass.setRemainingSeconds(newSeconds);
                                                console.log('[Sleep Timer] Updated remaining time while running:', newSeconds, 'seconds');
                                            } else {
                                                pass.setTimerMinutes(itemValue);
                                                pass.startTimer(itemValue);
                                                console.log('[Sleep Timer] Timer started with:', itemValue, 'minutes');
                                            }
                                        }
                                    }}
                                >
                                    <Picker.Item key="persist" label="PERSIST" value={-1} />
                                    {Array.from({ length: 121 }, (_, i) => i).map((num) => (
                                        <Picker.Item key={num} label={`${num} min`} value={num} />
                                    ))}
                                </Picker>
                            </View>

                        </View>
                    </ScrollView>
                    
                    {/* Pagination Dots */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 5, position: 'absolute', bottom: 5, alignSelf: 'center' }}>
                        {[0, 1].map((index) => (
                            <View
                                key={index}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: panelIndex === index ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                                    marginHorizontal: 3,
                                }}
                            />
                        ))}
                    </View>
                </View>
                <TouchableOpacity 
                    style = {{...containers.violetDarkC20,flex:1, opacity: pass.activePresetId === null ? 1 : 0.6}}
                    onPress={() => pass.setLightAdjustVisible(true)}
                    activeOpacity={0.8}
                >
                    <LightIntensitySlider 
                        refreshTrigger={pass.brightnessRefreshTrigger} 
                        onManualChange={pass.clearActivePreset}
                        timerFadeDownAmount={pass.timerFadeDownAmount}
                        timerMinutes={pass.timerMinutes}
                    />
                </TouchableOpacity>                  
                <TouchableOpacity 
                    style = {{...containers.violetDarkC20,flex:1, opacity: pass.activePresetId === null ? 1 : 0.6}}
                    onPress={() => pass.setVolumeAdjustVisible(true)}
                    activeOpacity={0.8}
                >
                    <VolumeIntensitySlider 
                        refreshTrigger={pass.volumeRefreshTrigger} 
                        onManualChange={pass.clearActivePreset}
                        timerFadeDownAmount={pass.timerFadeDownAmount}
                        timerMinutes={pass.timerMinutes}
                        updateTimerSoundVolume={pass.updateTimerSoundVolume}
                    />
                </TouchableOpacity>                                             
            </View>
                <View style={{ ...containers.violetDarkC20, flex: 3, flexDirection: 'row' }}>
                <View style={{ ...containers.CenterAJ, flex: 1 }}>
                    <TouchableOpacity
                    style={{ ...containers.CenterAJ, flex: 1 }}
                    onPress={() => pass.navigation.navigate('Preset')}
                    activeOpacity={0.8}
                    >
                    <Text style={{ ...textStyles.medium16 }}>Presets</Text>
                    </TouchableOpacity>
                </View>

                {/* 右侧：动态预设按钮 + Add */}
                <View style={{ ...containers.CenterAJ, flex: 2 }}>
                    <View
                    style={{
                        alignItems: 'center',
                        flexDirection: 'row',
                        right: 5,
                    }}
                    >
                    {/* Display first 3 presets or empty state */}
                    {presets.length > 0 ? (
                        presets.slice(0, 3).map((preset) => (
                            <TouchableOpacity
                                key={preset.id}
                                onPress={() => applyPreset(preset)}
                                activeOpacity={0.9}
                                style={{
                                    opacity: pass.activePresetId === preset.id ? 1 : 0.5,
                                }}
                            >
                                <Image
                                    source={preset.cover}
                                    style={[
                                        containers.presetButton,
                                        pass.activePresetId === preset.id && {
                                            borderWidth: 2,
                                            borderColor: '#FFFFFF',
                                        },
                                    ]}
                                />
                            </TouchableOpacity>
                        ))
                    ) : (
                        // Fallback: show default preset covers if no presets loaded
                        <>
                            <TouchableOpacity activeOpacity={0.9}>
                                <Image
                                    source={require('../assets/general_images/preJade.png')}
                                    style={containers.presetButton}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.9}>
                                <Image
                                    source={require('../assets/general_images/preMist.png')}
                                    style={containers.presetButton}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.9}>
                                <Image
                                    source={require('../assets/general_images/preCloud.png')}
                                    style={containers.presetButton}
                                />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Add preset button - navigate to Preset screen */}
                    <TouchableOpacity
                        onPress={() => pass.navigation.navigate('Preset')}
                        activeOpacity={0.9}
                    >
                        <View
                        style={{
                            ...containers.presetButton,
                            backgroundColor: '#4E3692',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        >
                        <Image source={require('../assets/icons/plus.png')} />
                        </View>
                    </TouchableOpacity>
                    </View>
                </View>
            </View>
        </BlurView>
    )
}

const HomeAlarmSetPanel = ({pass}) => {
    const [bedtimeDisplay, setBedtimeDisplay] = useState('11:00 PM');
    const [wakeupDisplay, setWakeupDisplay] = useState('7:00 AM');

    // Helper function to convert 24-hour time to 12-hour format with AM/PM
    const formatTime12Hour = (timeStr) => {
        if (!timeStr) return '--:-- --';
        const [hourStr, minStr] = timeStr.split(':');
        const hour = parseInt(hourStr);
        const min = parseInt(minStr);
        
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'AM' : 'PM';
        const displayMin = String(min).padStart(2, '0');
        
        return `${displayHour}:${displayMin} ${period}`;
    };

    // Load active alarm config from AsyncStorage
    useEffect(() => {
        const loadActiveAlarm = async () => {
            try {
                const activeConfigStr = await AsyncStorage.getItem('activeAlarmConfig');
                if (activeConfigStr) {
                    const activeConfig = JSON.parse(activeConfigStr);
                    setBedtimeDisplay(formatTime12Hour(activeConfig.bedtime));
                    setWakeupDisplay(formatTime12Hour(activeConfig.wakeup_time));
                }
            } catch (error) {
                console.error('Error loading active alarm config in Home.js:', error);
            }
        };
        
        loadActiveAlarm();
        
        // Reload when screen comes into focus (when returning from AlarmSet screen)
        const unsubscribe = pass.navigation.addListener('focus', () => {
            loadActiveAlarm();
        });
        
        return unsubscribe;
    }, [pass.navigation]);

    return(
        <TouchableOpacity 
                style = {{flex:1}}
                onPress = {() => pass.navigation.navigate('HomeAlarmSet')}
                >
            <Text style = {{...textStyles.medium16,top:15,left:20,position:'absolute'}}>Alarm Set</Text>
            <View style={{top:42,left:24}}>
                <Icon12text11 addr = {require('../assets/icons/moonsleep.png')} text = {'Bedtime'}/>
                <Text style = {{...textStyles.semibold15,lineHeight:18}}>{bedtimeDisplay}</Text>
            </View>
            <View style={{top:42,left:24}}>
                <Icon12text11 addr = {require('../assets/icons/timer.png')} text = {'Wake up'}/>
                <Text style = {{...textStyles.semibold15,lineHeight:18}}>{wakeupDisplay}</Text>
            </View>
            
        </TouchableOpacity>
    )
}

const HomeFeedbackPanel = () => {
    return (
        <View style = {{
                ...containers.violetDarkC20, 
                backgroundColor:'rgba(96,68,175,0.4)',
                padding:5,
                marginTop:12,
                marginHorizontal:0,
                height: 110,
                ...ele.gnrborder,
                }}>
            <Text style = {TitleInRoundView}>Help & Feedback</Text>
            <View style = {{alignItems:'center',justifyContent:'space-around',flexDirection:'row',flex:1}}>
                <TouchableOpacity style = {{justifyContent:"center"}}>
                    <Image source = {require('../assets/icons/guides.png')} style = {ele.icon50}/>
                    <Text style = {{...textStyles.reg11,lineHeight:12,alignSelf:'center'}}>Guides</Text> 
                </TouchableOpacity>
                <TouchableOpacity style = {{justifyContent:"center"}}>
                    <Image source = {require('../assets/icons/faq.png')} style = {ele.icon50}/>
                    <Text style = {{...textStyles.reg11,lineHeight:12,alignSelf:'center'}}>FAQ</Text> 
                </TouchableOpacity>
                <TouchableOpacity style = {{justifyContent:"center"}}>
                    <Image source = {require('../assets/icons/more.png')} style = {ele.icon50}/>
                    <Text style = {{...textStyles.reg11,lineHeight:12,alignSelf:'center'}}>More</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const BlurSlideBG = () => {
  return (
    <View style = {{...StyleSheet.absoluteFill}}>
        <LinearGradient 
            colors={['rgba(140, 117, 241, 0.50)' , 'rgba(24, 15, 40, 0.50)', 'rgba(0, 0, 0, 0.50)']}
            locations={[0,0.3,1]}
            style = {{...StyleSheet.absoluteFill, borderRadius:20}}
            start={{x : 1, y : 0.2}}
            >
        </LinearGradient>
        <BlurView tint="dark" intensity={50} 
            style={{
            ...basicBlurC20,
            padding:15,
            ...ele.gnrborder,
            }}>
            </BlurView>
    </View>
  )
}

const TitleInRoundView = {
    ...textStyles.semibold15, fontSize:17,height:33,top:8,left:13
}

const basicBlurC20 = {
    ...StyleSheet.absoluteFill,
    overflow:'hidden',
    borderRadius:20,
}

const hp_style = {
    width: deviceWidth,
    height: deviceHeight,
    resizeMode: 'stretch',
    flex:1,
}

const productShot  = {
    alignSelf: 'center',
    top:-8,
    width:330,
    height:180,
    position:'relative',
}

const pillow_legacy ={
    alignSelf: 'center',
    top:-3,
    width:200,
    height:150,
    position:'relative',
    marginVertical:10,
}

export { HomeScreen }
