import React , {useState, useEffect} from 'react';
import { 
    Image, ImageBackground,Text, View, StyleSheet, 
    TouchableOpacity, TouchableHighlight,
    TouchableWithoutFeedback, 
    } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Modal from 'react-native-modal';


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
    const [bedtimeHour, setBedtimeHour] = useState(23);
    const [bedtimeMin, setBedtimeMin] = useState(0);
    const [sunriseHour, setSunriseHour] = useState(6);
    const [sunriseMin, setSunriseMin] = useState(30);
    const [wakeupHour, setWakeupHour] = useState(7);
    const [wakeupMin, setWakeupMin] = useState(0);
    const [sunriseOffsetMin, setSunriseOffsetMin] = useState(30); // difference between wakeup and sunrise in minutes

    // Helper function to check if a time is between two times (handling midnight wrap)
    const isTimeBetween = (checkHour, checkMin, startHour, startMin, endHour, endMin) => {
        const checkTime = checkHour * 60 + checkMin;
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime <= endTime) {
            // Normal case: start and end are on same day (e.g., 06:00 to 07:00)
            return checkTime >= startTime && checkTime <= endTime;
        } else {
            // Midnight wrap case: start is PM, end is AM (e.g., 23:00 to 08:00)
            return checkTime >= startTime || checkTime <= endTime;
        }
    };

    const subtractMinutes = (hour, min, delta) => {
        const total = (hour * 60 + min - delta + 1440) % 1440;
        return { h: Math.floor(total / 60), m: total % 60 };
    };

    const minutesDiff = (h1, m1, h2, m2) => {
        // difference from (h1:m1) to (h2:m2) in minutes, wrapping 24h
        return ((h2 * 60 + m2) - (h1 * 60 + m1) + 1440) % 1440;
    };

    // Validate and constrain sunrise time
    const handleSunriseChange = (hour, min) => {
        if (isTimeBetween(hour, min, bedtimeHour, bedtimeMin, wakeupHour, wakeupMin)) {
            setSunriseHour(hour);
            setSunriseMin(min);
            const offset = minutesDiff(hour, min, wakeupHour, wakeupMin);
            setSunriseOffsetMin(offset);
        }
        // If invalid, don't update - keep previous value
    };

    const handleWakeupChange = (hour, min) => {
        setWakeupHour(hour);
        setWakeupMin(min);

        const suggested = subtractMinutes(hour, min, sunriseOffsetMin);
        if (isTimeBetween(suggested.h, suggested.m, bedtimeHour, bedtimeMin, hour, min)) {
            setSunriseHour(suggested.h);
            setSunriseMin(suggested.m);
        } else {
            // Keep previous sunrise if suggested time is out of bounds
            // sunriseOffsetMin remains unchanged so future changes can still apply when valid
        }
    };

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
                            <View style = {lstyles.timeSetCell}>
                                <TimeSetCell 
                                    addr = {require('../assets/icons/moonsleep.png')} 
                                    text = {'Bedtime'} 
                                    aniIn = {'fadeInLeft'}
                                    aniOut = {'fadeOutLeft'}
                                    hour = {bedtimeHour}
                                    min = {bedtimeMin}
                                    onTimeChange = {(h, m) => {setBedtimeHour(h); setBedtimeMin(m);}}
                                    />
                            </View>
                            <View style = {lstyles.timeSetCell}>
                                <TimeSetCell 
                                    addr = {require('../assets/icons/moonsleep.png')} 
                                    text = {'Sunrise'} 
                                    aniIn = {'fadeIn'}
                                    aniOut = {'fadeOut'}
                                    hour = {sunriseHour}
                                    min = {sunriseMin}
                                    onTimeChange = {handleSunriseChange}
                                    />
                            </View>
                            <View style = {lstyles.timeSetCell}>
                                <TimeSetCell 
                                    addr = {require('../assets/icons/timer.png')} 
                                    text = {'Wake up'} 
                                    aniIn = {'shake'}
                                    aniOut = {'fadeOutRight'}
                                    hour = {wakeupHour}
                                    min = {wakeupMin}
                                        onTimeChange = {handleWakeupChange}
                                    />
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

