#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <Adafruit_NeoPixel.h> // 引入灯带库

// ======== WiFi & MQTT 配置 ========
const char* ssid        = "Nan Mate 60 Pro"; 
const char* password    = "88888888";
const char* mqtt_server = "150.158.158.233";
const int   mqtt_port   = 1883;

const char* topic_power = "pillow/cmd/power";
const char* topic_alarm = "pillow/cmd/alarm";
const char* topic_state = "pillow/status/state";

// ======== NTP 时间配置 ========
const char* ntp_server = "pool.ntp.org";
const long  gmt_offset_sec      = 8 * 3600; // 中国时区
const int   daylight_offset_sec = 0;

// ======== 硬件引脚：WS2812B 灯带 ========
#define LED_PIN    2
#define LED_COUNT  38

// 初始化 NeoPixel 对象
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

WiFiClient espClient;
PubSubClient client(espClient);

// ========== 闹钟配置 & 状态结构 ==========
struct AlarmConfig {
  String bedtime;
  String sunrise_time;
  String wakeup_time;
  int    repeat_interval_min = 5;

  String   name;
  String   preset_id;
  uint64_t created_at_ts = 0;
  String   created_at_local;

  uint64_t next_ring_ts = 0;
  String   next_ring_local;

  bool valid = false;
};

struct PillowState {
  bool   ok = false;
  String status;          // "OFF" / "WAITING" / "WAKING" / "AWAKE_RINGING" / "AWAKE_REPEAT"
  int    brightness = 0;  // 0-100
  bool   is_ringing = false; // 
  bool   is_light_on = false;

  uint64_t now_ts = 0;
  String   now_local;
  String   sunrise_time_local;
  String   wakeup_time_local;
};

AlarmConfig g_alarm;
PillowState g_state;

// 【新增】全局关机标志：收到 power=off 后置 true
bool g_forcedOff = false;

// ======== 工具函数声明 ========
void setup_wifi();
void reconnect();
void syncTime();

void callback(char* topic, byte* payload, unsigned int length);
void AnalysePowerCMD(const String& jsonData);
void handleAlarmCommand(const char* json);
void updateAlarmState();
void publishAlarmState();

uint64_t nowMs();
uint64_t tsFor(const String& timeStr);
void setPillowLedBrightness(int percent);

// ======== setup ========
void setup() {
  Serial.begin(115200);

  // 初始化灯带
  strip.begin();
  strip.show();            // 所有像素关
  strip.setBrightness(50); // 全局亮度上限（0-255）

  // 板载 LED 用于指示 WiFi 状态
  pinMode(BUILTIN_LED, OUTPUT);
  digitalWrite(BUILTIN_LED, HIGH); // 灭

  setup_wifi();
  syncTime();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ======== loop ========
unsigned long lastUpdate = 0;

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastUpdate > 2000) {  // 每 2 秒更新一次
    lastUpdate = now;

    updateAlarmState();       // 计算状态
    publishAlarmState();      // 上报状态

    // 用状态控制灯带
    setPillowLedBrightness(g_state.brightness);
  }
}

// ================== WiFi & MQTT ==================

