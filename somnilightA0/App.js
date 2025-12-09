//Fundamentals
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';

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
import { StatsScreen } from './screens/Stats/Stats';
import { MyinfoScreen } from './screens/Myinfo';
import { HoverEffect } from 'react-native-gesture-handler';

const Tabs = createBottomTabNavigator();
const Stacks = createStackNavigator();

export { Tabs, Stacks } 


//[Temporary] TabIconColor 
let InactiveColor = '#908EA7'
let ActiveColor = '#ffffffff'


export default function App() {
  return (
    <NavigationContainer>
      <RootTabs />
    </NavigationContainer>
  );
}

function RootTabs() {
  return(
  <Tabs.Navigator 
      screenOptions={ ( {route} ) => ({
        headerShown: false,
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
      tabBarIcon: ({ color, size }) => {
        size = 30
        if (route.name === 'Home'){
          return <MaterialCommunityIcons name = {'home'} size={size} color = {color} />
        }else if (route.name === 'Stats'){
          return <MaterialCommunityIcons name = {'chart-bar'} size={size} color = {color} />
        }else if (route.name === 'Myinfo'){
          return <MaterialCommunityIcons name = {'account'} size={size} color = {color} />
        }
      },
      tabBarActiveTintColor: ActiveColor,
      tabBarInactiveTintColor: InactiveColor,
      })}>
      
    <Tabs.Screen name = "Home" component = { HomeStack } />
    <Tabs.Screen name = "Stats" component = { StatsScreen} />
    <Tabs.Screen name = "Myinfo" component = { MyinfoScreen } />

  </Tabs.Navigator>
  )
}

const deviceWidth = 393
const deviceHeight = 852
export { deviceHeight, deviceWidth };