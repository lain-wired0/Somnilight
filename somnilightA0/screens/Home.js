import React, { useState, useEffect, useRef ,useCallback, useMemo} from 'react';
import { Image, ImageBackground, Text, View, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Switch, Button, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
    
    // Sleep Timer State
    const [timerModalVisible, setTimerModalVisible] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState(30); // Default 30 minutes
    const [timerRunning, setTimerRunning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const timerIntervalRef = useRef(null);
    
    // Timer countdown effect
    useEffect(() => {
        if (timerRunning && remainingSeconds > 0) {
            timerIntervalRef.current = setInterval(() => {
                setRemainingSeconds(prev => {
                    if (prev <= 1) {
                        setTimerRunning(false);
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
    
    const startTimer = (minutes) => {
        setRemainingSeconds(minutes * 60);
        setTimerRunning(true);
        setTimerModalVisible(false);
    };
    
    const stopTimer = () => {
        setTimerRunning(false);
        setRemainingSeconds(0);
    };
    
    const formatRemainingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

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
                    setTimerModalVisible,
                    stopTimer,
                    formatRemainingTime
                }}/>
            </View>
            
            {/* Light Adjust Modal */}
            <LightAdjustModal visible={lightAdjustVisible} onClose={() => setLightAdjustVisible(false)} />
            
            {/* Volume Adjust Modal */}
            <VolumeAdjustModal visible={volumeAdjustVisible} onClose={() => setVolumeAdjustVisible(false)} />
            
            {/* Sleep Timer Modal */}
            <TimerPickerModal 
                visible={timerModalVisible}
                onClose={() => setTimerModalVisible(false)}
                onConfirm={startTimer}
                initialMinutes={timerMinutes}
            />
            
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
const LightAdjustModal = ({ visible, onClose }) => {
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
                            <LightAdjust onClose={onClose} />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// Volume Adjust Modal Component
const VolumeAdjustModal = ({ visible, onClose }) => {
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
                            <VolumnAdjust onClose={onClose} />
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
    const [selectedPreset, setSelectedPreset] = useState('jade');
    const [panelIndex, setPanelIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const scrollViewRef = useRef(null);

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
                            <Text style={{...textStyles.medium16, color: 'white'}}>Sleep Timer</Text>
                            <TouchableOpacity 
                                style = {{
                                    alignItems:'center', 
                                    justifyContent:'center', 
                                    backgroundColor : pass.timerRunning ? 'rgba(121, 59, 196, 0.5)' : 'rgba(255,255,255,0.3)', 
                                    borderRadius:15,
                                    height:50,
                                    width:110,
                                    top:10
                                }}
                                onPress={() => {
                                    if (pass.timerRunning) {
                                        pass.stopTimer();
                                    } else {
                                        pass.setTimerModalVisible(true);
                                    }
                                }}
                                >
                                <Text style ={{...textStyles.medium16, color:'white', fontSize: 20, lineHeight:0 }}>
                                    {pass.timerRunning ? pass.formatRemainingTime(pass.remainingSeconds) : 'Start'}
                                </Text>
                            </TouchableOpacity>
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
                    style = {{...containers.violetDarkC20,flex:1}}
                    onPress={() => pass.setLightAdjustVisible(true)}
                    activeOpacity={0.8}
                >
                    <LightIntensitySlider />
                </TouchableOpacity>                  
                <TouchableOpacity 
                    style = {{...containers.violetDarkC20,flex:1}}
                    onPress={() => pass.setVolumeAdjustVisible(true)}
                    activeOpacity={0.8}
                >
                    <VolumeIntensitySlider />
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

                {/* 右侧：三个头像 + Add，仅在首页切换预设，不跳转 */}
                <View style={{ ...containers.CenterAJ, flex: 2 }}>
                    <View
                    style={{
                        alignItems: 'center',
                        flexDirection: 'row',
                        right: 5,
                    }}
                    >
                    {/* Jade */}
                    <TouchableOpacity
                        onPress={() => setSelectedPreset('jade')}
                        activeOpacity={0.9}
                    >
                        <Image
                        source={require('../assets/general_images/preJade.png')}
                        style={[
                            containers.presetButton,
                            selectedPreset === 'jade' && {
                            borderWidth: 2,
                            borderColor: '#FFFFFF',
                            },
                        ]}
                        />
                    </TouchableOpacity>

                    {/* Mist */}
                    <TouchableOpacity
                        onPress={() => setSelectedPreset('mist')}
                        activeOpacity={0.9}
                    >
                        <Image
                        source={require('../assets/general_images/preMist.png')}
                        style={[
                            containers.presetButton,
                            selectedPreset === 'mist' && {
                            borderWidth: 2,
                            borderColor: '#FFFFFF',
                            },
                        ]}
                        />
                    </TouchableOpacity>

                    {/* Cloud */}
                    <TouchableOpacity
                        onPress={() => setSelectedPreset('cloud')}
                        activeOpacity={0.9}
                    >
                        <Image
                        source={require('../assets/general_images/preCloud.png')}
                        style={[
                            containers.presetButton,
                            selectedPreset === 'cloud' && {
                            borderWidth: 2,
                            borderColor: '#FFFFFF',
                            },
                        ]}
                        />
                    </TouchableOpacity>

                    {/* 加号：这里我让它直接跳到 Preset 页面，也可以改成别的逻辑 */}
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
            <Text style = {{...textStyles.medium16,top:13,left:17}}>Alarm Set</Text>
            <View style={{top:20,left:24}}>
                <Icon12text11 addr = {require('../assets/icons/moonsleep.png')} text = {'Bedtime'}/>
                <Text style = {{...textStyles.semibold15,lineHeight:18}}>{bedtimeDisplay}</Text>
            </View>
            <View style={{top:25,left:24}}>
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

// Timer Picker Modal Component
const TimerPickerModal = ({ visible, onClose, onConfirm, initialMinutes = 30 }) => {
    if (!visible) return null;
    
    const [minutes, setMinutes] = useState(initialMinutes);
    
    const barWidth = 120;
    const padding = 20;
    const mainRadius = 40;
    const buttonRadius = 20;
    const bgcolor = '#0C112E';
    
    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{ ...containers.CenterAJ, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <TouchableWithoutFeedback>
                        <View
                            style={{
                                backgroundColor: bgcolor,
                                padding: padding,
                                borderRadius: mainRadius,
                                borderWidth: 1,
                                borderColor: '#353951'
                            }}
                        >
                            {/* Header */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <Image 
                                    source={require('../assets/icons/timer.png')} 
                                    style={{ height: 25, width: 25, marginRight: 8 }} 
                                />
                                <Text style={{ ...textStyles.semibold15, fontSize: 18, color: 'white', opacity: 0.5, lineHeight: 24 }}>
                                    Sleep Timer
                                </Text>
                            </View>
                            
                            {/* Picker */}
                            <View style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                                <Picker
                                    selectedValue={minutes}
                                    itemStyle={{ width: barWidth, color: 'white' }}
                                    onValueChange={(itemValue) => setMinutes(itemValue)}
                                >
                                    {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
                                        <Picker.Item key={num} label={String(num)} value={num} />
                                    ))}
                                </Picker>
                            </View>
                            
                            {/* SET Button */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    borderRadius: buttonRadius,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: 2 * buttonRadius,
                                    marginTop: 10
                                }}
                                onPress={() => onConfirm(minutes)}
                            >
                                <Text style={{ ...textStyles.medium16, color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: 'bold', top: 2 }}>
                                    SET
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export { HomeScreen }
