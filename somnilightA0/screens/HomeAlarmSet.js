import React , {useState, useEffect, useRef} from 'react';
import { 
    Image, ImageBackground,Text, View, StyleSheet, 
    TouchableOpacity, TouchableHighlight,
    TouchableWithoutFeedback, Alert,
    } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { deviceHeight, deviceWidth } from '../App';
import { colors, containers, Icon12text11, textStyles } from '../styles';
import CircularAlarmSetPanel from './CircularAlarmSetPanel';
import Svg, { Path } from 'react-native-svg';
import { syncAlarmToServerDebounced, flushPendingSync } from '../utils/ServerSync';
import { loadPresetsFromStorage } from '../utils/PresetStorage';

const PRESET_ICONS = {
    preJade: require('../assets/icons/preJade.png'),
    preCloud: require('../assets/icons/preCloud.png'),
    preMist: require('../assets/icons/preMist.png'),
};

const PRESET_ICONS_BY_NAME = {
    Morning_1: PRESET_ICONS.preJade,
    Morning_2: PRESET_ICONS.preCloud,
    Sleep: PRESET_ICONS.preMist,
};


//Main Function
export function HomeAlarmSetScreen({navigation}) {
    const [bedtimeHour, setBedtimeHour] = useState(23);
    const [bedtimeMin, setBedtimeMin] = useState(0);
    const bedtimeRef = React.useRef({ h: 23, m: 0 }); // Track latest bedtime
    const [sunriseHour, setSunriseHour] = useState(6);
    const [sunriseMin, setSunriseMin] = useState(30);
    const [wakeupHour, setWakeupHour] = useState(7);
    const [wakeupMin, setWakeupMin] = useState(0);
    
    // Load presets from PresetStorage (previously from presets.json)
    const [presetOptions, setPresetOptions] = useState([]);
    const [presetsLoaded, setPresetsLoaded] = useState(false);
    
    // Load presets on mount
    useEffect(() => {
        const loadPresetsFromLocalStorage = async () => {
            try {
                const storedPresets = await loadPresetsFromStorage();
                if (storedPresets && storedPresets.length > 0) {
                    // Convert stored presets to preset options format
                    // Map preset objects to { id, label } format
                    const options = storedPresets.map((preset) => ({
                        id: preset.id,
                        name: preset.label,
                        cover: preset.cover, // Optional: for future use
                    }));
                    setPresetOptions(options);
                    console.log('[HomeAlarmSet] Loaded', options.length, 'presets from storage');
                } else {
                    console.log('[HomeAlarmSet] No presets found in storage, using empty array');
                    setPresetOptions([]);
                }
                setPresetsLoaded(true);
            } catch (error) {
                console.error('[HomeAlarmSet] Error loading presets:', error);
                setPresetsLoaded(true);
            }
        };

        loadPresetsFromLocalStorage();
    }, []);

    const presetNames = presetOptions.map((p) => p.name);
    const initialPreset = presetNames[0] || 'Morning_1';
    const [presetId, setPresetId] = useState(initialPreset);
    const [activeDays, setActiveDays] = useState(["Mon","Tue","Wed","Thu","Fri"]);
    const [alarmName, setAlarmName] = useState('Healthy sleep');
    const [sunriseOffsetMin, setSunriseOffsetMin] = useState(30); // difference between wakeup and sunrise in minutes
    const sunriseOffsetRef = React.useRef(30); // Keep ref in sync with state
        const wakeupRef = React.useRef({ h: 7, m: 0 }); // Track latest wakeup time
    const [repeatIntervalMin, setRepeatIntervalMin] = useState(5); // 0 means never
    const shortSleepAlertShown = React.useRef(false); // Track if alert has been shown this session
    const [isDragging, setIsDragging] = useState(false); // Track if user is currently dragging handles
    const pendingShortSleepCheck = React.useRef(null); // Store pending short sleep check

    // Move alarm configs state to parent (HomeAlarmSetScreen) so it's shared
    // Store alarm configurations in state and AsyncStorage (local cache)
    // NOTE: AsyncStorage is a LOCAL CACHE LAYER. In the future, backend server 
    // integration will be added to sync these configs to the cloud.
    // Data flow: UI → State → AsyncStorage (cache) → [Future: Backend API]
    
    const defaultAlarmConfigs = {
        'Healthy sleep': {
            bedtime: '23:00',
            sunrise_time: '06:30',
            wakeup_time: '07:00',
            days: ['Mon','Tue','Wed','Thu','Fri'],
            preset_id: 'Morning_1',
            repeat_interval_min: 5,
        },
        'Quick nap': {
            bedtime: '14:00',
            sunrise_time: '15:30',
            wakeup_time: '16:00',
            days: ['Mon','Tue','Wed','Thu','Fri'],
            preset_id: 'Sleep',
            repeat_interval_min: 0,
        },
        'Weekend mode': {
            bedtime: '01:00',
            sunrise_time: '09:30',
            wakeup_time: '10:00',
            days: ['Sat','Sun'],
            preset_id: 'Morning_2',
            repeat_interval_min: 10,
        },
    };
    
    const [alarmConfigs, setAlarmConfigs] = useState(defaultAlarmConfigs);
    const [configsHydrated, setConfigsHydrated] = useState(false); // prevent overwriting storage before load
    const STORAGE_KEY = 'alarmConfigs';
    
    // Track the last saved state for revert functionality
    const [savedAlarmState, setSavedAlarmState] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Helper to format time as HH:MM
    const formatTimeString = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    // Computed alarm configuration object for server/local storage
    const alarmConfig = React.useMemo(() => ({
        name: alarmName,
        bedtime: formatTimeString(bedtimeHour, bedtimeMin),
        sunrise_time: formatTimeString(sunriseHour, sunriseMin),
        wakeup_time: formatTimeString(wakeupHour, wakeupMin),
        days: activeDays,
        preset_id: presetId,
        repeat_interval_min: repeatIntervalMin,
    }), [alarmName, bedtimeHour, bedtimeMin, sunriseHour, sunriseMin, wakeupHour, wakeupMin, activeDays, presetId, repeatIntervalMin]);

    // Log alarm config changes for debugging
    React.useEffect(() => {
        //console.log('Alarm Config:', JSON.stringify(alarmConfig, null, 2));
    }, [alarmConfig]);

    // Auto-save current alarm config to alarmConfigs when changes are made
    React.useEffect(() => {
        if (!configsHydrated) return; // wait until initial load completes
        
        // Check if there are unsaved changes
        if (savedAlarmState) {
            const hasChanges = JSON.stringify(alarmConfig) !== JSON.stringify(savedAlarmState);
            setHasUnsavedChanges(hasChanges);
            
            // Auto-save to alarmConfigs
            if (hasChanges) {
                const updatedConfigs = {...alarmConfigs};
                updatedConfigs[alarmName] = {
                    bedtime: alarmConfig.bedtime,
                    sunrise_time: alarmConfig.sunrise_time,
                    wakeup_time: alarmConfig.wakeup_time,
                    days: [...alarmConfig.days],
                    preset_id: alarmConfig.preset_id,
                    repeat_interval_min: alarmConfig.repeat_interval_min,
                };
                setAlarmConfigs(updatedConfigs);
            }
        }
    }, [alarmConfig, configsHydrated, savedAlarmState, alarmName]);

    // Save current active alarm config for Home screen display and sync to server (debounced)
    React.useEffect(() => {
        if (!configsHydrated) return; // wait until initial load completes
        const saveActiveConfig = async () => {
            try {
                await AsyncStorage.setItem('activeAlarmConfig', JSON.stringify(alarmConfig));
                
                // Sync active alarm to server with debouncing to reduce traffic
                // The debounce function will limit syncs to max once per SYNC_DEBOUNCE_INTERVAL
                const retrySync = () => {
                    syncAlarmToServerDebounced(alarmConfig, retrySync);
                };
                await syncAlarmToServerDebounced(alarmConfig, retrySync);
            } catch (error) {
                console.error('Error saving active alarm config:', error);
            }
        };
        saveActiveConfig();
    }, [alarmConfig, configsHydrated]);

    // Load alarm configs from AsyncStorage (local cache) on mount
    // TODO: On app startup, sync with backend server to get latest configs
    React.useEffect(() => {
        const loadAlarmConfigs = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setAlarmConfigs(parsed);
                    setConfigsHydrated(true);
                    console.log('Loaded alarm configs from local storage:', parsed);
                    
                    // Now load the last active alarm after configs are loaded
                    const lastActive = await AsyncStorage.getItem('lastActiveAlarmSet');
                    if (lastActive && parsed[lastActive]) {
                        loadAlarm(lastActive, parsed[lastActive]);
                    }
                } else {
                    // Save default configs if none exist
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAlarmConfigs));
                    setConfigsHydrated(true);
                    console.log('Saved default alarm configs to local storage');
                }
            } catch (error) {
                console.error('Error loading alarm configs from AsyncStorage:', error);
            }
        };
        
        loadAlarmConfigs();
    }, []);

    // Save alarmConfigs to AsyncStorage (local cache) whenever they change
    React.useEffect(() => {
        const saveAlarmConfigs = async () => {
            if (!configsHydrated) return; // avoid overwriting storage before initial load
            try {
                // Save to local AsyncStorage first
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarmConfigs));
                //console.log('Saved alarm configs to local storage');
                // Note: Server sync is done when active alarm changes (see activeAlarmConfig effect below)
            } catch (error) {
                console.error('Error saving alarm configs to AsyncStorage:', error);
            }
        };
        
        saveAlarmConfigs();
    }, [alarmConfigs, configsHydrated]);

    // Helper function to load alarm configuration
    const loadAlarm = (name, config) => {
        const parseBedtime = config.bedtime.split(':').map(Number);
        const parseSunrise = config.sunrise_time.split(':').map(Number);
        const parseWakeup = config.wakeup_time.split(':').map(Number);
        
        setAlarmName(name);
        setBedtimeHour(parseBedtime[0]);
        setBedtimeMin(parseBedtime[1]);
        setSunriseHour(parseSunrise[0]);
        setSunriseMin(parseSunrise[1]);
        setWakeupHour(parseWakeup[0]);
        setWakeupMin(parseWakeup[1]);
        setActiveDays(config.days);
        setPresetId(config.preset_id);
        setRepeatIntervalMin(config.repeat_interval_min);
        
        // Recalculate sunrise offset
        const wakeTotal = parseWakeup[0] * 60 + parseWakeup[1];
        const sunriseTotal = parseSunrise[0] * 60 + parseSunrise[1];
        const offset = ((wakeTotal - sunriseTotal + 1440) % 1440);
        setSunriseOffsetMin(offset);
        sunriseOffsetRef.current = offset;
        
        // Save the active alarm name for next app launch
        AsyncStorage.setItem('lastActiveAlarmSet', name).catch(err => 
            console.error('Error saving last active alarm:', err)
        );
        
        // Store this as the saved state for revert functionality
        const savedConfig = {
            name: name,
            bedtime: config.bedtime,
            sunrise_time: config.sunrise_time,
            wakeup_time: config.wakeup_time,
            days: [...config.days],
            preset_id: config.preset_id,
            repeat_interval_min: config.repeat_interval_min,
        };
        setSavedAlarmState(savedConfig);
        setHasUnsavedChanges(false);
        
        console.log('Loaded alarm configuration:', name, config);
    };

    // Load the last active alarm set from AsyncStorage on mount
    React.useEffect(() => {
        const loadLastActiveAlarm = async () => {
            try {
                const lastActive = await AsyncStorage.getItem('lastActiveAlarmSet');
                const allConfigs = await AsyncStorage.getItem(STORAGE_KEY);
                
                if (lastActive && allConfigs) {
                    const configs = JSON.parse(allConfigs);
                    const config = configs[lastActive];
                    
                    if (config) {
                        loadAlarm(lastActive, config);
                    }
                }
            } catch (error) {
                console.error('Error loading last active alarm:', error);
            }
        };
        
        loadLastActiveAlarm();
    }, []);

    // Sync ref with state
    React.useEffect(() => {
        sunriseOffsetRef.current = sunriseOffsetMin;
    }, [sunriseOffsetMin]);

    // Sync wakeup ref with state
    React.useEffect(() => {
        wakeupRef.current = { h: wakeupHour, m: wakeupMin };
    }, [wakeupHour, wakeupMin]);

    // Sync bedtime ref with state
    React.useEffect(() => {
        bedtimeRef.current = { h: bedtimeHour, m: bedtimeMin };
    }, [bedtimeHour, bedtimeMin]);

    // Flush any pending syncs when the user navigates away from this screen
    // Ensures the latest alarm config is always uploaded before the screen closes
    React.useEffect(() => {
        return () => {
            // This cleanup function runs when the component unmounts or when the effect dependencies change
            console.log('[Cleanup] Flushing pending alarm sync on screen exit');
            const retrySync = () => {
                // Retry logic if needed
            };
            flushPendingSync(retrySync);
        };
    }, []);

    // Revert handler - restores the last saved alarm configuration
    const handleRevert = () => {
        if (!savedAlarmState || !hasUnsavedChanges) return;
        
        Alert.alert(
            'Revert Changes',
            'Are you sure you want to discard all changes and restore the last saved settings?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Revert',
                    style: 'destructive',
                    onPress: () => {
                        loadAlarm(savedAlarmState.name, {
                            bedtime: savedAlarmState.bedtime,
                            sunrise_time: savedAlarmState.sunrise_time,
                            wakeup_time: savedAlarmState.wakeup_time,
                            days: savedAlarmState.days,
                            preset_id: savedAlarmState.preset_id,
                            repeat_interval_min: savedAlarmState.repeat_interval_min,
                        });
                        console.log('[Revert] Restored alarm to last saved state');
                    }
                }
            ]
        );
    };

    // Helper function to check if a time is between two times (handling midnight wrap)
    const isTimeBetween = (checkHour, checkMin, startHour, startMin, endHour, endMin) => {
        const checkTime = checkHour * 60 + checkMin;
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime <= endTime) {
            // Normal case: start and end are on same day (e.g., 06:00 to 07:00)
            return checkTime >= startTime && checkTime <= endTime;
        } else {
            // Midnight wrap case: start is PM, end is AM (e.g., 23:00 to 08:00)
            return checkTime >= startTime || checkTime <= endTime;
        }
    };

    const subtractMinutes = (hour, min, delta) => {
        const total = (hour * 60 + min - delta + 1440) % 1440;
        return { h: Math.floor(total / 60), m: total % 60 };
    };

    const addMinutes = (hour, min, delta) => {
        const total = (hour * 60 + min + delta + 1440) % 1440;
        return { h: Math.floor(total / 60), m: total % 60 };
    };

    const minutesDiff = (h1, m1, h2, m2) => {
        // difference from (h1:m1) to (h2:m2) in minutes, wrapping 24h
        return ((h2 * 60 + m2) - (h1 * 60 + m1) + 1440) % 1440;
    };
    
    const checkShortSleep = (bedH, bedM, wakeH, wakeM, isDraggingNow = false) => {
        // Don't check at all while user is dragging
        if (isDraggingNow) {
            // Just store the latest values for checking after drag ends
            pendingShortSleepCheck.current = { bedH, bedM, wakeH, wakeM };
            return;
        }
        
        const diff = minutesDiff(bedH, bedM, wakeH, wakeM);
        
        // Only alert for nighttime sleep (bedtime between 6 PM and 6 AM)
        // Ignore daytime naps (bedtime between 6 AM and 6 PM)
        const isNighttimeSleep = bedH >= 18 || bedH < 6;
        
        if (isNighttimeSleep && diff > 0 && diff < 240 && !shortSleepAlertShown.current) {
            shortSleepAlertShown.current = true;
            Alert.alert("You're working so hard... T.T", "We noticed that tonight you are sleeping for less than 4 hours... \nMay tomorrow bring you peace from the hustle and bustle.")
        }
    };
    
    // Check pending short sleep alert when user stops dragging
    React.useEffect(() => {
        if (!isDragging && pendingShortSleepCheck.current) {
            const { bedH, bedM, wakeH, wakeM } = pendingShortSleepCheck.current;
            const diff = minutesDiff(bedH, bedM, wakeH, wakeM);
            const isNighttimeSleep = bedH >= 18 || bedH < 6;
            
            if (isNighttimeSleep && diff > 0 && diff < 240 && !shortSleepAlertShown.current) {
                shortSleepAlertShown.current = true;
                Alert.alert("You're working so hard... T.T", "We noticed that tonight you are sleeping for less than 4 hours... \nMay tomorrow bring you peace from the hustle and bustle.")
            }
            pendingShortSleepCheck.current = null;
        }
    }, [isDragging]);  
    

    // Validate and constrain sunrise time
    const handleSunriseChange = (hour, min) => {
        const currentWakeup = wakeupRef.current;
        const currentBedtime = bedtimeRef.current;
        if (!isTimeBetween(hour, min, currentBedtime.h, currentBedtime.m, currentWakeup.h, currentWakeup.m)) {
            return; // Out of valid sleep window
        }
        
        const offset = minutesDiff(hour, min, currentWakeup.h, currentWakeup.m);
        
        // If offset exceeds 120 minutes, clamp sunrise to exactly 120 min before wakeup
        if (offset > 120) {
            const clamped = subtractMinutes(currentWakeup.h, currentWakeup.m, 120);
            setSunriseHour(clamped.h);
            setSunriseMin(clamped.m);
            setSunriseOffsetMin(120);
            sunriseOffsetRef.current = 120;
        } else {
            // Normal case: accept the dragged position
            setSunriseHour(hour);
            setSunriseMin(min);
            setSunriseOffsetMin(offset);
            sunriseOffsetRef.current = offset;
        }
    };

    const handleWakeupChange = (hour, min, isDraggingNow = false) => {
        const currentBedtime = bedtimeRef.current;

        // Desired offset is the existing offset but capped to 120
        let desiredOffset = sunriseOffsetRef.current;
        if (desiredOffset > 120) desiredOffset = 120;

        // Update wakeup immediately for downstream calculations
        wakeupRef.current = { h: hour, m: min };
        setWakeupHour(hour);
        setWakeupMin(min);

        // Total available window from bedtime (t0) to new wakeup (t1) going forward in time
        const totalWindow = minutesDiff(currentBedtime.h, currentBedtime.m, hour, min);
        // The offset cannot exceed either 120 minutes or the total window
        const finalOffset = Math.min(desiredOffset, Math.min(120, totalWindow));

        // Compute sunrise as (bedtime + (totalWindow - finalOffset)) so it is always after bedtime along the same arc
        const sunriseFromBed = totalWindow - finalOffset;
        let sunriseCandidate = addMinutes(currentBedtime.h, currentBedtime.m, sunriseFromBed);

        // Safety: ensure candidate lies on the bedtime -> wakeup arc
        if (!isTimeBetween(sunriseCandidate.h, sunriseCandidate.m, currentBedtime.h, currentBedtime.m, hour, min)) {
            sunriseCandidate = { h: currentBedtime.h, m: currentBedtime.m };
            const recalculatedOffset = minutesDiff(sunriseCandidate.h, sunriseCandidate.m, hour, min);
            const cappedOffset = Math.min(120, recalculatedOffset);
            setSunriseOffsetMin(cappedOffset);
            sunriseOffsetRef.current = cappedOffset;
        } else {
            setSunriseOffsetMin(finalOffset);
            sunriseOffsetRef.current = finalOffset;
        }

        setSunriseHour(sunriseCandidate.h);
        setSunriseMin(sunriseCandidate.m);

        checkShortSleep(currentBedtime.h, currentBedtime.m, hour, min, isDraggingNow);
    };

    const handleBedtimeChange = (hour, min, isDraggingNow = false) => {
        const currentWake = wakeupRef.current;

        // Update bedtime immediately for downstream calculations
        bedtimeRef.current = { h: hour, m: min };
        setBedtimeHour(hour);
        setBedtimeMin(min);

        // Recompute sunrise to ensure it stays after bedtime and within the 120-minute cap
        const totalWindow = minutesDiff(hour, min, currentWake.h, currentWake.m);
        const finalOffset = Math.min(sunriseOffsetRef.current, Math.min(120, totalWindow));

        const candidate = subtractMinutes(currentWake.h, currentWake.m, finalOffset);
        const withinWindow = isTimeBetween(candidate.h, candidate.m, hour, min, currentWake.h, currentWake.m);

        if (withinWindow) {
            setSunriseHour(candidate.h);
            setSunriseMin(candidate.m);
            setSunriseOffsetMin(finalOffset);
            sunriseOffsetRef.current = finalOffset;
        } else {
            // Fallback: place sunrise at bedtime and recalc offset capped at 120
            const recalculatedOffset = minutesDiff(hour, min, currentWake.h, currentWake.m);
            const capped = Math.min(120, recalculatedOffset);
            const fallback = subtractMinutes(currentWake.h, currentWake.m, capped);
            setSunriseHour(fallback.h);
            setSunriseMin(fallback.m);
            setSunriseOffsetMin(capped);
            sunriseOffsetRef.current = capped;
        }

        checkShortSleep(hour, min, currentWake.h, currentWake.m, isDraggingNow);
    };

    return (
        <View style = {{flex:1,backgroundColor:'rgba(9,0,31,1)',alignItems:'center'}}>
            <ImageBackground source={require('../assets/general_images/alarmSetBG.png')}
                style = {{height:240,width:394}} >

                    <CusHeader 
                        navigation={navigation} 
                        title={'Alarm Set'} 
                        previousPage={"Home"}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onRevert={handleRevert}
                    />
                    <View style={{marginTop:100, height:260,alignSelf:'stretch'}}>
                            <CircularAlarmSetPanel
                                bedtimeHour={bedtimeHour}
                                bedtimeMin={bedtimeMin}
                                sunriseHour={sunriseHour}
                                sunriseMin={sunriseMin}
                                wakeupHour={wakeupHour}
                                wakeupMin={wakeupMin}
                                onBedtimeChange={handleBedtimeChange}
                                onSunriseChange={handleSunriseChange}
                                onWakeupChange={handleWakeupChange}
                                onDraggingChange={setIsDragging}
                            />
                    </View>
                    <View style={{alignSelf:'stretch',padding:8,height:400}}>
                        
                        <DaySetPanel activeDays={activeDays} onDaysChange={setActiveDays} />

                        <View style = {{//TimeSetPanel
                                flex:1,
                                justifyContent:'space-between',
                                flexDirection:'row',
                                marginVertical:8,
                                }}>
                            <View style = {lstyles.timeSetCell}>
                                <TimeSetCell 
                                    addr = {require('../assets/icons/moonsleep.png')} 
                                    text = {'Bedtime'} 
                                    aniIn = {'fadeInLeft'}
                                    aniOut = {'fadeOutLeft'}
                                    hour = {bedtimeHour}
                                    min = {bedtimeMin}
                                    onTimeChange = {handleBedtimeChange}
                                    />
                            </View>
                            <View style = {lstyles.timeSetCell}>
                                <TimeSetCell 
                                    addr = {require('../assets/icons/sunrise.png')} 
                                    text = {'Sunrise'} 
                                    aniIn = {'fadeIn'}
                                    aniOut = {'fadeOut'}
                                    hour = {sunriseHour}
                                    min = {sunriseMin}
                                    onTimeChange = {handleSunriseChange}
                                    />
                            </View>
                            <View style = {lstyles.timeSetCell}>
                                <TimeSetCell 
                                    addr = {require('../assets/icons/timer.png')} 
                                    text = {'Wake up'} 
                                    aniIn = {'shake'}
                                    aniOut = {'fadeOutRight'}
                                    hour = {wakeupHour}
                                    min = {wakeupMin}
                                        onTimeChange = {handleWakeupChange}
                                    />
                            </View>
                        </View>

                        <View style = {{...RoundBlueContainer,alignSelf:'stretch'}}>
                            <AlarmNameCell
                                icon={require('../assets/icons/AlarmSetName.png')}
                                title={'Alarm Name'}
                                value={alarmName}
                                alarmConfig={alarmConfig}
                                alarmConfigs={alarmConfigs}
                                onAlarmConfigsChange={setAlarmConfigs}
                                onRename={(newName) => setAlarmName(newName)}
                                onLoadAlarm={loadAlarm}
                            />
                        </View>

                        <View style = {{...RoundBlueContainer,alignSelf:'stretch'}}>
                            <PresetCell 
                                baseIcon={require('../assets/icons/AlarmSetPreset.png')} 
                                title={'Preset'}
                                value={presetId || (presetOptions[0] || '')}
                                options={presetOptions}
                                onSelect={(val) => setPresetId(val)}
                                navigation={navigation}
                            />
                        </View>
                        <View style = {{...RoundBlueContainer,alignSelf:'stretch'}}>
                            <RepeatIntervalCell 
                                icon = {require('../assets/icons/AlarmSetInterval.png')} 
                                title = {'Repeat Interval'}
                                value = {repeatIntervalMin === 0 ? 'Never' : `${repeatIntervalMin} min`}
                                onSelect = {(val) => setRepeatIntervalMin(val)}
                            />
                        </View>
                    </View>
            </ImageBackground>
            
        </View>
    )
}


