import React from 'react';
import { Image, ImageBackground, Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';

//Dragable view
import { useCallback, useMemo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { textStyles, colors } from '../styles';
import { deviceHeight, deviceWidth} from '../App.js'

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
                <ConfigSlide/>
            </View>
            

        </ImageBackground>
    </View>

    )
   
    
}

const ConfigSlide = () => {
    
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
        }}>

            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={["45%", "90%"]}
                onChange={handleSheetChanges}
                style = {{
                    backgroundColor:'rgba(0,0,0,0.5)'
                }}
                handleStyle = {{height:40,}}
                handleIndicatorStyle = {{
                    height:8,
                    width:54,
                    backgroundColor:'rgba(0, 0, 0, 0.6)',
                    borderRadius:4,

                }}
            >
                <BottomSheetView style={{
                    flex: 1,
                    padding: 36,
                    alignItems: 'center',
                    backgroundColor:'blue',
                }}>
                    <Text>Awesome 🎉</Text>
                </BottomSheetView>
            </BottomSheet>

        </GestureHandlerRootView>
    )
}

const HomeConfigMenu = ( { Ycord } ) => (
    <View 
        style = {{
            position:'absolute',
            top:Ycord,
            width:370,
            height:760,
            borderWidth:1,
            borderColor: colors.edge,
            borderRadius:20,
            alignSelf:'center',  

        }}
        
    >
        <BlurView tint="dark" intensity={50} 
            style={{
            ...basicBlurC20,
            //
            padding:15,
            }} >
            <TouchableOpacity style={{ //HolderBar for config menu
                width:53,
                height:8,
                borderRadius:4,
                backgroundColor:'rgba(255,255,255,0.8)',
                //Location
                position:'relative',
                alignSelf:'center',
                
            }}>

            </TouchableOpacity>
            <Text style={{
                ...textStyles.medium16,
                fontSize:10,
                //
                
                top:24,
                }}>Device</Text>
            <Text style={{
                ...textStyles.medium16,
                fontSize:20,
                //
                top:25,

            }}>
                Pillow Alarm
            </Text>
            <Image 
                source = {require('../assets/general_images/pillow_legacy.png')}
                style = {{
                    alignSelf: 'center',
                    width:220,
                    height:150,
                    top:120,
                    position:'absolute',
                }}
                />
            <BlurView style ={{
                ...basicBlurC20,
                height:200,
                margin:15,
                top:260
            }}>

            </BlurView>
        </BlurView>
    </View>
)

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
