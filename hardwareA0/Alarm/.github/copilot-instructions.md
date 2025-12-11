# Somnilight Hardware A0 - AI Coding Instructions

## Project Overview
ESP8266-based smart alarm clock with WS2812B LED strip control. Implements sunrise simulation using MQTT commands and NTP time synchronization. Hardware revision A0.

## Architecture

### Core Components
- **WiFi/MQTT Client**: Connects to MQTT broker at `150.158.158.233:1883`
- **Time Sync**: NTP-based with GMT+8 timezone (China)
- **LED Control**: 38-pixel WS2812B strip on GPIO2, sunrise gradient simulation
- **State Machine**: `WAITING` → `WAKING` → `AWAKE_RINGING` → `AWAKE_REPEAT` → `OFF`

### MQTT Topics
- `pillow/cmd/power` - Power on/off commands (`{"power": "on|off"}`)
- `pillow/cmd/alarm` - Alarm configuration with bedtime, sunrise_time, wakeup_time
- `pillow/status/state` - Device state broadcast (every 2s)

### State Management
Two global structs drive all logic:
- `AlarmConfig g_alarm` - Immutable config from MQTT, includes next_ring_ts calculation
- `PillowState g_state` - Current runtime state computed in `updateAlarmState()`
- `bool g_forcedOff` - Global override flag, bypasses all alarm logic when true

## Key Patterns

### Timestamp Handling
All time calculations use `uint64_t` milliseconds since epoch. The `tsFor()` function converts "HH:MM" strings to absolute timestamps with smart tomorrow-detection (if time < now - 12h, assume next day).

### Brightness Progression
Quadratic curve during WAKING phase: `brightness = (int)(progress² * 100)` where progress = (now - sunrise_ts) / (wakeup_ts - sunrise_ts). Provides natural-feeling acceleration.

### Color Gradient
`getSunriseColor(percent)` implements two-stage transition:
- 0-50%: Warm yellow (255,200,80) → Warm white (255,235,200)
- 50-100%: Warm white → Pure white (255,255,255)

### Forced-Off Behavior
When `g_forcedOff=true` (from power:off command), `updateAlarmState()` and `setPillowLedBrightness()` immediately return with status="OFF" and brightness=0, bypassing all time-based logic.

## Development Workflow

### Build & Upload
Use Arduino IDE or PlatformIO with ESP8266 board support. No custom build scripts.

### Dependencies
- ESP8266WiFi (core)
- PubSubClient (MQTT)
- ArduinoJson v6+
- Adafruit_NeoPixel

### Testing Alarm Logic
1. Set `sunrise_time` 2-3 minutes in future, `wakeup_time` 1 minute after sunrise
2. Monitor Serial output (115200 baud) for state transitions
3. Check `DEBUG brightness = X%` logs for LED output
4. Test power:off during each state to verify forced-off behavior

### Common Gotchas
- Time sync must complete before alarm calculations work (check Serial for "Time sync done")
- `wakeup_time` must be > `sunrise_time` or code auto-adjusts to +30min
- MQTT reconnect blocking - avoid long delays in loop()
- Strip brightness is global (0-255) AND per-pixel color - both affect final output

## File References
- `Alarm.ino` - Monolithic file, all logic inline (no separate headers)
- State flow: Line 100-130 (struct definitions), Line 290-390 (`updateAlarmState`)
- LED control: Line 440+ (`getSunriseColor`, `setPillowLedBrightness`)