//Customized Header
function CusHeader({navigation, title, hasUnsavedChanges = false, onRevert}) {
    return(
        <View style = {{
                alignItems:'center',
                justifyContent:'center',
                position:'absolute',
                height:45,top:44,
                flexDirection:'row',
                left:10, right:10,
            }}>

            <TouchableOpacity 
                style = {{
                    ...containers.CenterAJ,
                    height:32,width:32,
                    borderRadius:12,
                    borderWidth:1,
                    borderColor: 'rgba(255,255,255,0.4)',
                    position:'absolute',
                    left:10
                }}
                onPress={() => navigation.pop()}>
                <Image source={require('../assets/icons/back.png')}
                    style = {{height:16,width:16,opacity:40,
                    }}
                    />
            </TouchableOpacity>

            <Text style = {{...textStyles.medium16, fontSize:20,marginTop:8}}>{title}</Text>

            <TouchableOpacity //RevertSettingButton : button for reverting alarmset changes
                style = {{
                    ...containers.CenterAJ,
                    height:32,width:32,
                    borderRadius:12,
                    borderWidth:1,
                    borderColor: 'rgba(255,255,255,0.4)',
                    position:'absolute',
                    right:10,
                    opacity: hasUnsavedChanges ? 1 : 0.5,
                }}
                onPress={onRevert}
                disabled={!hasUnsavedChanges}
                >
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                    <Path d="M4 7.19995H11.6C13.5882 7.19995 15.2 8.81171 15.2 10.8C15.2 12.7882 13.5882 14.4 11.6 14.4H4" stroke="white" strokeWidth={1.5} />
                    <Path d="M7.2 10.4L4 7.2L7.2 4" stroke="white" strokeWidth={1.5} />
                </Svg>
            </TouchableOpacity>

        </View>
    )
}

