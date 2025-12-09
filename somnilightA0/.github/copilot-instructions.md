# Somnilight AI Coding Instructions

## Project Overview
Somnilight is a React Native + Expo mobile app for smart alarm/light control with a Node-RED backend integration. The app manages sleep schedules and allows users to adjust light brightness and color through an intuitive UI.

**Key Technologies:**
- React Native 0.81.5 with Expo 54.0.25
- React Navigation (bottom tabs + native stack)
- Gesture-based controls (react-native-gesture-handler)
- UI: BlurView, LinearGradient, Bottom sheets, Custom sliders
- Backend: Node-RED API at `http://somnilight.online:1880/`

---

## Architecture & Key Patterns

### Navigation Structure
```
App.js (root)
├── RootTabs (BottomTabNavigator)
│   ├── HomeStack (Native Stack)
│   │   ├── Home (HomeScreen)
│   │   └── LightAdjust
│   ├── Stats (StatsScreen)
│   └── Myinfo (MyinfoScreen)
└── HomeAlarmSet (modal-like screen)
```

**Pattern:** Bottom-tab navigation wraps Home in a stack to allow nested navigation. `HomeAlarmSet` is registered as a separate root stack screen for modal-like behavior accessed via `navigation.navigate('HomeAlarmSet')`.

### Shared State & Data
- **Hardcoded constants:** Live alarm settings defined as `liveAlarmSettings` object in `HomeAlarmSet.js` (bedtime, sunrise, wakeup times, repeat days, preset_id)
- **Device dimensions:** Exported from `App.js` as `deviceHeight` (852) and `deviceWidth` (393)
- **Backend sync:** `LightAdjust.js` fetches initial brightness from Node-RED on mount and sends updates via API

### Styling Approach
Centralized in `styles.js` using React Native's `StyleSheet.create()`:
- **textStyles:** PingFang font variants (medium16, reg11, semibold15)
- **containers:** Reusable layouts (CenterAJ for flex center, violetLight/Dark containers with alpha)
- **colors:** Edge borders, tab bar transparency using RGBA
- **ele:** Icon sizes and generic borders

**Pattern:** Apply styles via spread operator (e.g., `{...textStyles.semibold15}`). Theme color is white with dark purple/violet containers.

---

## Component Patterns

### Screen Components
Each screen file exports a component (capitalized for default/named export):
- `HomeScreen`: Main hub with preset buttons, current alarm info, gesture navigation to `LightAdjust`
- `HomeAlarmSetScreen`: Alarm configuration panel with day selector, time pickers, preset selector
- `LightAdjust`: Brightness/color slider with gesture responder and Node-RED API calls
- `StatsScreen`, `MyinfoScreen`: Placeholder screens (CenterAJ container + label)

**Pattern:** Screens use `navigation` prop from React Navigation; access via `navigation.navigate(screenName)` or `navigation.goBack()`.

### Sub-components (Local)
Defined within screen files as functional components:
- `DaySetCell`: Day of week button (Mo, Tu, We, etc.)
- `TimeSetCell`: Time selector with animation
- `OtherSetCell`: Label + value display (alarm name, preset, interval)
- `CusHeader`: Custom header with back button and title

**Pattern:** Accept props (`{navigation, title, live, DoW, etc.}`), use inline styles or style spreads, no separate files.

### Gesture & Interaction
- **PanResponder** in `LightAdjust.js`: Tracks vertical drag for brightness slider
- **TouchableOpacity/TouchableHighlight:** Standard press handlers
- **Modal:** `react-native-modal` for custom modals (e.g., time picker in `HomeAlarmSet`)
- **Bottom sheets:** `@gorhom/bottom-sheet` with gesture handler (seen in `App-bottom.js`, not yet integrated)

---

## Build & Deployment

### Development Commands
```bash
npm start                # Start Expo dev server (with --dev-client for native modules)
npm run ios              # Build and run on iOS simulator
npm run android          # Build and run on Android emulator
npm run web              # Start web version
```

### Platform Configuration
- **metro.config.js:** Standard Expo Metro config (no customization needed)
- **react-native.config.js:** Registers custom fonts in `assets/fonts/`
- **iOS (Podfile):** Managed by Expo, native build in `ios/somnilightA0.xcworkspace`
- **Android (gradle):** Standard RN setup in `android/app/build.gradle`

### Note on index.js
Currently points to `HomeAlarmSetScreen` (likely for development). In production, should point to `App` (root).

---

## API & Backend Integration

### Node-RED Endpoints
- **GET `/get_state`:** Returns current device state (brightness, color)
  ```javascript
  // Example (LightAdjust.js)
  const res = await fetch('http://somnilight.online:1880/get_state');
  const data = await res.json();
  ```
- **POST `/set_brightness` (inferred):** Updates brightness value

**Pattern:** Async/await with try-catch, no centralized API client (inline fetch).

---

## Development Conventions

### Naming
- **Files:** PascalCase for screens (HomeAlarmSet.js), camelCase for utilities
- **Components:** PascalCase for exported React components
- **Variables:** camelCase for state, props, functions; UPPERCASE for constants (COLOR_OPTIONS)

### Imports
- Group by: React fundamentals → Third-party (navigation, ui) → Local assets (styles, screens)
- Relative paths for local imports (e.g., `../styles`, `./HomeAlarmSet.js`)

### State Management
- Local component state via `useState` (no Redux/Context yet)
- Props passed down for configuration and callbacks

### Assets
- **Fonts:** `assets/fonts/` (PingFang variants)
- **Images:** `assets/general_images/` (HP background, alarm set BG)
- **Icons:** `assets/icons/` (moonsleep, timer, alarm set icons)

---

## Common Tasks

### Adding a New Screen
1. Create `screens/MyScreen.js` with functional component
2. Import in `App.js` or relevant navigator
3. Add to tab navigator or stack with `<Tabs.Screen name="MyScreen" component={MyScreen} />`
4. Use `styles.js` exports for consistent theming

### Updating UI
- Modify inline styles or add to `styles.js` (prefer StyleSheet for performance)
- Use theme colors from `colors` object (RGBA values for transparency)
- Test on both iOS simulator and Android emulator

### Adding Backend Features
- Add new endpoint handling in `LightAdjust.js` pattern (fetch with error handling)
- Consider extracting to centralized API service if multiple endpoints grow

---

## Known Quirks & Gotchas

- **Device dimensions hardcoded:** If resizing UI, update `deviceHeight`/`deviceWidth` in `App.js`
- **No persistent state:** Alarm settings and brightness reset on app reload (no AsyncStorage)
- **Mock data:** `liveAlarmSettings` is static; not read from backend yet
- **Tab bar styling:** Uses `BlurView` overlay; ensure `expo-blur` is installed
- **Index.js entry point:** Currently points to `HomeAlarmSetScreen`; verify for main builds

---

## References
- **App entry:** `App.js` (root navigation structure)
- **Styling hub:** `styles.js` (all theme constants)
- **Alarm logic:** `HomeAlarmSet.js` (data structure and UI patterns)
- **Backend integration:** `LightAdjust.js` (API calls and state sync)
