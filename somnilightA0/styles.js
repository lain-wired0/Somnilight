import React from 'react'
import { StyleSheet, Text } from 'react-native'

let themeTextColor = 'white'

const textStyles = StyleSheet.create({
    medium16:{
        fontFamily: 'PingFangSC-Medium',
        fontSize: 16,
        lineHeight: 21.5,
        color: themeTextColor,
    },
    reg11:{
        fontFamily: 'PingFangSC-Regular',
        fontSize: 11,
        lineHeight: 21.5,
        color: themeTextColor,
    },
    semibold15:{
        fontFamily: 'PingFangSC-Semibold',
        fontSize: 15,
        lineHeight: 21.5,
        color: themeTextColor,
    }
})

const containers = StyleSheet.create({
    CenterAJ:{
        flex:1,
        alignItems:'center',
        justifyContent: 'center',
    },
    label:{
        fontSize: 24,
        fontWeight: 'bold',
    }
})

const colors = StyleSheet.create({
    edge: 'rgba(125,125,125,1)'
})
export { textStyles , containers, colors}