//Day setActive panel
const DaySetPanel = ({ activeDays = [], onDaysChange }) => {
    const dayMap = [
        { short: 'Mo', full: 'Mon' },
        { short: 'Tu', full: 'Tue' },
        { short: 'We', full: 'Wed' },
        { short: 'Th', full: 'Thu' },
        { short: 'Fi', full: 'Fri' },
        { short: 'Sa', full: 'Sat' },
        { short: 'Su', full: 'Sun' },
    ];

    const handleDayToggle = (fullDay) => {
        if (!onDaysChange) return;
        const isActive = activeDays.includes(fullDay);
        if (isActive) {
            onDaysChange(activeDays.filter(d => d !== fullDay));
        } else {
            onDaysChange([...activeDays, fullDay]);
        }
    };

    return (
        <View style = {{
                ...RoundBlueContainer,
                flex:1,
                alignSelf:'stretch'
                }}>
            <View style = {{flexDirection:'row',justifyContent:'space-evenly', alignItems:'center'}}>
                {dayMap.map(({ short, full }) => (
                    <DaySetCell
                        key={full}
                        DoW={short}
                        isActive={activeDays.includes(full)}
                        onToggle={() => handleDayToggle(full)}
                    />
                ))}
            </View>
        </View>
    );
};

const DaySetCell = ({DoW, isActive = false, onToggle}) => {
    return (
        <TouchableHighlight
            style = {{
                height:38, width:38,
                borderRadius:12,
                borderWidth:1,
                borderColor: isActive ? '#793BC4' : 'rgba(255,255,255,0.2)',
                alignItems:'center',
                justifyContent:'center',
            }}
            onPress={onToggle}
        >
            <Text style={textStyles.reg11}>{DoW}</Text>
        </TouchableHighlight>
    )
}



