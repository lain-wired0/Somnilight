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

let presetButtonRadious = 18

const containers = StyleSheet.create({
    CenterAJ:{
        flex:1,
        alignItems:'center',
        justifyContent: 'center',
    },
    label:{
        fontSize: 24,
        fontWeight: 'bold',
    },
    violetLightC20:{
        flex:1,
        backgroundColor:'rgba(96, 68, 175, 0.60)',
        borderRadius:24,
    },
    violetDarkC20:{
        flex:1,
        backgroundColor:'rgba(22, 9, 55, 0.80)',
        borderRadius:20,
        margin:5,
    },
    presetButton:{
        height: presetButtonRadious * 2,
        width: presetButtonRadious * 2,
        borderRadius: presetButtonRadious,
        marginLeft:10,
    }

})

const colors = StyleSheet.create({
    edge: 'rgba(125,125,125,0.5)'
})

const ele = StyleSheet.create({
    icon50:{
        height:35,
        width:35,
    },
    gnrborder:{
        borderWidth:1,
        borderColor:colors.edge,
    }
})

export { textStyles , containers, colors, ele}