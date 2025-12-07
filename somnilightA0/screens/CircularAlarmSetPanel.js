import React, { useEffect, useRef, useState } from 'react';
import { View, Text, PanResponder, Image } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { textStyles } from '../styles';

const CircularAlarmSetPanel = ({ bedtimeHour, bedtimeMin, sunriseHour, sunriseMin, wakeupHour, wakeupMin, onBedtimeChange, onSunriseChange, onWakeupChange }) => {
  const diameter = 250;
  const radius = diameter / 2;
  const strokeWidth = 26;
  const trackRadius = radius - strokeWidth + 5 ; // Track inset from edge
  const labelRadius = trackRadius - 12; // Inset labels closer to center

  const [draggingHandle, setDraggingHandle] = useState(null); // 'bedtime', 'sunrise', or 'wakeup'
  const activeHandleRef = useRef(null);
  const bedtimeRef = useRef({ h: bedtimeHour, m: bedtimeMin });
  const sunriseRef = useRef({ h: sunriseHour, m: sunriseMin });
  const wakeRef = useRef({ h: wakeupHour, m: wakeupMin });

  // Keep refs in sync with latest props so the pan responder hit-testing stays accurate
  useEffect(() => {
    bedtimeRef.current = { h: bedtimeHour, m: bedtimeMin };
    sunriseRef.current = { h: sunriseHour, m: sunriseMin };
    wakeRef.current = { h: wakeupHour, m: wakeupMin };
  }, [bedtimeHour, bedtimeMin, sunriseHour, sunriseMin, wakeupHour, wakeupMin]);

  const timeToAngle = (h, m) => {
    const totalMinutes = h * 60 + m;
    return (totalMinutes / 1440) * 360;
  };

  const angleToTime = (angle) => {
    const normalized = ((angle % 360) + 360) % 360;
    const totalMinutes = Math.round((normalized / 360) * 1440);
    // Snap to 5-minute increments
    const snappedMinutes = Math.round(totalMinutes / 5) * 5;
    return {
      h: Math.floor(snappedMinutes / 60) % 24,
      m: snappedMinutes % 60,
    };
  };

  const getTouchAngle = (x, y) => {
    const dx = x - radius;
    const dy = y - radius;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    return ((angle % 360) + 360) % 360;
  };

  const polarToCart = (angle, r = trackRadius) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: radius + r * Math.cos(rad),
      y: radius + r * Math.sin(rad),
    };
  };

  const minutesDiff = (h1, m1, h2, m2) => {
    // difference from (h1:m1) to (h2:m2) in minutes, wrapping 24h
    return ((h2 * 60 + m2) - (h1 * 60 + m1) + 1440) % 1440;
  };

  const isNearHandle = (x, y, threshold = 28) => {
    const bed = polarToCart(timeToAngle(bedtimeRef.current.h, bedtimeRef.current.m));
    const sunrise = polarToCart(timeToAngle(sunriseRef.current.h, sunriseRef.current.m));
    const wake = polarToCart(timeToAngle(wakeRef.current.h, wakeRef.current.m));
    const distBed = Math.hypot(x - bed.x, y - bed.y);
    const distSunrise = Math.hypot(x - sunrise.x, y - sunrise.y);
    const distWake = Math.hypot(x - wake.x, y - wake.y);
    
    const minDist = Math.min(distBed, distSunrise, distWake);
    if (minDist > threshold) return null;
    if (minDist === distBed) return 'bedtime';
    if (minDist === distSunrise) return 'sunrise';
    return 'wakeup';
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        return !!isNearHandle(locationX, locationY);
      },
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const handle = isNearHandle(locationX, locationY);
        if (!handle) return;
        const angle = getTouchAngle(locationX, locationY);
        activeHandleRef.current = handle;
        setDraggingHandle(handle);

        const { h, m } = angleToTime(angle);
        if (handle === 'bedtime') onBedtimeChange(h, m);
        else if (handle === 'sunrise') onSunriseChange(h, m);
        else onWakeupChange(h, m);
      },
      onPanResponderMove: (evt) => {
        const handle = activeHandleRef.current;
        if (!handle) return;
        const { locationX, locationY } = evt.nativeEvent;
        const angle = getTouchAngle(locationX, locationY);
        const { h, m } = angleToTime(angle);
        if (handle === 'bedtime') onBedtimeChange(h, m);
        else if (handle === 'sunrise') onSunriseChange(h, m);
        else onWakeupChange(h, m);
      },
      onPanResponderRelease: () => {
        activeHandleRef.current = null;
        setDraggingHandle(null);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        activeHandleRef.current = null;
        setDraggingHandle(null);
      },
    })
  ).current;

  const bedAngle = timeToAngle(bedtimeHour, bedtimeMin);
  const sunriseAngle = timeToAngle(sunriseHour, sunriseMin);
  const wakeAngle = timeToAngle(wakeupHour, wakeupMin);

  const arcAngle = (wakeAngle - bedAngle + 360) % 360;
  const largeArcFlag = arcAngle > 180 ? 1 : 0;

  const bedPoint = polarToCart(bedAngle);
  const sunrisePoint = polarToCart(sunriseAngle);
  const wakePoint = polarToCart(wakeAngle);

  const formatTime = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const sleepMinutes = minutesDiff(bedtimeHour, bedtimeMin, wakeupHour, wakeupMin);
  const sleepHours = Math.floor(sleepMinutes / 60);
  const sleepMins = sleepMinutes % 60;
  const sleepLabel = `${sleepHours}h ${String(sleepMins).padStart(2, '0')}m`;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
      <View
        {...panResponder.panHandlers}
        style={{
          width: diameter,
          height: diameter,
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: radius,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
          <Defs>
            <LinearGradient id="wakeIconGradient" x1="13.965" y1="13.605" x2="1.465" y2="0.604982" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#6748EB" />
              <Stop offset="1" stopColor="#947FF3" />
            </LinearGradient>
            <LinearGradient id="bedIconGradient" x1="15.5833" y1="11.5834" x2="-3.41667" y2="3.58337" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#6748EC" />
              <Stop offset="1" stopColor="#3A2986" />
            </LinearGradient>
          </Defs>

          <Circle cx={radius} cy={radius} r={radius} fill="#09001F" />

          <Circle cx={radius} cy={radius} r={trackRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />

          <Path
            d={`M ${bedPoint.x} ${bedPoint.y} A ${trackRadius} ${trackRadius} 0 ${largeArcFlag} 1 ${wakePoint.x} ${wakePoint.y}`}
            fill="none"
            stroke="#7A5AF8"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <Circle cx={bedPoint.x} cy={bedPoint.y} r={12} fill="white" stroke="#7A5AF8" strokeWidth={2} />
          <Path
            d="M7.08333 14.1667C10.9955 14.1667 14.1667 10.9955 14.1667 7.08333C14.1667 6.75538 13.6751 6.70083 13.5058 6.98204C13.1447 7.58012 12.6523 8.08818 12.0658 8.46775C11.4792 8.84732 10.814 9.08844 10.1205 9.17285C9.42705 9.25726 8.72343 9.18274 8.06299 8.95495C7.40255 8.72715 6.80262 8.35205 6.30862 7.85805C5.81462 7.36405 5.43952 6.76411 5.21172 6.10367C4.98392 5.44324 4.90941 4.73962 4.99382 4.04612C5.07823 3.35262 5.31935 2.68742 5.69892 2.10091C6.07849 1.5144 6.58655 1.02195 7.18463 0.660875C7.46583 0.490875 7.41129 0 7.08333 0C3.17121 0 0 3.17121 0 7.08333C0 10.9955 3.17121 14.1667 7.08333 14.1667Z"
            fill="url(#bedIconGradient)"
            transform={`translate(${bedPoint.x - 7.5}, ${bedPoint.y - 7.5})`}
          />
          <Circle cx={sunrisePoint.x} cy={sunrisePoint.y} r={12} fill="#ffcc00ff" stroke="#FFA500" strokeWidth={2} />
          <Path
            d="M7.75 2.94737C8.43961 2.94723 9.12062 3.09294 9.7437 3.37392C10.3668 3.6549 10.9163 4.06412 11.3525 4.57195C11.7887 5.07978 12.1007 5.6735 12.2657 6.31009C12.4308 6.94669 12.4449 7.61022 12.307 8.25263C12.2713 8.41906 12.1762 8.56865 12.0378 8.67607C11.8993 8.78348 11.7262 8.84214 11.5475 8.8421H3.9525C3.77384 8.84214 3.60065 8.78348 3.46225 8.67607C3.32385 8.56865 3.22873 8.41906 3.193 8.25263C3.05508 7.61022 3.06917 6.94669 3.23425 6.31009C3.39933 5.6735 3.71127 5.07978 4.14748 4.57195C4.58368 4.06412 5.13322 3.6549 5.7563 3.37392C6.37938 3.09294 7.06039 2.94723 7.75 2.94737ZM14.725 6.63158C14.9305 6.63158 15.1277 6.70921 15.273 6.8474C15.4183 6.98558 15.5 7.173 15.5 7.36842C15.5 7.56384 15.4183 7.75126 15.273 7.88945C15.1277 8.02763 14.9305 8.10526 14.725 8.10526H13.95C13.7445 8.10526 13.5473 8.02763 13.402 7.88945C13.2567 7.75126 13.175 7.56384 13.175 7.36842C13.175 7.173 13.2567 6.98558 13.402 6.8474C13.5473 6.70921 13.7445 6.63158 13.95 6.63158H14.725ZM1.55 6.63158C1.75554 6.63158 1.95267 6.70921 2.09801 6.8474C2.24335 6.98558 2.325 7.173 2.325 7.36842C2.325 7.56384 2.24335 7.75126 2.09801 7.88945C1.95267 8.02763 1.75554 8.10526 1.55 8.10526H0.775C0.569457 8.10526 0.372333 8.02763 0.226992 7.88945C0.0816515 7.75126 0 7.56384 0 7.36842C0 7.173 0.0816515 6.98558 0.226992 6.8474C0.372333 6.70921 0.569457 6.63158 0.775 6.63158H1.55ZM13.23 2.15895C13.3753 2.29713 13.4569 2.48451 13.4569 2.67989C13.4569 2.87528 13.3753 3.06266 13.23 3.20084L12.6821 3.72179C12.6106 3.79217 12.5251 3.8483 12.4305 3.88692C12.336 3.92553 12.2343 3.94586 12.1314 3.94671C12.0285 3.94756 11.9264 3.92892 11.8312 3.89187C11.7359 3.85482 11.6494 3.80011 11.5766 3.73092C11.5039 3.66174 11.4463 3.57947 11.4074 3.48891C11.3684 3.39836 11.3488 3.30133 11.3497 3.20349C11.3506 3.10566 11.372 3.00897 11.4126 2.91907C11.4532 2.82917 11.5122 2.74787 11.5863 2.67989L12.1342 2.15895C12.2795 2.02081 12.4766 1.94321 12.6821 1.94321C12.8876 1.94321 13.0847 2.02081 13.23 2.15895ZM3.36582 2.15895L3.91375 2.67989C4.05143 2.81949 4.12659 3.00454 4.12332 3.19588C4.12006 3.38723 4.03862 3.56986 3.89624 3.70513C3.75386 3.8404 3.56172 3.9177 3.36046 3.92067C3.1592 3.92364 2.96463 3.85206 2.8179 3.72105L2.26997 3.20011C2.19427 3.13252 2.13363 3.05115 2.09165 2.96085C2.04967 2.87054 2.02721 2.77314 2.02559 2.67441C2.02398 2.57569 2.04325 2.47767 2.08226 2.38617C2.12128 2.29467 2.17923 2.21155 2.25269 2.14176C2.32614 2.07197 2.4136 2.01693 2.50987 1.9799C2.60614 1.94288 2.70925 1.92462 2.81308 1.92623C2.91692 1.92783 3.01935 1.94926 3.1143 1.98923C3.20926 2.02921 3.29479 2.08693 3.36582 2.15895ZM7.75 0C7.95554 0 8.15267 0.0776313 8.29801 0.215816C8.44335 0.354001 8.525 0.541419 8.525 0.736842V1.47368C8.525 1.66911 8.44335 1.85653 8.29801 1.99471C8.15267 2.13289 7.95554 2.21053 7.75 2.21053C7.54446 2.21053 7.34733 2.13289 7.20199 1.99471C7.05665 1.85653 6.975 1.66911 6.975 1.47368V0.736842C6.975 0.541419 7.05665 0.354001 7.20199 0.215816C7.34733 0.0776313 7.54446 0 7.75 0ZM1.55 9.57895C1.34446 9.57895 1.14733 9.65658 1.00199 9.79476C0.856651 9.93295 0.775 10.1204 0.775 10.3158C0.775 10.5112 0.856651 10.6986 1.00199 10.8368C1.14733 10.975 1.34446 11.0526 1.55 11.0526H13.95C14.1555 11.0526 14.3527 10.975 14.498 10.8368C14.6433 10.6986 14.725 10.5112 14.725 10.3158C14.725 10.1204 14.6433 9.93295 14.498 9.79476C14.3527 9.65658 14.1555 9.57895 13.95 9.57895H1.55ZM3.875 12.5263C3.66946 12.5263 3.47233 12.6039 3.32699 12.7421C3.18165 12.8803 3.1 13.0677 3.1 13.2632C3.1 13.4586 3.18165 13.646 3.32699 13.7842C3.47233 13.9224 3.66946 14 3.875 14H11.625C11.8305 14 12.0277 13.9224 12.173 13.7842C12.3183 13.646 12.4 13.4586 12.4 13.2632C12.4 13.0677 12.3183 12.8803 12.173 12.7421C12.0277 12.6039 11.8305 12.5263 11.625 12.5263H3.875Z"
            fill="white"
            transform={`translate(${sunrisePoint.x - 8}, ${sunrisePoint.y - 7})`}
          />
          <Circle cx={wakePoint.x} cy={wakePoint.y} r={12} fill="white" stroke="#7A5AF8" strokeWidth={2} />

          <Path
            d="M7.64617 6.75101V4.27736C7.64617 4.08267 7.58078 3.91959 7.45 3.78812C7.31921 3.65665 7.15755 3.59069 6.965 3.59023C6.77246 3.58977 6.61079 3.65574 6.48 3.78812C6.34922 3.92051 6.28383 4.08359 6.28383 4.27736V7.00868C6.28383 7.1003 6.30086 7.18916 6.33491 7.27528C6.36897 7.3614 6.42006 7.43859 6.48818 7.50684L8.39546 9.4308C8.52035 9.55677 8.67929 9.61975 8.87229 9.61975C9.06528 9.61975 9.22423 9.55677 9.34911 9.4308C9.47399 9.30482 9.53643 9.14449 9.53643 8.94981C9.53643 8.75512 9.47399 8.59479 9.34911 8.46882L7.64617 6.75101ZM6.965 13.21C6.11353 13.21 5.31611 13.0469 4.57272 12.7208C3.82933 12.3946 3.18222 11.9537 2.63137 11.398C2.08053 10.8424 1.64344 10.1896 1.32011 9.43973C0.996784 8.68985 0.834892 7.88522 0.834438 7.02586C0.833984 6.16649 0.995876 5.3621 1.32011 4.61267C1.64435 3.86325 2.08121 3.21048 2.63069 2.65437C3.18017 2.09825 3.82729 1.65735 4.57204 1.33165C5.31679 1.00595 6.11444 0.842645 6.965 0.841729C7.81556 0.840812 8.61321 1.00412 9.35796 1.33165C10.1027 1.65918 10.7498 2.10008 11.2993 2.65437C11.8488 3.20865 12.2859 3.86142 12.6106 4.61267C12.9353 5.36393 13.0969 6.16832 13.0956 7.02586C13.0942 7.88339 12.9325 8.68801 12.6106 9.43973C12.2886 10.1914 11.8515 10.8442 11.2993 11.398C10.7471 11.9519 10.1 12.3928 9.35796 12.7208C8.61594 13.0487 7.81828 13.2118 6.965 13.21ZM0.187323 3.10924C0.0624409 2.98327 0 2.82294 0 2.62825C0 2.43357 0.0624409 2.27324 0.187323 2.14727L2.12867 0.188959C2.25355 0.0629864 2.41249 0 2.60549 0C2.79849 0 2.95743 0.0629864 3.08231 0.188959C3.20719 0.314932 3.26963 0.475262 3.26963 0.669947C3.26963 0.864633 3.20719 1.02496 3.08231 1.15093L1.14097 3.10924C1.01608 3.23522 0.857143 3.2982 0.664144 3.2982C0.471145 3.2982 0.312205 3.23522 0.187323 3.10924ZM13.7427 3.10924C13.6178 3.23522 13.4589 3.2982 13.2659 3.2982C13.0729 3.2982 12.9139 3.23522 12.789 3.10924L10.8477 1.15093C10.7228 1.02496 10.6604 0.864633 10.6604 0.669947C10.6604 0.475262 10.7228 0.314932 10.8477 0.188959C10.9726 0.0629864 11.1315 0 11.3245 0C11.5175 0 11.6765 0.0629864 11.8013 0.188959L13.7427 2.14727C13.8676 2.27324 13.93 2.43357 13.93 2.62825C13.93 2.82294 13.8676 2.98327 13.7427 3.10924Z"
            fill="url(#wakeIconGradient)"
            transform={`translate(${wakePoint.x - 7}, ${wakePoint.y - 7})`}
          />

          <SvgText x={radius} y={radius - labelRadius + 20} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">
            0
          </SvgText>
          <SvgText x={radius + labelRadius - 20} y={radius + 5} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">
            6
          </SvgText>
          <SvgText x={radius} y={radius + labelRadius - 20} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">
            12
          </SvgText>
          <SvgText x={radius - labelRadius + 20} y={radius + 5} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">
            18
          </SvgText>
        </Svg>

        <Image
          source={require('../assets/general_images/clockIntervals.png')}
          style={{
            position: 'absolute',
            width: 170,
            height: 170,
            left: radius - 85,
            top: radius - 85,
            resizeMode: 'contain',
            zIndex: 2,
          }}
          pointerEvents="none"
        />

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}
        >
          <Text style={{ ...textStyles.reg11, fontWeight:'bold' ,fontSize: 22,lineHeight:30,top:5 ,color: 'white' }}>{sleepLabel}</Text>
          <Text style={{ ...textStyles.reg11, fontSize:9 , color: 'rgba(255,255,255,0.65)', top:-2 }}>Sleep Duration</Text>
        </View>
      </View>

    </View>
  );
};

export default CircularAlarmSetPanel;