//Time picker Panels (Bedtime/Sunrise/WakeUp) 
const TimeSetCell = ({addr, text, aniIn, aniOut, hour = 11, min = 0, onTimeChange}) => {
    const [modalVisible, setModalVisible] = useState(false);

    const formatTime = (h, m) => {
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const period = h === 0 || h < 12 ? 'AM' : 'PM';
        const displayMin = String(m).padStart(2, '0');
        return `${displayHour}:${displayMin} ${period}`;
    };

    const handleTimeConfirm = (newHour, newMin) => {
        if (onTimeChange) {
            onTimeChange(newHour, newMin);
        }
        setModalVisible(false);
    };

    return (
        <TouchableOpacity style = {{left:15}}
            onPress={() => {
                setModalVisible(true);
            }}
        >
            <Icon12text11 addr = {addr} text = {text}/>
            <Text style = {{...textStyles.semibold15, lineHeight:18}}>{formatTime(hour, min)}</Text>
            <Modal
                
                animationIn={aniIn}
                animationOut={aniOut}
                transparent={true}
                isVisible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                >

                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View style = {{...containers.CenterAJ, backgroundColor:'transparant' }}>
                            <TouchableWithoutFeedback>
                            <View>
                                <PickTimePanel 
                                        onClose = {(h, m) => {
                                            handleTimeConfirm(h, m);
                                        }}
                                        initialHour={hour}
                                        initialMin={min}
                                        iconAddr={addr}
                                        title={text}
                                    />
            
                            </View>
                        
                        </TouchableWithoutFeedback>
                    </View>
                    </TouchableWithoutFeedback>
                
            </Modal>
        </TouchableOpacity>
    )
}

