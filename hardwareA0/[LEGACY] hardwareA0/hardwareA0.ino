#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>


const char* ssid = "BambuLab_3088_2.4G";  //WiFi名
const char* password = "BLWL3088";  //WiFi密码
const char* mqtt_server = "150.158.158.233";  //MQTT服务器地址
const int mqtt_port = 1883;   //服务器连接端口
//const char* mqtt_name = "emqx";  //MQTT连接用户名（可选）
//const char* mqtt_password = "public";  //MQTT连接密码（可选）
const char* topic="pillow/cmd/power";   //订阅、发布的主题

/*
// NTP服务器设置
const char *ntp_server = "pool.ntp.org";     // 默认NTP服务器
// const char* ntp_server = "cn.pool.ntp.org"; // 为国内推荐的NTP服务器
const long gmt_offset_sec = 0;            // 以秒为单位的GMT时差（根据时区进行调整）
const int daylight_offset_sec = 0;        // 夏令时偏移量（秒）

// WiFi和MQTT客户端初始化
WiFiClientSecure espClient;
PubSubClient client(espClient);


// MQTT代理的SSL证书
// 如果使用公共服务器: broker.emqx.io的DigiCert Global Root G2
static const char ca_cert[]
PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDjjCCAnagAwIBAgIQAzrx5qcRqaC7KGSxHQn65TANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0xMzA4MDExMjAwMDBaFw0zODAxMTUxMjAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IEcyMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI
2/Ou8jqJkTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx
1x7e/dfgy5SDN67sH0NO3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQ
q2EGnI/yuum06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5Wz
tCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQ
vIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQABo0IwQDAP
BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV
5uNu5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY
1Yl9PMWLSn/pvtsrF9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4
NeF22d+mQrvHRAiGfzZ0JFrabA0UWTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NG
Fdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBHQRFXGU7Aj64GxJUTFy8bJZ91
8rGOmaFvE7FBcf6IKshPECBV1/MUReXgRPTqh5Uykw7+U0b6LJ3/iyK5S9kJRaTe
pLiaWN0bfVKfjllDiIGknibVb63dDcY3fe0Dkhvld1927jyNxF1WW6LZZm6zNTfl
MrY=
-----END CERTIFICATE-----
)EOF";*/

// 如果使用EMQX的Serverless服务
/*
static const char ca_cert[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDrzCCApegAwIBAgIQCDvgVpBCRrGhdWrJWZHHSjANBgkqhkiG9w0BAQUFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBD
QTAeFw0wNjExMTAwMDAwMDBaFw0zMTExMTAwMDAwMDBaMGExCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IENBMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4jvhEXLeqKTTo1eqUKKPC3eQyaKl7hLOllsB
CSDMAZOnTjC3U/dDxGkAV53ijSLdhwZAAIEJzs4bg7/fzTtxRuLWZscFs3YnFo97
nh6Vfe63SKMI2tavegw5BmV/Sl0fvBf4q77uKNd0f3p4mVmFaG5cIzJLv07A6Fpt
43C/dxC//AH2hdmoRBBYMql1GNXRor5H4idq9Joz+EkIYIvUX7Q6hL+hqkpMfT7P
T19sdl6gSzeRntwi5m3OFBqOasv+zbMUZBfHWymeMr/y7vrTC0LUq7dBMtoM1O/4
gdW7jVg/tRvoSSiicNoxBN33shbyTApOB6jtSj1etX+jkMOvJwIDAQABo2MwYTAO
BgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUA95QNVbR
TLtm8KPiGxvDl7I90VUwHwYDVR0jBBgwFoAUA95QNVbRTLtm8KPiGxvDl7I90VUw
DQYJKoZIhvcNAQEFBQADggEBAMucN6pIExIK+t1EnE9SsPTfrgT1eXkIoyQY/Esr
hMAtudXH/vTBH1jLuG2cenTnmCmrEbXjcKChzUyImZOMkXDiqw8cvpOp/2PV5Adg
06O/nVsJ8dWO41P0jmP6P6fbtGbfYmbW0W5BjfIttep3Sp+dWOIrWcBAI+0tKIJF
PnlUkiaY4IBIqDfv8NZ5YBberOgOzW6sRBc4L0na4UU+Krk2U886UAb3LujEV0ls
YSEY1QSteDwsOoBrp+uvFRTp2InBuThs4pFsiv9kuXclVzDAGySj4dzp30d8tbQk
CAUw7C29C79Fv1C5qfPrmAESrciIxpg0X40KPMbp1ZWVbd4=
-----END CERTIFICATE-----
)EOF";
*/

