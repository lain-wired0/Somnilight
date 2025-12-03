import React , {useState} from 'react';
import { Image, Text, View, StyleSheet, Switch } from 'react-native';
import { containers } from '../styles';
import Slider from '@react-native-community/slider';


const MyinfoScreen = () => {
    const [isOn, setIsOn] = useState(false);
    const toggleSwitch = () => setIsOn(previousState => !previousState);
    return(
        <View style = {containers.CenterAJ}>
            <Text style = {containers.label}>Myinfo Screen</Text>
            <Slider
            style={{width: 200, height: 100}}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
            />
        </View>
    )
}

export { MyinfoScreen }
