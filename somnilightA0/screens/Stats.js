//fundamental
import React from 'react';
import { Image, Text, View } from 'react-native';

//react-navigation
import { createStaticNavigation, NavigationContainer } from '@react-navigation/native';

//./screens

//./styles
import { containers } from '../styles';

const StatsScreen = () => (
    <View style = {containers.CenterAJ}>
        <Text style = {containers.label}>Stats Screen</Text>
    </View>
)

export { StatsScreen }