const TimeSetCell = ({addr, text, aniIn, aniOut, hour = 11, min = 0, onTimeChange}) => {
    const [modalVisible, setModalVisible] = useState(false);

    const formatTime = (h, m) => {
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const period = h === 0 || h < 12 ? 'AM' : 'PM';
        const displayMin = String(m).padStart(2, '0');
        return `${displayHour}:${displayMin} ${period}`;
    };

    const handleTimeConfirm = (newHour, newMin) => {
        if (onTimeChange) {
            onTimeChange(newHour, newMin);
        }
        setModalVisible(false);
    };

    return (
        <TouchableOpacity style = {{left:15}}
            onPress={() => {
                setModalVisible(true);
            }}
        >
            <Icon12text11 addr = {addr} text = {text}/>
            <Text style = {{...textStyles.semibold15, lineHeight:18}}>{formatTime(hour, min)}</Text>
            <Modal
                
                animationIn={aniIn}
                animationOut={aniOut}
                transparent={true}
                isVisible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                >

                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style = {{...containers.CenterAJ, backgroundColor:'transparant' }}>
                        <TouchableWithoutFeedback>
                        <View>
                            <PickTimePanel 
                                    onClose = {(h, m) => {
                                        handleTimeConfirm(h, m);
                                    }}
                                    initialHour={hour}
                                    initialMin={min}
                                    iconAddr={addr}
                                    title={text}
                                />
        
                        </View>
                        
                        </TouchableWithoutFeedback>
                    </View>
                    </TouchableWithoutFeedback>
                
            </Modal>
        </TouchableOpacity>
    )
}

const PickTimePanel = ({onClose, initialHour = 0, initialMin = 0, iconAddr, title}) => {
  // Adjustable sizing for icon and title
  const iconSize = 20;
  const titleFontSize = 14;
  
  const barWidth = 100
  const padding = 20
  const mainRadius = 40
  const buttonRadius = 20
  const bgcolor = '#0C112E'
  const [Hour, setHour] = useState(initialHour)
  const [Min, setMin] = useState(initialMin)
  
  // Sync local state with props when they change
  useEffect(() => {
    setHour(initialHour);
    setMin(initialMin);
  }, [initialHour, initialMin]);
  
  return (
    <View style = {{
            backgroundColor:bgcolor,
            padding:padding,
            borderRadius:mainRadius,
            borderWidth:1,
            borderColor:'#353951'
            }}>
        {/* Header with icon and title - adjust iconSize and titleFontSize above */}
        {iconAddr && title && (
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom:16}}>
            <Image source={iconAddr} style={{height:iconSize, width:iconSize, marginRight:8}}/>
            <Text style={{...textStyles.semibold15, fontSize:titleFontSize, color:'white'}}>{title}</Text>
          </View>
        )}
        
        <View style = {{alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
          <Picker //Hour
            selectedValue={Hour}
            itemStyle={{width:barWidth,color:'white'}}
            onValueChange={(itemValue, itemIndex) =>
              {
                setHour(itemValue);
              }
            }
            >
              
            <Picker.Item label="13" value={13} />
            <Picker.Item label="14" value={14} />
            <Picker.Item label="15" value={15} />
            <Picker.Item label="16" value={16} />
            <Picker.Item label="17" value={17} />
            <Picker.Item label="18" value={18} />
            <Picker.Item label="19" value={19} />
            <Picker.Item label="20" value={20} />
            <Picker.Item label="21" value={21} />
            <Picker.Item label="22" value={22} />
            <Picker.Item label="23" value={23} />
            <Picker.Item label="00" value={0} />
            <Picker.Item label="01" value={1} />
            <Picker.Item label="02" value={2} />
            <Picker.Item label="03" value={3} />
            <Picker.Item label="04" value={4} />
            <Picker.Item label="05" value={5} />
            <Picker.Item label="06" value={6} />
            <Picker.Item label="07" value={7} />
            <Picker.Item label="08" value={8} />
            <Picker.Item label="09" value={9} />
            <Picker.Item label="10" value={10} />
            <Picker.Item label="11" value={11} />
            <Picker.Item label="12" value={12} />

          </Picker>
          <Picker //Min
            selectedValue={Min}
            itemStyle={{width:barWidth,color:'white'}}
            onValueChange={(itemValue, itemIndex) =>
              setMin(itemValue)
            }
            >
              
            <Picker.Item label="00" value={0} />
            <Picker.Item label="05" value={5} />
            <Picker.Item label="10" value={10} />
            <Picker.Item label="15" value={15} />
            <Picker.Item label="20" value={20} />
            <Picker.Item label="25" value={25} />
            <Picker.Item label="30" value={30} />
            <Picker.Item label="35" value={35} />
            <Picker.Item label="40" value={40} />
            <Picker.Item label="45" value={45} />
            <Picker.Item label="50" value={50} />
            <Picker.Item label="55" value={55} />


          </Picker>
        </View>

        <TouchableOpacity 
            style = {{
                backgroundColor:'rgba(255,255,255,0.15)',
                borderRadius:buttonRadius,
                justifyContent:'center',
                alignItems:'center',
                height: 2 * buttonRadius,
            }}
            onPress={() => onClose(Hour, Min)}
            >
            <Text style = {{...textStyles.medium16, color:'rgba(255,255,255,0.7)',fontSize:18,fontWeight:'bold',top:2,}}>CLOSE</Text>
        </TouchableOpacity> 

    </View>
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


const lstyles = StyleSheet.create ({
    timeSetCell:{
        ...RoundBlueContainer,marginVertical:0,alignSelf:'stretch'
    },
})