import React, { useState } from 'react';
import { Image, ImageBackground, Text, View, TouchableOpacity, StyleSheet, Switch, } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

//react-navigation
import { createStaticNavigation, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

//Dragable view
import { useCallback, useMemo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

//Online Assets

//Local style
import { textStyles, colors, containers, ele } from '../styles';
import { deviceHeight, deviceWidth} from '../App.js'

//Local Navigation
import { Tabs } from '../App.js';
import { Stacks } from '../App.js';

//Local Screens
import { HomeAlarmSetScreen } from './HomeAlarmSet.js';
import LightAdjust from './LightAdjust.js';

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
            screenOptions={({route}) => ({headerShown: !(route.name === 'Home')})}
        >
            <Stacks.Screen name = "Home" component = { HomeScreen }/>
            <Stacks.Screen name = "HomeAlarmSet" component = { HomeAlarmSetScreen }/>
            <Stacks.Screen name = "LightAdjust" component={ LightAdjust }/>
        </Stacks.Navigator>
    )
}

const HomeScreen = (pass = {navigation, route}) => {
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
                <HomeConfigSlide pass = {pass}/>
            </View>
            

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
                handleStyle = {{height:20,}}
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

                    <View style = {{padding:30}}>
                        <Image //pillow
                            source = {require('../assets/general_images/pillow_legacy.png')}
                            style = {{
                                alignSelf: 'center',
                                width:220,
                                height:150,
                                position:'relative',
                            }}/>
                    </View>
                    <HomeControlPanel pass = {pass}/>
                    <HomeFeedbackPanel pass = {pass}/>        

                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
    )
}


const DeviceSwitch = ({location}) => {
    const [isDeviceOn, setIsDeviceOn] = useState(false);
    const toggleSwitch = () => 
        setIsDeviceOn(previousState => !previousState);
        setPower(isDeviceOn)
        

    return (
        <Switch 
            trackColor = {{true: '#8068E9',false:'rgba(61, 43, 142, 1)'}}
            thumbColor = {'rgba(255, 255, 255, 1)'}
            ios_backgroundColor = "#3e3e3e"
            onValueChange = {toggleSwitch}
            value = {isDeviceOn}
            style= {location}
            />
        
    )
}

async function setPower(isOn) {
    const res = await fetch('http://somnilight.online:1880/set_power',{
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
    isDevicePowerOn = data.power.on
}

const HomeControlPanel = ({pass}) => {
    const [selectedPreset, setSelectedPreset] = useState('jade');

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
                <View style = {{...containers.violetDarkC20,flex:2}}>

                    <TouchableOpacity 
                            style = {{flex:1}}
                            onPress = {() => pass.navigation.navigate('HomeAlarmSet')}
                            >
                        <Text style = {{...textStyles.medium16,top:13,left:17}}>Alarm Set</Text>
                        <View style={{top:20,left:24}}>
                            <Icon12text11 addr = {require('../assets/icons/moonsleep.png')} text = {'Bedtime'} tcolor={'rgba(116,119,135,1)'}/>
                            <Text style = {{...textStyles.semibold15,lineHeight:18}}>11:00 PM</Text>
                        </View>
                        <View style={{top:25,left:24}}>
                            <Icon12text11 addr = {require('../assets/icons/timer.png')} text = {'Wake up'} tcolor={'rgba(116,119,135,1)'}/>
                            <Text style = {{...textStyles.semibold15,lineHeight:18}}>17:00 AM</Text>
                        </View>
                        
                    </TouchableOpacity>

                </View>
                <View style = {{...containers.violetDarkC20,flex:1}}>
                    <TouchableOpacity style = {{flex:1}} 
                        onPress={() => pass.navigation.navigate('LightAdjust')}>

                    </TouchableOpacity>
                </View>                  
                <View style = {{...containers.violetDarkC20,flex:1}}>

                </View>                                             
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
    return(
        <TouchableOpacity 
                style = {{flex:1}}
                onPress = {() => pass.navigation.navigate('HomeAlarmSet')}
                >
            <Text style = {{...textStyles.medium16,top:13,left:17}}>Alarm Set</Text>
            <View style={{top:20,left:24}}>
                <Icon12text11 addr = {require('../assets/icons/moonsleep.png')} text = {'Bedtime'} tcolor={'rgba(116,119,135,1)'}/>
                <Text style = {{...textStyles.semibold15,lineHeight:18}}>11:00 PM</Text>
            </View>
            <View style={{top:25,left:24}}>
                <Icon12text11 addr = {require('../assets/icons/timer.png')} text = {'Wake up'} tcolor={'rgba(116,119,135,1)'}/>
                <Text style = {{...textStyles.semibold15,lineHeight:18}}>17:00 AM</Text>
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

let vart = '../assets/icons/moonsleep.png'

const Icon12text11 = ({addr,text,tcolor}) => {
    return (
        <View style={{flexDirection:'row',alignItems:'center'}}>
            <Image source={addr} style = {{height:12,width:12}}/>
            <Text style = {{...textStyles.reg11,color:tcolor,left:3}}>{text}</Text>
        </View>
    )
}

const hp_style = {
    width: deviceWidth,
    height: deviceHeight,
    resizeMode: 'stretch',
    flex:1,
}

export { HomeScreen }
