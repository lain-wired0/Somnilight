# Somnilight AI Coding Instructions

## Project Overview
Somnilight is a React Native + Expo mobile app for smart alarm/light control with dual-backend integration (Node-RED for device control + health data API). The app manages sleep schedules, controls smart lights/sound, tracks sleep metrics, and manages preset configurations.

**Tech Stack:**
- React Native 0.81.5 with Expo 54.0.25
- React Navigation (bottom tabs + nested stacks)
- AsyncStorage for local caching
- Custom gesture controls (PanResponder)
- Backend: Node-RED at `http://somnilight.online:1880/` and health API at `http://150.158.158.233:1880/`

---

## Navigation Architecture

```
App.js (NavigationContainer root)
├── Stacks.Navigator (root stack)
│   ├── RootTabs (screen, renders BottomTabNavigator)
│   │   ├── Home (tab, renders HomeStack)
│   │   │   └── HomeStack (NativeStackNavigator)
│   │   │       └── Home (screen: HomeScreen)
│   │   ├── Stats (tab: StatsScreen with Day/Week/Month views)
│   │   └── Myinfo (tab: MyinfoScreen)
│   ├── HomeAlarmSet (screen: modal-style alarm editor)
│   └── Preset (screen: preset manager with arc sliders)
```

**Critical Pattern:** New screens must be added to the root `Stacks.Navigator` in `App.js` (NOT to individual tabs) if they need cross-navigation access. The `HomeStack` is a nested navigator inside the `Home` tab to allow future screen additions within that flow.

**Navigation Commands:**
```javascript
navigation.navigate('HomeAlarmSet')  // From any screen to alarm editor
navigation.navigate('Preset')         // From any screen to preset manager
navigation.goBack()                   // Return to previous screen
```

---

## Data Architecture & State Management

### Three-Layer Storage Model
1. **UI State:** React `useState` hooks in components (ephemeral)
2. **Local Cache:** AsyncStorage (persists across app restarts)
3. **Server Sync:** Debounced API calls to Node-RED backend

**Critical Flow Example (HomeAlarmSet.js):**
```javascript
// User edits alarm → Update state → Save to AsyncStorage → Debounced sync to server
useEffect(() => {
  const alarmConfig = { bedtime, sunrise_time, wakeup_time, days, preset_id, ... };
  AsyncStorage.setItem('activeAlarmConfig', JSON.stringify(alarmConfig));
  syncAlarmToServerDebounced(alarmConfig, retryCallback); // From utils/ServerSync.js
}, [bedtimeHour, bedtimeMin, sunriseHour, ...]);
```

### Shared Constants
- **Device dimensions:** Exported from `App.js` as `deviceHeight` (852) and `deviceWidth` (393) - hardcoded for specific device
- **Alarm configs:** Stored in AsyncStorage with key `'alarmConfigs'` as JSON object mapping alarm names to config objects
- **Presets:** Managed via `utils/PresetStorage.js` with functions `savePresetsToStorage()`, `loadPresetsFromStorage()`

---

## Backend Integration Patterns

### Server Endpoints (utils/ServerSync.js)
```javascript
// Alarm sync (debounced to 5s intervals)
POST http://somnilight.online:1880/pillow/alarm
Body: { bedtime, sunrise_time, wakeup_time, days, name, preset_id, repeat_interval_min }

// Device control
POST http://150.158.158.233:1880/set_state
Body: { brightness: 0-100, color: "#RRGGBB" }

GET http://150.158.158.233:1880/get_state
Response: { brightness, color, volume, music }

// Sleep data (Stats screen)
GET http://somnilight.online:1880/pillow/sleep/score?date=YYYY-MM-DD
GET http://somnilight.online:1880/pillow/sleep/stages?date=YYYY-MM-DD&period=day
GET http://somnilight.online:1880/pillow/sleep/hr?date=YYYY-MM-DD
```

**Debouncing Pattern:** Use `syncAlarmToServerDebounced()` from `utils/ServerSync.js` for frequent updates. It prevents server overload by batching changes within 5-second windows and guarantees final state upload via `flushPendingSync()`.

**Throttling Pattern (LightAdjust.js):** Device control uses 200ms throttle + AbortController to cancel pending requests:
```javascript
const THROTTLE_INTERVAL = 200;
const lastSendTime = useRef(0);
const abortControllerRef = useRef(null);

if (abortControllerRef.current) {
  abortControllerRef.current.abort(); // Cancel previous request
}
const controller = new AbortController();
abortControllerRef.current = controller;
await fetch(url, { signal: controller.signal, ... });
```

---

## Custom Gesture Components

### CircularAlarmSetPanel (screens/CircularAlarmSetPanel.js)
Circular time picker with three draggable handles (bedtime, sunrise, wakeup). Uses PanResponder for direct SVG manipulation.

**Key Pattern:**
```javascript
const panResponder = useRef(PanResponder.create({
  onStartShouldSetPanResponder: (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    return !!isNearHandle(locationX, locationY, threshold=28); // Hit detection
  },
  onPanResponderMove: (evt) => {
    const angle = getTouchAngle(locationX, locationY);
    const newTime = angleToTime(angle); // Convert angle → {h, m}
    onWakeupChange(newTime.h, newTime.m); // Callback to parent
  },
}));
```

