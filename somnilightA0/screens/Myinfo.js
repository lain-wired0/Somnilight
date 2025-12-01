import React , {useState} from 'react';
import { Image, Text, View, StyleSheet, Switch } from 'react-native';
import { containers } from '../styles';

const MyinfoScreen = () => {
    const [isOn, setIsOn] = useState(false);
    const toggleSwitch = () => setIsOn(previousState => !previousState);
    return(
        <View style = {containers.CenterAJ}>
            <Text style = {containers.label}>Myinfo Screen</Text>
            <Switch 
                trackColor = {{true: '#8068E9',false:'rgba(61, 43, 142, 1)'}}
                thumbColor = {'rgba(255, 255, 255, 1)'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isOn}
            />
        </View>
    )
}

export { MyinfoScreen }