void setup_wifi() {
  digitalWrite(BUILTIN_LED, LOW);  // 亮灯表示正在连接
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    retry++;
    if (retry > 40) {
      Serial.println("\nWiFi connect timeout, restarting...");
      ESP.restart();
    }
  }
  randomSeed(micros());
  Serial.println("\nWiFi connected ✅");
  Serial.println(WiFi.localIP());
  digitalWrite(BUILTIN_LED, HIGH); // 连接成功后灭灯
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection... ");
    String clientId = "ESP8266-";
    clientId += WiFi.localIP().toString().c_str();

    if (client.connect(clientId.c_str())) {
      Serial.println("connected ✅");
      client.publish(topic_power, "connected");
      client.subscribe(topic_power);
      client.subscribe(topic_alarm);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void syncTime() {
  Serial.println("Syncing time with NTP...");
  configTime(gmt_offset_sec, daylight_offset_sec, ntp_server);
  time_t nowSec = time(nullptr);
  int retry = 0;
  while (nowSec < 8 * 3600 * 2 && retry < 30) {
    delay(1000);
    Serial.print(".");
    nowSec = time(nullptr);
    retry++;
  }
  Serial.println("\nTime sync done.");
}

// ================== MQTT 回调 ==================
void callback(char* topic, byte* payload, unsigned int length) {
  String json;
  for (unsigned int i = 0; i < length; i++) {
    json += (char)payload[i];
  }
  String t(topic);
  Serial.print("MQTT incoming [");
  Serial.print(t);
  Serial.print("] ");
  Serial.println(json);

  if (t == topic_power) {
    AnalysePowerCMD(json);
  } else if (t == topic_alarm) {
    handleAlarmCommand(json.c_str());
    updateAlarmState();
    publishAlarmState();
  }
}

// ================== 开关电源指令 ==================
void AnalysePowerCMD(const String& jsonData) {
  StaticJsonDocument<200> doc;
  DeserializationError err = deserializeJson(doc, jsonData);
  if (err) {
    Serial.print("Power CMD JSON error: ");
    Serial.println(err.c_str());
    return;
  }

  const char* power = doc["power"];
  if (!power) return;

  if (strcmp(power, "off") == 0) {
    //进入关机模式
    g_forcedOff = true;

    strip.clear();
    strip.show();

    g_state.ok          = true;
    g_state.status      = "OFF";
    g_state.brightness  = 0;
    g_state.is_ringing  = false;
    g_state.is_light_on = false;
    g_state.now_ts      = nowMs();

    time_t nowSec = g_state.now_ts / 1000ULL;
    g_state.now_local = String(ctime(&nowSec));

    publishAlarmState();
    Serial.println("Power OFF: enter OFF mode.");
  } else if (strcmp(power, "on") == 0) {
    //退出关机模式，恢复闹钟逻辑
    g_forcedOff = false;
    Serial.println("Power ON: resume alarm logic.");
    updateAlarmState();
    publishAlarmState();
  }
}

// ================== Alarm 逻辑 ==================

uint64_t nowMs() {
  time_t nowSec = time(nullptr);
  return (uint64_t)nowSec * 1000ULL;
}

uint64_t tsFor(const String& timeStr) {
  int h, m;
  if (sscanf(timeStr.c_str(), "%d:%d", &h, &m) != 2) return 0;
  time_t nowSec = time(nullptr);
  struct tm t;
  localtime_r(&nowSec, &t);
  t.tm_hour = h;
  t.tm_min  = m;
  t.tm_sec  = 0;
  time_t targetSec = mktime(&t);
  uint64_t targetMs = (uint64_t)targetSec * 1000ULL;
  uint64_t curMs = nowMs();
  // 如果时间点已经过去太久（>12h），认为是明天
  if (targetMs < curMs - 12ULL * 60 * 60 * 1000ULL) {
    targetSec += 24 * 60 * 60;
    targetMs = (uint64_t)targetSec * 1000ULL;
  }
  return targetMs;
}

void handleAlarmCommand(const char* json) {
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, json);
  if (err) {
    Serial.print("Alarm CMD JSON error: ");
    Serial.println(err.c_str());
    return;
  }

  const char* bedtime     = doc["bedtime"];
  const char* sunriseTime = doc["sunrise_time"];
  const char* wakeupTime  = doc["wakeup_time"];

  if (!bedtime || !sunriseTime || !wakeupTime) {
    Serial.println("Missing bedtime / sunrise_time / wakeup_time");
    return;
  }

  g_alarm.bedtime      = bedtime;
  g_alarm.sunrise_time = sunriseTime;
  g_alarm.wakeup_time  = wakeupTime;
  g_alarm.name         = doc["name"] | "";
  g_alarm.preset_id    = doc["preset_id"] | "";
  g_alarm.repeat_interval_min = doc["repeat_interval_min"] | 5;

  g_alarm.created_at_ts = nowMs();
  time_t nowSec = time(nullptr);
  g_alarm.created_at_local = String(ctime(&nowSec));
  g_alarm.valid = true;

  Serial.println("Alarm config updated.");
}

