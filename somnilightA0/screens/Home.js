import React from 'react';
import { Image, ImageBackground, Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';

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

let incord = 200

const HomeScreen = () => (
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
            <HomeConfigMenu Ycord={incord}/>
        </ImageBackground>
    </View>
    
)

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
        <BlurView tint="dark" intensity={50} style={{
            ...StyleSheet.absoluteFill,
            overflow:'hidden',
            borderRadius:20,
            }} >

        </BlurView>
    </View>
)

const hp_style = {
    width: deviceWidth,
    height: deviceHeight,
    resizeMode: 'stretch',
    flex:1,
}
export { HomeScreen }
