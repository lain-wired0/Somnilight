//Fundamentals
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';

//react-navigation
import { createStaticNavigation, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

//Online Assets

//Local Assets
import { colors, textStyles } from './styles';
import { iconStyles } from './styles';

//Screens [.js]
import { HomeScreen, HomeStack } from './screens/Home';
import { StatsScreen } from './screens/Stats';
import { MyinfoScreen } from './screens/Myinfo';
import { HoverEffect } from 'react-native-gesture-handler';
import PresetScreen from './screens/Preset';
import { HomeAlarmSetScreen } from './screens/HomeAlarmSet';

const Tabs = createBottomTabNavigator();
const Stacks = createStackNavigator();

export { Tabs, Stacks } 


//[Temporary] TabIconColor 
let InactiveColor = '#908EA7'
let ActiveColor = '#ffffffff'



export default function App() {
  return (
    <NavigationContainer>
      <Stacks.Navigator screenOptions={{headerShown:false}}>
         <Stacks.Screen name = 'RootTabs' component={RootTabs}/> 
         <Stacks.Screen name = 'HomeAlarmSet' component={HomeAlarmSetScreen}/>
         <Stacks.Screen name="Preset" component={PresetScreen} />
      </Stacks.Navigator>
      <StatusBar style ='light' />
    </NavigationContainer>
  );
}

function RootTabs() {
  return(
  <Tabs.Navigator 
      screenOptions={ ( {route} ) => ({
        headerShown: (route.name !== 'Home'),
        tabBarStyle: {
          backgroundColor: 'rgba(33,29,80,0.8)',
          opacity: 80,
          borderTopWidth:1,
          borderColor: colors.edge,
          alignItems: 'center',
          height:77,
          paddingTop: 15,
          paddingLeft:15,
          paddingRight:15,
          position:'absolute',
      },
      tabBarShowLabel: false,
      tabBarBackground:() => (
        <BlurView tint="dark" intensity={50} style={StyleSheet.absoluteFill} />
      ),
      tabBarIcon: ({ color, size, focused }) => {
        const iconColor = focused ? '#FFFFFF' : '#908EA7';
        
        if (route.name === 'Home'){
          return (
            <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.0351 0.526735C13.5963 0.185348 13.0561 0 12.5001 0C11.9441 0 11.404 0.185348 10.9651 0.526735L0.48513 8.67673C-0.45487 9.41049 0.0626297 10.9167 1.25388 10.9167H2.61888L3.64388 21.1655C3.70557 21.7824 3.99426 22.3543 4.45392 22.7703C4.91358 23.1863 5.51142 23.4167 6.13138 23.4167H18.8689C19.4888 23.4167 20.0867 23.1863 20.5463 22.7703C21.006 22.3543 21.2947 21.7824 21.3564 21.1655L22.3814 10.9167H23.7464C24.9364 10.9167 25.4564 9.41048 24.5151 8.67798L14.0351 0.526735ZM12.5001 17.1667C13.4947 17.1667 14.4485 16.7716 15.1518 16.0684C15.855 15.3651 16.2501 14.4113 16.2501 13.4167C16.2501 12.4222 15.855 11.4683 15.1518 10.7651C14.4485 10.0618 13.4947 9.66673 12.5001 9.66673C11.5056 9.66673 10.5517 10.0618 9.84848 10.7651C9.14522 11.4683 8.75013 12.4222 8.75013 13.4167C8.75013 14.4113 9.14522 15.3651 9.84848 16.0684C10.5517 16.7716 11.5056 17.1667 12.5001 17.1667Z"
                fill={iconColor}
              />
            </Svg>
          );
        }else if (route.name === 'Stats'){
          return (
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M2.5 20C3.875 20 5 18.875 5 17.5V8.75C5 7.375 3.875 6.25 2.5 6.25C1.125 6.25 0 7.375 0 8.75V17.5C0 18.875 1.125 20 2.5 20ZM15 13.75V17.5C15 18.875 16.125 20 17.5 20C18.875 20 20 18.875 20 17.5V13.75C20 12.375 18.875 11.25 17.5 11.25C16.125 11.25 15 12.375 15 13.75ZM10 20C11.375 20 12.5 18.875 12.5 17.5V2.5C12.5 1.125 11.375 0 10 0C8.625 0 7.5 1.125 7.5 2.5V17.5C7.5 18.875 8.625 20 10 20Z"
                fill={iconColor}
              />
            </Svg>
          );
        }else if (route.name === 'Myinfo'){
          return (
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M9.75 11.25C12.4112 11.25 14.7514 11.9138 16.4473 12.7617C17.2927 13.1844 18.0069 13.6672 18.5264 14.1631C18.7859 14.4108 19.0164 14.6804 19.1875 14.9668C19.3543 15.246 19.5 15.601 19.5 16V18.5C19.5 19.0523 19.0523 19.5 18.5 19.5H1C0.447715 19.5 0 19.0523 0 18.5V16C0 15.601 0.145687 15.246 0.3125 14.9668C0.483615 14.6804 0.714138 14.4108 0.973633 14.1631C1.49313 13.6672 2.20734 13.1844 3.05273 12.7617C4.74862 11.9138 7.08875 11.25 9.75 11.25ZM14.5 4.75C14.5 7.37728 12.3773 9.5 9.75 9.5C7.12272 9.5 5 7.37728 5 4.75C5 2.12272 7.12272 0 9.75 0C12.3773 0 14.5 2.12272 14.5 4.75Z"
                fill={iconColor}
              />
            </Svg>
          );
        }
      },
      })}>
      
    <Tabs.Screen name = "Home" component = { HomeStack } />
    <Tabs.Screen name = "Stats" component = { StatsScreen} />
    <Tabs.Screen name = "Myinfo" component = { MyinfoScreen } />

  </Tabs.Navigator>
  )
}

const deviceWidth = 393
const deviceHeight = 852
export { deviceHeight, deviceWidth }