**Time Conversion:**
- `timeToAngle(h, m)`: Converts 24h time to 0-360° (12:00 AM = 0°, 12:00 PM = 180°)
- `angleToTime(angle)`: Reverse conversion, snapped to 5-minute increments

### InteractiveArcSlider (screens/components/InteractiveArcSlider.js)
Semicircular slider for brightness/volume (0-100%). Receives `colors` prop for gradient customization:
```javascript
<InteractiveArcSlider
  percentage={brightness}
  onValueChange={(val) => setBrightness(val)}
  colors={['#F7CD62', '#FFEAB4']} // [dark, light] gradient
/>
```

---

## Styling System (styles.js)

All global styles centralized in `styles.js`. Import and spread into components:

```javascript
import { textStyles, containers, colors, ele } from '../styles';

// Usage
<Text style={{...textStyles.semibold15, fontSize: 20}}>Title</Text>
<View style={containers.violetLightC20} />
```

**Available Exports:**
- `textStyles`: `medium16`, `reg11`, `semibold15` (PingFang font family)
- `containers`: `CenterAJ` (flex center), `violetLightC20` (RGBA background), `presetButton`
- `colors`: `edge` (border color rgba)
- `ele`: `icon50`, `gnrborder`
- `Icon12text11`: Helper component for icon+text pairs

**Theme:** White text (`themeTextColor = 'white'`) on dark purple/violet translucent containers. All transparency uses RGBA values.

---

## Development Workflow

### Running the App
```bash
npm start              # Expo dev server (use --dev-client for custom native modules)
npm run ios            # iOS simulator (requires Xcode)
npm run android        # Android emulator (requires Android Studio)
```

**Entry Point:** `index.js` imports `App` from `App.js` (verify if switching development focus - currently correct)

### Debugging Network Requests
All `fetch()` calls include console logging. Check Metro bundler output for:
```
[Sync] Executing debounced sync with latest alarm config
[LightAdjust] SENDING to server: { brightness: 75 }
```

### Testing Gestures
- **CircularAlarmSetPanel:** Requires testing on physical device or simulator with touch input (not Expo web)
- **InteractiveArcSlider:** Works in web for basic testing, verify final behavior on iOS/Android

---

## Common Patterns & Conventions

### Import Grouping
```javascript
// 1. React fundamentals
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party libraries
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

// 3. Navigation
import { useNavigation } from '@react-navigation/native';

// 4. Local assets & styles
import { textStyles, containers } from '../styles';
import { deviceWidth } from '../App';

// 5. Local components/screens
import LightAdjust from './LightAdjust';
```

### File Naming
- Screens: PascalCase (`HomeAlarmSet.js`, `Stats.js`)
- Utils: PascalCase (`PresetStorage.js`, `ServerSync.js`)
- Components: PascalCase (`InteractiveArcSlider.js`)
- Assets: lowercase with underscores (`hp_asm.png`, `bg_stats.png`)

### State & Refs Pattern
When building gesture components that need to track both immediate and rendered state:
```javascript
const [value, setValue] = useState(50);        // Triggers re-renders
const valueRef = useRef(50);                   // Immediate access in callbacks

useEffect(() => {
  valueRef.current = value;  // Keep ref in sync
}, [value]);

// In PanResponder, use valueRef.current for latest value without re-creating handlers
```

---

## Critical Gotchas

1. **AsyncStorage is a Cache Layer:** Data in AsyncStorage is LOCAL ONLY. Server sync is required for persistence across devices. Always pair `AsyncStorage.setItem()` with a debounced server sync call.

2. **Device Dimensions Hardcoded:** `deviceWidth` (393) and `deviceHeight` (852) in `App.js` are for specific device. UI layout calculations use these constants - update if targeting different screen sizes.

3. **Debounce vs Throttle:**
   - Use `syncAlarmToServerDebounced()` for user edits (guarantees final state upload)
   - Use throttle pattern for continuous gestures (prevents request spam)

4. **PanResponder Hit Detection:** Always implement `onStartShouldSetPanResponder` with precise hit detection logic. Return `false` to allow other touch handlers in parent views.

5. **Navigation Context:** Screens inside tabs receive `navigation` prop automatically. Custom components need `useNavigation()` hook.

6. **Alert Deduplication:** ServerSync uses `isAlertCurrentlyVisible` flag to prevent multiple failure alerts. Check before implementing similar patterns.

---

## Key Files Reference

- **App.js:** Root navigation structure, device dimensions export, tab bar configuration
- **styles.js:** All global styles and theme constants
- **utils/ServerSync.js:** Debounced alarm sync with failure handling
- **utils/PresetStorage.js:** Preset CRUD operations for AsyncStorage
- **screens/HomeAlarmSet.js:** Alarm editor with CircularAlarmSetPanel integration
- **screens/LightAdjust.js:** Brightness/color control with throttled server updates
- **screens/Preset.js:** Preset manager with InteractiveArcSlider for light/sound curves
- **screens/Stats/Stats.js:** Sleep data visualization with Day/Week/Month tabs
