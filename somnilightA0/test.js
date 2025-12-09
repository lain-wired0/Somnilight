import React from 'react';
import { StatusBar } from 'react-native';
// 1. 引入新库的核心 Provider
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 2. 引入你的 Preset 页面
import PresetScreen from './screens/Preset'; 

export default function App() {
  return (
    // 3. 最外层包裹 SafeAreaProvider (这是新库要求的)
    <SafeAreaProvider>
      
      {/* 配置状态栏：
        - barStyle="light-content": 让时间/电量图标变白（适合深色背景）
        - backgroundColor="transparent": 安卓上背景透明
        - translucent={true}: 让内容可以顶到状态栏下面
      */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />

      {/* 直接显示页面。
        我们不在这一层加 <SafeAreaView>，
        因为 Preset.js 里已经处理好了全屏背景和刘海避让。
      */}
      <PresetScreen />
      
    </SafeAreaProvider>
  );
}