const PickTimePanel = ({onClose, initialHour = 0, initialMin = 0, iconAddr, title}) => {
  // Adjustable sizing for icon and title
  const iconSize = 25;
  const titleFontSize = 18;
  
  const barWidth = 100
  const padding = 20
  const mainRadius = 40
  const buttonRadius = 20
  const bgcolor = '#0C112E'
  const [Hour, setHour] = useState(initialHour)
  const [Min, setMin] = useState(initialMin)
  
  // Sync local state with props when they change
  useEffect(() => {
    setHour(initialHour);
    setMin(initialMin);
  }, [initialHour, initialMin]);
  
  return (
    <View style = {{
            backgroundColor:bgcolor,
            padding:padding,
            borderRadius:mainRadius,
            borderWidth:1,
            borderColor:'#353951'
            }}>
        {/* Header with icon and title - adjust iconSize and titleFontSize above */}
        {iconAddr && title && (
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom:16}}>
            <Image source={iconAddr} style={{height:iconSize, width:iconSize, marginRight:8}}/>
            <Text style={{...textStyles.semibold15, fontSize:titleFontSize, color:'white',opacity:0.5,lineHeight:24}}>{title}</Text>
          </View>
        )}
        
        <View style = {{alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
          <Picker //Hour
            selectedValue={Hour}
            itemStyle={{width:barWidth,color:'white'}}
            onValueChange={(itemValue, itemIndex) =>
              {
                setHour(itemValue);
              }
            }
            >
            <Picker.Item label="13" value={13} />
            <Picker.Item label="14" value={14} />
            <Picker.Item label="15" value={15} />
            <Picker.Item label="16" value={16} />
            <Picker.Item label="17" value={17} />
            <Picker.Item label="18" value={18} />
            <Picker.Item label="19" value={19} />
            <Picker.Item label="20" value={20} />
            <Picker.Item label="21" value={21} />
            <Picker.Item label="22" value={22} />
            <Picker.Item label="23" value={23} />
            <Picker.Item label="00" value={0} />
            <Picker.Item label="01" value={1} />
            <Picker.Item label="02" value={2} />
            <Picker.Item label="03" value={3} />
            <Picker.Item label="04" value={4} />
            <Picker.Item label="05" value={5} />
            <Picker.Item label="06" value={6} />
            <Picker.Item label="07" value={7} />
            <Picker.Item label="08" value={8} />
            <Picker.Item label="09" value={9} />
            <Picker.Item label="10" value={10} />
            <Picker.Item label="11" value={11} />
            <Picker.Item label="12" value={12} />

          </Picker>
          <Picker //Min
            selectedValue={Min}
            itemStyle={{width:barWidth,color:'white'}}
            onValueChange={(itemValue, itemIndex) =>
              setMin(itemValue)
            }
            >
              
            <Picker.Item label="00" value={0} />
            <Picker.Item label="05" value={5} />
            <Picker.Item label="10" value={10} />
            <Picker.Item label="15" value={15} />
            <Picker.Item label="20" value={20} />
            <Picker.Item label="25" value={25} />
            <Picker.Item label="30" value={30} />
            <Picker.Item label="35" value={35} />
            <Picker.Item label="40" value={40} />
            <Picker.Item label="45" value={45} />
            <Picker.Item label="50" value={50} />
            <Picker.Item label="55" value={55} />


          </Picker>
        </View>

        <TouchableOpacity 
            style = {{
                backgroundColor:'rgba(255,255,255,0.15)',
                borderRadius:buttonRadius,
                justifyContent:'center',
                alignItems:'center',
                height: 2 * buttonRadius,
            }}
            onPress={() => onClose(Hour, Min)}
            >
            <Text style = {{...textStyles.medium16, color:'rgba(255,255,255,0.7)',fontSize:18,fontWeight:'bold',top:2,}}>SET</Text>
        </TouchableOpacity> 

    </View>
  )
}


