import React , {useState} from 'react';
import { 
    Image, ImageBackground,Text, View, StyleSheet, 
    TouchableOpacity, TouchableHighlight, 
    } from 'react-native';



import { deviceHeight, deviceWidth } from '../App';
import { colors, containers, Icon12text11, textStyles } from '../styles';

const liveAlarmSettings = {
    "bedtime": "23:00",
    "sunrise_time": "15:00",
    "wakeup_time": "15:02",
    "days": ["Mon","Tue","Wed","Thu","Fri"],
    "name": "Healthy sleep",
    "preset_id": "Morning_1",
    "repeat_interval_min": 5
}



export function HomeAlarmSetScreen({navigation}) {
    const live = liveAlarmSettings
    return (
        <View style = {{flex:1,backgroundColor:'rgba(9,0,31,1)',alignItems:'center'}}>
            <ImageBackground source={require('../assets/general_images/alarmSetBG.png')}
                style = {{height:240,width:394}} >

                    <CusHeader navigation = {navigation} title={'Alarm Set'} previousPage={"Home"}/>
                    <View style={{marginTop:100, height:260,alignSelf:'stretch'}}/>
                    <View style={{alignSelf:'stretch',padding:8,height:400}}>
                        
                        <View style = {{ //DaySetPanel
                                ...RoundBlueContainer,
                                flex:1,
                                alignSelf:'stretch'
                                }}>
                            <View style = {{flexDirection:'row',justifyContent:'space-evenly', alignItems:'center'}}>
                                <DaySetCell DoW = {'Mo'} live = {live}/>
                                <DaySetCell DoW = {'Tu'}/>
                                <DaySetCell DoW = {'We'}/>
                                <DaySetCell DoW = {'Th'}/>
                                <DaySetCell DoW = {'Fi'}/>
                                <DaySetCell DoW = {'Sa'}/>
                                <DaySetCell DoW = {'Su'}/>
                            </View>
                        </View>

                        <View style = {{//TimeSetPanel
                                flex:1,
                                justifyContent:'space-between',
                                flexDirection:'row',
                                marginVertical:8,
                                }}>
                            <View style = {{...RoundBlueContainer,marginVertical:0,alignSelf:'stretch'}}>
                                <TimeSetCell addr = {require('../assets/icons/moonsleep.png')} text = {'Bedtime'} />
                            </View>
                            <View style = {{...RoundBlueContainer,marginVertical:0,alignSelf:'stretch'}}>
                                <TimeSetCell addr = {require('../assets/icons/moonsleep.png')} text = {'Sunrise'} />
                            </View>
                            <View style = {{...RoundBlueContainer,marginVertical:0,alignSelf:'stretch'}}>
                                <TimeSetCell addr = {require('../assets/icons/timer.png')} text = {'Wake up'} />
                            </View>
                        </View>

                        <View style = {{...RoundBlueContainer,alignSelf:'stretch'}}>
                            <OtherSetCell   icon = {require('../assets/icons/AlarmSetName.png')} 
                                            title = {'Alarm Name'} 
                                            value = {live.name} />
                        </View>

                        <View style = {{...RoundBlueContainer,alignSelf:'stretch'}}>
                            <OtherSetCell   icon = {require('../assets/icons/AlarmSetPreset.png')} 
                                            title = {'Preset'}
                                            value = {live.preset_id} />
                        </View>
                        <View style = {{...RoundBlueContainer,alignSelf:'stretch'}}>
                            <OtherSetCell   icon = {require('../assets/icons/AlarmSetInterval.png')} 
                                            title = {'Repeat Interval'}
                                            value = {`${live.repeat_interval_min} min`} />
                        </View>
                    </View>
            </ImageBackground>
            
        </View>
    )
}

const RoundBlueContainer = StyleSheet.create({
    flex:1,
    backgroundColor:'#0C112E',
    borderRadius:16,
    justifyContent: 'center',
    margin:8,
    borderWidth:0.5,
    borderColor:"#222754"
})

function CusHeader({navigation, title}) {
    return(
        <View style = {{
                alignItems:'center',
                justifyContent:'center',
                position:'absolute',
                height:45,top:44,
                flexDirection:'row',
                left:10, right:10,
            }}>

            <TouchableOpacity 
                style = {{
                    ...containers.CenterAJ,
                    height:32,width:32,
                    borderRadius:12,
                    borderWidth:1,
                    borderColor: 'rgba(255,255,255,0.4)',
                    position:'absolute',
                    left:10
                }}
                onPress={() => navigation.pop()}>
                <Image source={require('../assets/icons/back.png')}
                    style = {{height:16,width:16,opacity:40,
                    }}
                    />
            </TouchableOpacity>

            <Text style = {{...textStyles.medium16, fontSize:20,marginTop:8}}>{title}</Text>
        </View>
    )
}

function CircularAlarmSetPanel(){
    return (
        <View>
        </View>
    )
}

const DaySetCell = ({DoW}) => {

    const [isActive, setIsActive] = useState(true)
    return (
        <TouchableHighlight
            style = {{
                height:38, width:38,
                borderRadius:12,
                borderWidth:1,
                borderColor: isActive ? '#793BC4' : 'rgba(255,255,255,0.2)',
                alignItems:'center',
                justifyContent:'center',
            }}
            onPress={() => {
                setIsActive(!isActive)
            }}
        >
            <Text style={textStyles.reg11}>{DoW}</Text>
        </TouchableHighlight>
    )
}

const TimeSetCell = ({addr, text}) => {
    return (
        <TouchableOpacity style = {{left:15}}

        >
            <Icon12text11 addr = {addr} text = {text}/>
            <Text style = {{...textStyles.semibold15, lineHeight:18}}>11:00 PM</Text>
        </TouchableOpacity>
    )
}

const OtherSetCell = ({icon, title, value}) => {
    const src = icon;
    return (
        <TouchableOpacity style = {{padding:10,flexDirection: 'row',justifyContent:'flex-start'}}>
            <View style = {{...containers.CenterAJ, flex:1}}>
                <OtherSetCellIcon src = {src}/>
            </View>
            <View style = {{left:10, justifyContent:'center', flex:5}}>
                <Text style = {{...textStyles.reg11,opacity:0.5}}>{title}</Text>
                <Text style = {{...textStyles.medium16,lineHeight:18}}>{value}</Text>
            </View>
            <View style = {{...containers.CenterAJ, flex: 0.5}}>
                <Image source={require('../assets/icons/arrow-right.png')} style={{height:16,width:16}} />
            </View>
        </TouchableOpacity>
    )
}

const OtherSetCellIcon = ({src}) => {
    const size = 40
    const corner = 8
    return(
    <View style = {{
        height:size,width:size,
        borderRadius:corner,
        borderWidth:1,
        borderColor:'#4E5166',
        alignItems:'center',
        justifyContent:'center',
    }}>
        <Image source={src} style={{height:size,width:size,borderRadius:corner}}/>
    </View>
    )
}