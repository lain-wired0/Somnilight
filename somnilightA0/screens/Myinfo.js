// screens/Myinfo.js
// 说明：个人资料 / Profile 页面（顶部固定自定义头部 + 下方内容可滚动）
// 要求：APP 内文字全部为英文，代码注释为中文

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,      // 使用 SafeAreaView 适配刘海
  ImageBackground,   // 新增：用于和 Stats 一样的背景图
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// 引入 Stats 共用的背景尺寸样式
import { bg_style } from './Stats/StatsStyles';

const MyinfoScreen = () => {
  // 开关状态（勿扰、健康同步）
  const [doNotDisturb, setDoNotDisturb] = useState(true);
  const [healthSync, setHealthSync] = useState(true);

  return (
    <View style={styles.root}>
      {/* 和 Stats 一样的星空背景图 */}
      <ImageBackground
        source={require('../assets/general_images/bg_stats.png')}
        style={bg_style}
      >
        {/* SafeAreaView 确保顶部不被刘海遮挡 */}
        <SafeAreaView style={styles.safeArea}>
          {/* 自定义固定头部：不会跟着下面内容滚动 */}
          <View style={styles.fixedHeader}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.headerIconBtn}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color="#EDEFF6"
              />
            </TouchableOpacity>
          </View>

          {/* ScrollView：下面所有内容可以滚动 */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 个人信息：头像 + 姓名 + 加入时间 */}
            <View style={styles.profileRow}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>🥱</Text>
                </View>
                {/* 小紫色设备徽章 */}
                <View style={styles.deviceBadge}>
                  <MaterialCommunityIcons
                    name="cellphone"
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>Mushroom</Text>
                <Text style={styles.profileSubtitle}>Joined June 2025</Text>
              </View>
            </View>

            {/* Sleep time / Score 两个统计卡片 */}
            <View style={styles.statsRow}>
              <View style={[styles.smallStatCard, { marginRight: 10 }]}>
                <View style={styles.smallStatIconCircle}>
                  <MaterialCommunityIcons
                    name="moon-waning-crescent"
                    size={18}
                    color="#C3B9FF"
                  />
                </View>
                <Text style={styles.smallStatLabel}>Avg.</Text>
                <Text style={styles.smallStatValue}>7h 45m</Text>
                <Text style={styles.smallStatDesc}>Sleep time</Text>
              </View>

              <View style={[styles.smallStatCard, { marginLeft: 10 }]}>
                <View
                  style={[
                    styles.smallStatIconCircle,
                    { backgroundColor: '#FFB87020' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="crown-outline"
                    size={18}
                    color="#FFB870"
                  />
                </View>
                <Text style={styles.smallStatLabel}>Avg.</Text>
                <Text style={styles.smallStatValue}>92</Text>
                <Text style={styles.smallStatDesc}>Sleep quality</Text>
              </View>
            </View>

            {/* Go Premium 卡片（改成和 Stats 类似的玻璃卡片 + 高亮背景） */}
            <View style={styles.premiumCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Go Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlock detailed sleep analysis
                </Text>
              </View>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>

            {/* 功能入口四宫格：Sleep Circle / Community / Challenges / Reports */}
            <View style={styles.gridRow}>
              <View style={[styles.gridCard, { marginRight: 10 }]}>
                <View
                  style={[
                    styles.gridIconCircle,
                    { backgroundColor: '#5F46FF20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={22}
                    color="#F0D6FF"
                  />
                </View>
                <Text style={styles.gridTitle}>Sleep Circle</Text>
                <Text style={styles.gridSubtitle}>Family & Friends</Text>
              </View>

              <View style={[styles.gridCard, { marginLeft: 10 }]}>
                <View
                  style={[
                    styles.gridIconCircle,
                    { backgroundColor: '#FF4D6A20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={22}
                    color="#FF9CB5"
                  />
                </View>
                <Text style={styles.gridTitle}>Community</Text>
                <Text style={styles.gridSubtitle}>Sleep stories</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.gridCard, { marginRight: 10 }]}>
                <View
                  style={[
                    styles.gridIconCircle,
                    { backgroundColor: '#FFB87020' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="flag-outline"
                    size={22}
                    color="#FFCF88"
                  />
                </View>
                <Text style={styles.gridTitle}>Challenges</Text>
                <Text style={styles.gridSubtitle}>Year-long goals</Text>
              </View>

              <View style={[styles.gridCard, { marginLeft: 10 }]}>
                <View
                  style={[
                    styles.gridIconCircle,
                    { backgroundColor: '#3B82F620' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="file-chart-outline"
                    size={22}
                    color="#A9C4FF"
                  />
                </View>
                <Text style={styles.gridTitle}>Reports</Text>
                <Text style={styles.gridSubtitle}>Monthly insight</Text>
              </View>
            </View>

            {/* Preferences 标题 */}
            <Text style={styles.sectionTitle}>PREFERENCES</Text>

            {/* Preferences 卡片：Daily Goal / Sounds & Haptics / DND / Health Sync */}
            <View style={styles.preferenceCard}>
              {/* Daily Goal */}
              <TouchableOpacity style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View style={styles.prefIconCircle}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color="#C3B9FF"
                    />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>Daily Goal</Text>
                    <Text style={styles.prefSubtitle}>
                      Sleep target per night
                    </Text>
                  </View>
                </View>
                <Text style={styles.prefValue}>8h 00m</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#5E6780"
                />
              </TouchableOpacity>

              {/* Sounds & Haptics */}
              <TouchableOpacity style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View style={styles.prefIconCircle}>
                    <MaterialCommunityIcons
                      name="volume-high"
                      size={18}
                      color="#C3B9FF"
                    />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>Sounds & Haptics</Text>
                    <Text style={styles.prefSubtitle}>
                      Alarm tones and feedback
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#5E6780"
                />
              </TouchableOpacity>

              {/* Do Not Disturb */}
              <View style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View style={styles.prefIconCircle}>
                    <MaterialCommunityIcons
                      name="minus-circle-outline"
                      size={18}
                      color="#C3B9FF"
                    />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>Do Not Disturb</Text>
                    <Text style={styles.prefSubtitle}>Pause notifications</Text>
                  </View>
                </View>
                <Switch
                  value={doNotDisturb}
                  onValueChange={setDoNotDisturb}
                  thumbColor={doNotDisturb ? '#FFFFFF' : '#A0A7C2'}
                  trackColor={{ false: '#3A3F5C', true: '#6E6BFF' }}
                />
              </View>

              {/* Health Sync */}
              <View style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View style={styles.prefIconCircle}>
                    <MaterialCommunityIcons
                      name="shield-outline"
                      size={18}
                      color="#C3B9FF"
                    />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>Health Sync</Text>
                    <Text style={styles.prefSubtitle}>
                      Connect to health apps
                    </Text>
                  </View>
                </View>
                <Switch
                  value={healthSync}
                  onValueChange={setHealthSync}
                  thumbColor={healthSync ? '#FFFFFF' : '#A0A7C2'}
                  trackColor={{ false: '#3A3F5C', true: '#6E6BFF' }}
                />
              </View>
            </View>

            {/* Help & Feedback / Log Out 卡片 */}
            <View style={styles.preferenceCard}>
              <TouchableOpacity style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View style={styles.prefIconCircle}>
                    <MaterialCommunityIcons
                      name="help-circle-outline"
                      size={18}
                      color="#C3B9FF"
                    />
                  </View>
                  <Text style={styles.prefTitle}>Help & Feedback</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color="#5E6780"
                />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <View
                    style={[
                      styles.prefIconCircle,
                      { backgroundColor: '#FF4D6A20' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="logout"
                      size={18}
                      color="#FF6B7F"
                    />
                  </View>
                  <Text style={styles.logoutText}>Log Out</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export { MyinfoScreen };

// ---------- 样式 ----------

const styles = StyleSheet.create({
  // 整个页面背景（和 Stats 外层一致）
  root: {
    flex: 1,
    backgroundColor: '#05011C',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // 固定头部区域（Profile + 设置）
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent', // 让星空背景透出来
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ScrollView 本体
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // 头像区域
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#24244D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6F7BFF',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  deviceBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6D5BFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#050816',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileSubtitle: {
    color: '#8187A8',
    fontSize: 13,
  },

  // 两个统计小卡片（改成和 Stats card 相近：半透明紫 + 边框）
  statsRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  smallStatCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(48, 31, 68, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(125,125,125,0.5)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  smallStatIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4D4BFF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  smallStatLabel: {
    color: '#8187A8',
    fontSize: 12,
  },
  smallStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  smallStatDesc: {
    color: '#8187A8',
    fontSize: 12,
    marginTop: 2,
  },

  // Premium 卡片（在 Stats 风格基础上，整体更亮）
  premiumCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 20,
    backgroundColor: '#5C3BFF',
    borderWidth: 1,
    borderColor: 'rgba(125,125,125,0.6)',
    shadowColor: '#5C3BFF',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  premiumSubtitle: {
    color: '#E6E3FF',
    fontSize: 13,
    marginTop: 4,
  },
  premiumButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  premiumButtonText: {
    color: '#4A2DFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // 四宫格
  gridRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 27, 60, 0.35)', // 和 Stats 里的 signsCard/rowCard 接近
    borderWidth: 1,
    borderColor: 'rgba(125,125,125,0.5)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  gridIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  gridSubtitle: {
    color: '#8B91B2',
    fontSize: 12,
    marginTop: 2,
  },

  // Preferences 标题
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    color: '#70789C',
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '700',
  },

  // Preferences 卡片（同样采用 Stats 的玻璃卡片风格）
  preferenceCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(31, 27, 60, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(125,125,125,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prefIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#262A46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prefTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  prefSubtitle: {
    color: '#7C84A4',
    fontSize: 11,
    marginTop: 2,
  },
  prefValue: {
    color: '#9BA3C8',
    fontSize: 13,
    marginRight: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#252948',
    marginVertical: 4,
  },
  logoutText: {
    color: '#FF6B7F',
    fontSize: 14,
    fontWeight: '600',
  },
});
