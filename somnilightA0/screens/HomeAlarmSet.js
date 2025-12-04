import React , {useState} from 'react';
import { Image, Text, View, StyleSheet, Switch } from 'react-native';

export function HomeAlarmSetScreen() {
    return (
        <View style = {{alignItems:'center',justifyContent:'center',flex:1,backgroundColor:"#2c2097ff"}}>
            <Text style = {{fontSize:50,color:'black',alignSelf:"center"}}>AlarmSet</Text>
        </View>
    )
}
