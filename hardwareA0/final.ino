#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>

const char* WIFI_SSID     = "BambuLab_3088_2.4G";
const char* WIFI_PASSWORD = "BLWL3088";

const char* MQTT_SERVER   = "150.158.158.233";
const int   MQTT_PORT     = 1883;

#define TOPIC_BRIGHTNESS "lamp/brightness"
#define TOPIC_COLOR      "lamp/color"
#define TOPIC_VOLUME     "pillow/volume"
#define TOPIC_MUSIC      "pillow/music"

#define LED_PIN 2            // D4
#define LED_COUNT 38
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

int brightness = 65;
uint32_t currentColor = 0xFFFFFF;

// 校色（解决蓝偏）
float CAL_R = 1.0;
float CAL_G = 0.60;
float CAL_B = 0.50;

#define BUZZER_PIN 14        // D5 = GPIO14
int volumeLevel = 60;

int melody_0[] = { 523, 587, 659, 698, 784 };
int melody_1[] = { 784, 698, 659, 587, 523 };
int melody_2[] = { 523, 523, 784, 784, 659 };
int melody_3[] = { 659, 698, 784, 988, 1046 };
int melody_4[] = { 440, 523, 660, 880, 990 };

int* melodies[] = { melody_0, melody_1, melody_2, melody_3, melody_4 };
int music_len = 5;

WiFiClient espClient;
PubSubClient client(espClient);

void applyLED() {
  strip.clear();

  uint8_t r = (currentColor >> 16) & 0xFF;
  uint8_t g = (currentColor >> 8)  & 0xFF;
  uint8_t b =  currentColor         & 0xFF;

  // 色彩校准
  r = min(255, int(r * CAL_R));
  g = min(255, int(g * CAL_G));
  b = min(255, int(b * CAL_B));

  strip.setBrightness(map(brightness, 0, 100, 0, 255));

  for (int i = 0; i < LED_COUNT; i++) {
    strip.setPixelColor(i, r, g, b);
  }
  strip.show();
}

uint32_t hexToColor(String hex) {
  if (hex.startsWith("#")) hex.remove(0, 1);
  if (hex.length() != 6) return 0xFFFFFF;
  return (uint32_t)strtol(hex.c_str(), NULL, 16);
}

void playTone(int freq, int duration) {
  if (freq == 0 || volumeLevel == 0) {
    // Skip tone if frequency is 0 or volume is muted
    noTone(BUZZER_PIN);
    delay(duration);
    return;
  }

  // Calculate PWM duty cycle based on volume level
  int pwmValue = map(volumeLevel, 0, 100, 0, 1023);
  float dutyCycle = pwmValue / 1023.0;  // 0.0 to 1.0

  // Period in microseconds
  unsigned long period = 1000000 / freq;
  unsigned long onTime = (unsigned long)(period * dutyCycle);
  unsigned long offTime = period - onTime;

  // Generate square wave with volume-controlled duty cycle
  unsigned long startTime = micros();
  unsigned long elapsedTime = 0;

  while (elapsedTime < (duration * 1000)) {
    // Toggle high
    digitalWrite(BUZZER_PIN, HIGH);
    delayMicroseconds(onTime);

    // Toggle low
    digitalWrite(BUZZER_PIN, LOW);
    delayMicroseconds(offTime);

    elapsedTime = micros() - startTime;
  }

  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

void playMusic(int idx) {
  if (idx < 0 || idx > 4) return;

  int* melody = melodies[idx];

  Serial.printf("Playing music #%d (volume: %d%%)\n", idx, volumeLevel);

  for (int i = 0; i < music_len; i++) {
    playTone(melody[i], 250);
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
    delay(40);
  }

  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

void callback(char* topic, byte* payload, unsigned int length) {
  payload[length] = '\0';
  String msg = String((char*)payload);

  Serial.printf("MQTT <- [%s] : %s\n", topic, msg.c_str());

  // 调整亮度
  if (String(topic) == TOPIC_BRIGHTNESS) {
    brightness = constrain(msg.toInt(), 0, 100);
    applyLED();
  }

  // 调整颜色
  if (String(topic) == TOPIC_COLOR) {
    currentColor = hexToColor(msg);
    applyLED();
  }

  // 调整音量
  if (String(topic) == TOPIC_VOLUME) {
    volumeLevel = constrain(msg.toInt(), 0, 100);
    Serial.printf("Volume updated to: %d%%\n", volumeLevel);
  }

  // 播放音乐
  if (String(topic) == TOPIC_MUSIC) {
    int idx = msg.toInt();
    playMusic(idx);
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("Connecting MQTT...");

    if (client.connect("ESP-LED-MUSIC")) {
      Serial.println("MQTT Connected!");

      client.subscribe(TOPIC_BRIGHTNESS);
      client.subscribe(TOPIC_COLOR);
      client.subscribe(TOPIC_VOLUME);
      client.subscribe(TOPIC_MUSIC);

    } else {
      Serial.print("Fail rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

/* ======================= 主程序 ======================= */

void setup() {
  Serial.begin(115200);

  // LED
  strip.begin();
  strip.show();

  // 蜂鸣器
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  connectWiFi();

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);

  applyLED();

  Serial.println("Setup complete!");
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
}