//Alarm preset picker (Alarm Name)
const AlarmNameCell = ({icon, title, value, alarmConfig, alarmConfigs, onAlarmConfigsChange, onRename, onLoadAlarm}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAlarm, setSelectedAlarm] = useState(value);
    
    // Use parent's alarm configs instead of local state
    // This ensures we always read the single source of truth
    
    // Get list of alarm names from configurations
    const savedAlarms = Object.keys(alarmConfigs);

    const handleDelete = () => {
        if (savedAlarms.length <= 1) {
            Alert.alert('Cannot Delete', 'You must have at least one alarm set.');
            return;
        }
        Alert.alert(
            'Delete Alarm',
            `Are you sure you want to delete "${selectedAlarm}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        console.log('Deleting alarm:', selectedAlarm);
                        const updatedConfigs = {...alarmConfigs};
                        delete updatedConfigs[selectedAlarm];
                            onAlarmConfigsChange(updatedConfigs); // Auto-syncs to local storage via useEffect in parent
                        const remainingAlarms = Object.keys(updatedConfigs);
                        setSelectedAlarm(remainingAlarms[0]);
                        // TODO: DELETE to backend API endpoint
                    }
                }
            ]
        );
    };

    const handleRename = () => {
        Alert.prompt(
            'Rename Alarm',
            'Enter new name:',
            (text) => {
                if (text && text.trim() && text !== selectedAlarm) {
                    const newName = text.trim();
                    if (savedAlarms.includes(newName)) {
                        Alert.alert('Error', 'An alarm with this name already exists.');
                        return;
                    }
                    const updatedConfigs = {...alarmConfigs};
                    updatedConfigs[newName] = updatedConfigs[selectedAlarm];
                    delete updatedConfigs[selectedAlarm];
                    onAlarmConfigsChange(updatedConfigs);
                    setSelectedAlarm(newName);
                    onRename(newName);
                    console.log('Renamed alarm to:', newName);
                }
            },
            'plain-text',
            selectedAlarm
        );
    };

    const handleNew = () => {
        Alert.prompt(
            'New Alarm',
            'Enter name for new alarm:',
            (text) => {
                if (text && text.trim()) {
                    const newName = text.trim();
                    if (savedAlarms.includes(newName)) {
                        Alert.alert('Error', 'An alarm with this name already exists.');
                        return;
                    }
                    
                    // Create new alarm with current config
                    const updatedConfigs = {...alarmConfigs};
                    updatedConfigs[newName] = {
                        bedtime: alarmConfig.bedtime,
                        sunrise_time: alarmConfig.sunrise_time,
                        wakeup_time: alarmConfig.wakeup_time,
                        days: [...alarmConfig.days],
                        preset_id: alarmConfig.preset_id,
                        repeat_interval_min: alarmConfig.repeat_interval_min,
                    };
                        onAlarmConfigsChange(updatedConfigs); // Auto-syncs to local storage via useEffect in parent
                    setSelectedAlarm(newName);
                    onRename(newName);
                    console.log('Created new alarm:', newName);
                    // TODO: POST to backend API to create new alarm
                }
            },
            'plain-text',
            'New Alarm'
        );
    };

    const handleSet = () => {
        console.log('Loading alarm set:', selectedAlarm);
        const savedConfig = alarmConfigs[selectedAlarm];
        
        if (savedConfig && onLoadAlarm) {
            console.log('Restoring config:', savedConfig);
            onLoadAlarm(selectedAlarm, savedConfig);
            //Alert.alert('Loaded', `"${selectedAlarm}" settings have been loaded.`);
        } else {
            Alert.alert('Error', 'No saved configuration found for this alarm.');
        }
        setModalVisible(false);
    };

    useEffect(() => {
        setSelectedAlarm(value);
    }, [value]);

    return (
        <TouchableOpacity style = {{padding:10,flexDirection: 'row',justifyContent:'flex-start'}} onPress={() => setModalVisible(true)}>
            <View style = {{...containers.CenterAJ, flex:1}}>
                <OtherSetCellIcon src = {icon}/>
            </View>
            <View style = {{left:10, justifyContent:'center', flex:5}}>
                <Text style = {{...textStyles.reg11,opacity:0.5}}>{title}</Text>
                <Text style = {{...textStyles.medium16,lineHeight:18}}>{value}</Text>
            </View>
            <View style = {{...containers.CenterAJ, flex: 0.5}}>
                <Image source={require('../assets/icons/arrow-right.png')} style={{height:16,width:16}} />
            </View>

            <Modal
                isVisible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
                animationIn={'fadeInUp'}
                animationOut={'fadeOutDown'}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style = {{...containers.CenterAJ, backgroundColor:'rgba(0,0,0,0.4)'}}>
                        <TouchableWithoutFeedback>
                            <View style={{
                                backgroundColor:'#0C112E',
                                padding:20,
                                borderRadius:40,
                                borderWidth:1,
                                borderColor:'#353951',
                                width:320
                            }}>
                                <Text style={{...textStyles.semibold15, fontSize:14, color:'white', textAlign:'center', marginBottom:16}}>Select Alarm Set</Text>
                                
                                {/* Picker with Delete and Rename buttons */}
                                <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom:20}}>
                                    {/* Delete button */}
                                    <TouchableOpacity 
                                        onPress={handleDelete}
                                        style={{
                                            width:40,
                                            height:40,
                                            borderRadius:12,
                                            backgroundColor:'rgba(255,50,50,0.2)',
                                            alignItems:'center',
                                            justifyContent:'center',
                                            marginRight:10
                                        }}
                                    >
                                        <Text style={{fontSize:20, color:'#FF6B6B'}}>🗑️</Text>
                                    </TouchableOpacity>

                                    {/* Picker */}
                                    <View style={{flex:1}}>
                                        <Picker
                                            selectedValue={selectedAlarm}
                                            itemStyle={{width:180,color:'white'}}
                                            onValueChange={(itemValue) => setSelectedAlarm(itemValue)}
                                        >
                                            {savedAlarms.map((alarm) => (
                                                <Picker.Item key={alarm} label={alarm} value={alarm} />
                                            ))}
                                        </Picker>
                                    </View>

                                    {/* Rename button */}
                                    <TouchableOpacity 
                                        onPress={handleRename}
                                        style={{
                                            width:40,
                                            height:40,
                                            borderRadius:12,
                                            backgroundColor:'rgba(255,255,255,0.15)',
                                            alignItems:'center',
                                            justifyContent:'center',
                                            marginLeft:10
                                        }}
                                    >
                                        <Text style={{fontSize:18, color:'white'}}>✏️</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Action Buttons Row */}
                                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                                    <TouchableOpacity
                                        style={{
                                            flex:1,
                                            backgroundColor:'rgba(255,255,255,0.15)',
                                            borderRadius:20,
                                            paddingVertical:12,
                                            marginRight:5
                                        }}
                                        onPress={handleNew}
                                    >
                                        <Text style={{...textStyles.medium16, color:'white', textAlign:'center', fontWeight:'bold', fontSize:14}}>NEW</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            flex:1,
                                            backgroundColor:'#7A5AF8',
                                            borderRadius:20,
                                            paddingVertical:12,
                                            marginLeft:5
                                        }}
                                        onPress={handleSet}
                                    >
                                        <Text style={{...textStyles.medium16, color:'white', textAlign:'center', fontWeight:'bold', fontSize:14}}>LOAD</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </TouchableOpacity>
    );
};


//PresetPicker
const PresetPickerPanel = ({ onClose, options = [], initialValue = '', navigation }) => {
    const titleFontSize = 14;
    const barWidth = 200;
    const padding = 20;
    const mainRadius = 40;
    const buttonRadius = 20;
    const bgcolor = '#0C112E';
    const optionNames = Array.isArray(options)
        ? options
            .map((item) => (typeof item === 'string' ? item : item?.name))
            .filter(Boolean)
        : [];
    const hasOptions = optionNames.length > 0;
    const fallbackLabel = 'No presets';
    const initialSafeValue = hasOptions
        ? (optionNames.includes(initialValue) ? initialValue : optionNames[0])
        : fallbackLabel;
    const [val, setVal] = useState(initialSafeValue);

    useEffect(() => {
        const names = Array.isArray(options)
            ? options
                .map((item) => (typeof item === 'string' ? item : item?.name))
                .filter(Boolean)
            : [];
        const nextHasOptions = names.length > 0;
        if (!nextHasOptions) {
            setVal(fallbackLabel);
            return;
        }
        const nextValue = names.includes(initialValue) ? initialValue : names[0];
        setVal(nextValue);
    }, [initialValue, options]);

    const renderOptions = hasOptions ? optionNames : [fallbackLabel];

    return (
        <View style = {{
                        backgroundColor:bgcolor,
                        padding:padding,
                        borderRadius:mainRadius,
                        borderWidth:1,
                        borderColor:'#353951'
                        }}>
                <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom:16}}>
                    <Text style={{...textStyles.semibold15, fontSize:titleFontSize, color:'white', flex:1, textAlign:'center', paddingLeft:32}}>Select Preset</Text>
                    {navigation && (
                        <TouchableOpacity
                            style={{
                                width:32,
                                height:32,
                                borderRadius:16,
                                backgroundColor:'rgba(255,255,255,0.1)',
                                justifyContent:'center',
                                alignItems:'center',
                            }}
                            onPress={() => {
                                navigation.navigate('Preset');
                                onClose(val);
                            }}
                        >
                            <Ionicons name="create" size={18} color="#7A5AF8" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style = {{alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                    <Picker
                        selectedValue={val}
                        itemStyle={{width:barWidth,color:'white'}}
                        onValueChange={(itemValue) => {
                                setVal(itemValue);
                        }}
                        enabled={hasOptions}
                    >
                        {renderOptions.map((preset) => (
                            <Picker.Item key={preset} label={preset} value={preset} />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity 
                        style = {{
                                backgroundColor:'rgba(255,255,255,0.15)',
                                borderRadius:buttonRadius,
                                justifyContent:'center',
                                alignItems:'center',
                                height: 2 * buttonRadius,
                        }}
                        onPress={() => onClose(val)}
                        >
                        <Text style = {{...textStyles.medium16, color:'rgba(255,255,255,0.7)',fontSize:18,fontWeight:'bold',top:2,}}>SET</Text>
                </TouchableOpacity> 

        </View>
    )
}

const PresetCell = ({baseIcon, title, value, options = [], onSelect, navigation}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const optionNames = Array.isArray(options)
        ? options
            .map((item) => (typeof item === 'string' ? item : item?.name))
            .filter(Boolean)
        : [];
    const hasOptions = optionNames.length > 0;
    const displayValue = hasOptions ? (value || optionNames[0]) : 'No presets';

    // Get cover image for selected preset
    const selectedIcon = (() => {
        if (!value) return baseIcon;
        // Try to find preset by name in options and get its cover image
        if (Array.isArray(options)) {
            const match = options.find((item) => {
                const itemName = typeof item === 'string' ? item : item?.name;
                return itemName === value;
            });
            // Return the cover image if found
            if (match && match.cover) {
                return match.cover;
            }
        }
        // Fallback to base icon
        return baseIcon;
    })();

    const cellIcon = selectedIcon;

    return (
        <TouchableOpacity style = {{padding:10,flexDirection: 'row',justifyContent:'flex-start'}} onPress={() => hasOptions && setModalVisible(true)} disabled={!hasOptions}>
            <View style = {{...containers.CenterAJ, flex:1}}>
                <OtherSetCellIcon src = {cellIcon}/>
            </View>
            <View style = {{left:10, justifyContent:'center', flex:5}}>
                <Text style = {{...textStyles.reg11,opacity:0.5}}>{title}</Text>
                <Text style = {{...textStyles.medium16,lineHeight:18, opacity: hasOptions ? 1 : 0.5}}>{displayValue}</Text>
            </View>
            <View style = {{...containers.CenterAJ, flex: 0.5}}>
                <Image source={require('../assets/icons/arrow-right.png')} style={{height:16,width:16, opacity: hasOptions ? 1 : 0.4}} />
            </View>

            <Modal
                isVisible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
                animationIn={'fadeInUp'}
                animationOut={'fadeOutDown'}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style = {{...containers.CenterAJ, backgroundColor:'rgba(0,0,0,0.4)'}}>
                        <TouchableWithoutFeedback>
                            <View>
                                <PresetPickerPanel
                                    options={options}
                                    initialValue={value}
                                    navigation={navigation}
                                    onClose={(val) => {
                                        if (onSelect) onSelect(val);
                                        setModalVisible(false);
                                    }}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </TouchableOpacity>
    );
};


//RepeatInterval
const RepeatIntervalPanel = ({ onClose, initialValue = 0 }) => {
    const titleFontSize = 14;
    const barWidth = 120;
    const padding = 20;
    const mainRadius = 40;
    const buttonRadius = 20;
    const bgcolor = '#0C112E';
    const [val, setVal] = useState(initialValue);

    useEffect(() => {
        setVal(initialValue);
    }, [initialValue]);

    return (
        <View style = {{
                        backgroundColor:bgcolor,
                        padding:padding,
                        borderRadius:mainRadius,
                        borderWidth:1,
                        borderColor:'#353951'
                        }}>
                {/* Adjust titleFontSize above to tweak header text size */}
                <View style={{alignItems:'center', justifyContent:'center', marginBottom:16}}>
                    <Text style={{...textStyles.semibold15, fontSize:titleFontSize, color:'white'}}>Repeat Interval</Text>
                </View>

                <View style = {{alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
                    <Picker
                        selectedValue={val}
                        itemStyle={{width:barWidth,color:'white'}}
                        onValueChange={(itemValue) => {
                                setVal(itemValue);
                        }}
                    >
                        <Picker.Item label="Never" value={0} />
                        {Array.from({length:60}, (_, idx) => idx + 1).map(n => (
                                <Picker.Item key={n} label={`${n}`} value={n} />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity 
                        style = {{
                                backgroundColor:'rgba(255,255,255,0.15)',
                                borderRadius:buttonRadius,
                                justifyContent:'center',
                                alignItems:'center',
                                height: 2 * buttonRadius,
                        }}
                        onPress={() => onClose(val)}
                        >
                        <Text style = {{...textStyles.medium16, color:'rgba(255,255,255,0.7)',fontSize:18,fontWeight:'bold',top:2,}}>SET</Text>
                </TouchableOpacity> 

        </View>
    )
}

const RepeatIntervalCell = ({icon, title, value, onSelect}) => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <TouchableOpacity style = {{padding:10,flexDirection: 'row',justifyContent:'flex-start'}} onPress={() => setModalVisible(true)}>
            <View style = {{...containers.CenterAJ, flex:1}}>
                {/* Adjust icon size in OtherSetCellIcon if you want a different size */}
                <OtherSetCellIcon src = {icon}/>
            </View>
            <View style = {{left:10, justifyContent:'center', flex:5}}>
                {/* Adjust text styles here if you want different sizes or weights */}
                <Text style = {{...textStyles.reg11,opacity:0.5}}>{title}</Text>
                <Text style = {{...textStyles.medium16,lineHeight:18}}>{value}</Text>
            </View>
            <View style = {{...containers.CenterAJ, flex: 0.5}}>
                <Image source={require('../assets/icons/arrow-right.png')} style={{height:16,width:16}} />
            </View>

            <Modal
                isVisible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
                animationIn={'fadeInUp'}
                animationOut={'fadeOutDown'}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style = {{...containers.CenterAJ, backgroundColor:'rgba(0,0,0,0.4)'}}>
                        <TouchableWithoutFeedback>
                            <View>
                                <RepeatIntervalPanel
                                    initialValue={value === 'Never' ? 0 : parseInt(value)}
                                    onClose={(val) => {
                                        onSelect(val);
                                        setModalVisible(false);
                                    }}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </TouchableOpacity>
    );
};


//legacy
const OtherSetCell = ({icon, title, value}) => {
    const src = icon;
    return (
        <TouchableOpacity style = {{padding:10,flexDirection: 'row',justifyContent:'flex-start'}}>
            <View style = {{...containers.CenterAJ, flex:1}}>
                <OtherSetCellIcon src = {src}/>
            </View>
            <View style = {{left:10, justifyContent:'center', flex:5}}>
                <Text style = {{...textStyles.reg11,opacity:0.5}}>{title}</Text>
                <Text style = {{...textStyles.medium16,lineHeight:18}}>{value}</Text>
            </View>
            <View style = {{...containers.CenterAJ, flex: 0.5}}>
                <Image source={require('../assets/icons/arrow-right.png')} style={{height:16,width:16}} />
            </View>
        </TouchableOpacity>
    )
}

const OtherSetCellIcon = ({src}) => {
    const size = 40
    const corner = 8
    return(
    <View style = {{
        height:size,width:size,
        borderRadius:corner,
        borderWidth:1,
        borderColor:'#4E5166',
        alignItems:'center',
        justifyContent:'center',
    }}>
        <Image source={src} style={{height:size,width:size,borderRadius:corner}}/>
    </View>
    )
}


//local styles
const RoundBlueContainer = StyleSheet.create({
    flex:1,
    backgroundColor:'#0C112E',
    borderRadius:16,
    justifyContent: 'center',
    margin:8,
    borderWidth:0.5,
    borderColor:"#222754"
})

const lstyles = StyleSheet.create ({
    timeSetCell:{
        ...RoundBlueContainer,marginVertical:0,alignSelf:'stretch'
    },
})