void updateAlarmState() {
  uint64_t now_ts = nowMs();

  // 如果没有闹钟配置
  if (!g_alarm.valid) {
    g_state.ok          = false;
    g_state.status      = "NO_ALARM";
    g_state.brightness  = 0;
    g_state.is_ringing  = false;
    g_state.is_light_on = false;
    g_state.now_ts      = now_ts;
    time_t nowSec       = now_ts / 1000ULL;
    g_state.now_local   = String(ctime(&nowSec));
    return;
  }

  // 如果处于关机模式，闹钟逻辑全部停
  if (g_forcedOff) {
    g_state.ok          = true;
    g_state.status      = "OFF";
    g_state.brightness  = 0;
    g_state.is_ringing  = false;
    g_state.is_light_on = false;
    g_state.now_ts      = now_ts;

    time_t nowSec = now_ts / 1000ULL;
    g_state.now_local = String(ctime(&nowSec));
    return;
  }

  uint64_t sunriseTs = tsFor(g_alarm.sunrise_time);
  uint64_t wakeTs    = tsFor(g_alarm.wakeup_time);

  if (wakeTs <= sunriseTs) {
    // 保底：若设置了奇怪时间，强制让 wake 比 sunrise 晚
    wakeTs = sunriseTs + 30ULL * 60 * 1000ULL; // 默认延后 30 分钟
  }

  uint64_t wakeStartTs = sunriseTs;
  uint64_t alarmTs     = wakeTs;

  String status;
  int  brightness = 0;
  bool isRinging  = false;

  if (now_ts < wakeStartTs) {
    // 1. 等待日出
    status     = "WAITING";
    brightness = 0;
    isRinging  = false;
  } else if (now_ts < alarmTs) {
    // 2. 日出渐亮阶段
    status = "WAKING";
    double prog = double(now_ts - wakeStartTs) / double(alarmTs - wakeStartTs);
    if (prog < 0.0) prog = 0.0;
    if (prog > 1.0) prog = 1.0;
    brightness = (int)round(prog * prog * 100.0); // 二次曲线
    if (brightness > 100) brightness = 100;
    isRinging = false;
  } else {
    // 3. 已到唤醒时间以后
    brightness = 100;

    uint64_t repeatMs = (uint64_t)g_alarm.repeat_interval_min * 60ULL * 1000ULL;
    if (repeatMs == 0) repeatMs = 5ULL * 60 * 1000ULL;

    uint64_t diff          = now_ts - alarmTs;
    uint64_t timesSinceWake = diff / repeatMs;
    uint64_t lastRingTs    = alarmTs + timesSinceWake * repeatMs;

    // 【修改】不再只给 10 秒窗口：
    // 只要时间 >= wakeup_time 且没有关机，就一直 isRinging = true
    isRinging = true;

    if (timesSinceWake == 0) status = "AWAKE_RINGING";
    else status = "AWAKE_REPEAT";

    // 记录下次响铃时间（供 UI 显示）
    uint64_t nextRingTs = alarmTs + (timesSinceWake + 1) * repeatMs;
    g_alarm.next_ring_ts = nextRingTs;
    time_t nextSec = nextRingTs / 1000ULL;
    g_alarm.next_ring_local = String(ctime(&nextSec));
  }

  g_state.ok          = true;
  g_state.status      = status;
  g_state.brightness  = brightness;
  g_state.is_ringing  = isRinging;
  g_state.is_light_on = (brightness > 0);
  g_state.now_ts      = now_ts;

  time_t nowSec = now_ts / 1000ULL;
  g_state.now_local = String(ctime(&nowSec));
  time_t sunriseSec = sunriseTs / 1000ULL;
  g_state.sunrise_time_local = String(ctime(&sunriseSec));
  time_t wakeSec = wakeTs / 1000ULL;
  g_state.wakeup_time_local  = String(ctime(&wakeSec));
}

void publishAlarmState() {
  if (!g_state.ok) return;
  StaticJsonDocument<1024> doc;
  doc["ok"]          = g_state.ok;
  doc["status"]      = g_state.status;
  doc["brightness"]  = g_state.brightness;
  doc["is_ringing"]  = g_state.is_ringing;
  doc["is_light_on"] = g_state.is_light_on;

  // doc["now_local"] = g_state.now_local;

  char buffer[1024];
  size_t n = serializeJson(doc, buffer, sizeof(buffer));
  client.publish(topic_state, (uint8_t*)buffer, n);
}

// ================== LED 控制 ==================

// 根据 0-100 的百分比返回日出渐变色（暖黄 -> 暖白 -> 白）
uint32_t getSunriseColor(int percent) {
  if (percent <= 0) return strip.Color(0, 0, 0);
  if (percent >= 100) return strip.Color(255, 255, 255);

  float p = percent / 100.0f;  // 0.0 ~ 1.0
  uint8_t r, g, b;

  if (p < 0.5f) {
    // 前半段：暖黄 (255, 200, 80) -> 暖白 (255, 235, 200)
    float t = p / 0.5f;  // 0 ~ 1
    r = 255;
    g = 200 + (uint8_t)(35 * t);   // 200 -> 235
    b = 80  + (uint8_t)(120 * t);  // 80  -> 200
  } else {
    // 后半段：暖白 (255, 235, 200) -> 纯白 (255, 255, 255)
    float t = (p - 0.5f) / 0.5f;   // 0 ~ 1
    r = 255;
    g = 235 + (uint8_t)(20 * t);   // 235 -> 255
    b = 200 + (uint8_t)(55 * t);   // 200 -> 255
  }

  return strip.Color(r, g, b);
}

void setPillowLedBrightness(int percent) {
  if (percent < 0)   percent = 0;
  if (percent > 100) percent = 100;

  // 关机模式下，无论 brightness 如何，都强制关灯
  if (g_forcedOff) {
    strip.clear();
    strip.show();
    return;
  }

  if (percent == 0) {
    strip.clear();
    strip.show();
    return;
  }

  // 1. 获取当前进度对应的颜色
  uint32_t color = getSunriseColor(percent);

  // 2. 映射整体亮度 0-255
  int logicBrightness = map(percent, 0, 100, 0, 255);
  strip.setBrightness(logicBrightness);

  // 3. 填充灯珠并显示
  strip.fill(color);
  strip.show();

  Serial.print("DEBUG brightness = ");
  Serial.print(percent);
  Serial.println("%");
}