WiFiClient espClient;   //如果使用TLS/SSL连接，需要注释掉这两行
PubSubClient client(espClient);

unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE  (50)
char msg[MSG_BUFFER_SIZE];
int value = 0;

void setup() {
  Serial.begin(115200, SERIAL_8N1, SERIAL_TX_ONLY);
  pinMode(BUILTIN_LED, OUTPUT);   
  Serial.begin(115200);
  setup_wifi();  //连接WiFi
//syncTime();  // 如果使用TLS/SSL连接，需要添加此行，X.509验证需要同步时间
  
  client.setServer(mqtt_server, mqtt_port);   //设置服务器地址和端口
  client.setCallback(callback);    //设置接收消息的函数
}

/*
void syncTime() {
    configTime(gmt_offset_sec, daylight_offset_sec, ntp_server);
    Serial.print("Waiting for NTP time sync: ");
    while (time(nullptr) < 8 * 3600 * 2) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("Time synchronized");
}
*/

void setup_wifi() {
  digitalWrite(BUILTIN_LED, LOW);
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  digitalWrite(BUILTIN_LED, HIGH);
}

void reconnect() {
//循环直到回连成功
//BearSSL::X509List serverTrustedCA(ca_cert);   //如果使用TLS/SSL连接，需要添加这两句
//espClient.setTrustAnchors(&serverTrustedCA);
  while (!client.connected()) 
  {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266-";  //设备名
//  clientId += String(random(0xffff), HEX);     使用XX-随机数
    clientId += WiFi.localIP().toString().c_str();  //XX-IP地址
//  尝试连接
    if (client.connect(clientId.c_str()))     //client.connect(clientId.c_str())  
    {  
      Serial.println("connected");  //连接成功
      client.publish(topic, "connected");  //连接成功后，向主题发布消息，也可以不发布
      client.subscribe(topic);  //订阅主题
    } 
    else 
    {
      char err_buf[128];
      //espClient.getLastSSLError(err_buf, sizeof(err_buf));
      Serial.print("failed, rc=");  //连接失败，并打印状态码
      Serial.print(client.state());
      Serial.print("  SSL error: ");
      Serial.println(err_buf);
      Serial.println(" try again in 5 seconds");  
      delay(5000);  //5秒后再次尝试连接
    }
  }
}

void AnalysePowerCMD(String jsonData) {
  StaticJsonDocument<200> doc;

  // 解析JSON数据
  DeserializationError error = deserializeJson(doc, jsonData);
  if (error) {
    Serial.print("Failed to parse JSON: ");
    Serial.println(error.c_str());
    return;
  }

  const char* power = doc["power"];

  Serial.print("power: ");Serial.println(power);

  // 根据解析结果执行操作
  if (strcmp(power, "on") == 0) {
    digitalWrite(BUILTIN_LED, LOW);
  } else if (strcmp(power, "off") == 0) {
    digitalWrite(BUILTIN_LED, HIGH);
  }
}

void callback(char* topic, byte* payload, unsigned int length)  //主题，消息，消息长度
{
  Serial.print("Message arrived [");
  Serial.print(topic);  //打印主题
  Serial.print("] ");
  
  char msg[length];
  for (int i = 0; i < length; i++) 
    msg[i]=(char)payload[i];  //将消息转存到msg中
  snprintf (msg, length+1, msg);
  Serial.println(msg);  //打印消息
  AnalysePowerCMD(msg);
}

void loop() 
{
  if (!client.connected())  //如果断连，则进行重连
  {
    reconnect();
  }
  client.loop();
 
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;
    ++value;
    //snprintf (msg, MSG_BUFFER_SIZE, "hello world #%ld", value);
    //Serial.print("Publish message: ");
    //Serial.println(msg);
    //client.publish(topic, msg);  //每2秒发送一次消息
  }
}