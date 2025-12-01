import React, { useState } from 'react';
import { Image, ImageBackground, Text, View, TouchableOpacity, StyleSheet, Switch, } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';

//Dragable view
import { useCallback, useMemo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

//Online Assets

//Local style
import { textStyles, colors } from '../styles';
import { deviceHeight, deviceWidth} from '../App.js'
import { LinearGradient } from 'expo-linear-gradient';


let user_name = 'Mushroom'

function getTodayDate() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var date = new Date();
  var year = date.getFullYear().toString();
  var month = monthNames[date.getMonth()]
  var day = date.getDate().toString();
  return (`${month} ${day}, ${year}`)
}

let incord = 480 //Top:60, Rest:480

const HomeScreen = () => {


    
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
                <HomeConfigSlide/>
            </View>
            

        </ImageBackground>
    </View>

    )
   
    
}

const HomeConfigSlide = () => {
    
    // BottomSheetView ref
    const bottomSheetRef = useRef(null);

    // callbacks
    const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
    }, []);

    const [isDeviceOn, setIsDeviceOn] = useState(false);
    const toggleSwitch = () => setIsDeviceOn(previousState => !previousState);

    return(
        <GestureHandlerRootView style={{
            flex: 1,
            marginLeft:15,
            marginRight:15,
            top:-15,
        }}>
            
            <BottomSheet
                ref={bottomSheetRef}
                
                snapPoints={["40%", "90%"]}
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
                    alignItems: 'center',
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

                    <Image //pillow
                        source = {require('../assets/general_images/pillow_legacy.png')}
                        style = {{
                            alignSelf: 'center',
                            width:220,
                            height:150,
                            top:75,
                            position:'absolute',
                        }}/>
                    
                        <Image //wifi_icon
                            source = {require('../assets/icons/wifi_act.png')}
                            style = {{
                                height:20,
                                width:20,
                                position:'absolute',
                                top:34,
                                left:142,
                            }}/>

                    <Switch 
                        trackColor = {{true: '#8068E9',false:'rgba(61, 43, 142, 1)'}}
                        thumbColor = {'rgba(255, 255, 255, 1)'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleSwitch}
                        value={isDeviceOn}
                        //location
                        style= {{
                            position:'absolute',
                            right:20,
                            top:25,

                        }}/>

                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
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
            borderWidth:1,
            borderColor: colors.edge
            }}>
            </BlurView>
    </View>
  )
}

const basicBlurC20 = {
    //Blur Effect
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
export { HomeScreen }
