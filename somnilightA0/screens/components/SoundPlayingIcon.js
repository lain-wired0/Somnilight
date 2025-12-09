import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const SoundPlayingIcon = ({ active }) => {
  const bar1 = useRef(new Animated.Value(0.4)).current;
  const bar2 = useRef(new Animated.Value(0.2)).current;
  const bar3 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const bars = [bar1, bar2, bar3];

    // 停止并重置
    const reset = () => {
      bars.forEach(v => {
        v.stopAnimation();
        v.setValue(0.4);
      });
    };

    if (!active) {
      reset();
      return;
    }

    const createAnim = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = createAnim(bar1, 0);
    const a2 = createAnim(bar2, 150);
    const a3 = createAnim(bar3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [active, bar1, bar2, bar3]);

  return (
    <View style={eqStyles.container}>
      <Animated.View
        style={[
          eqStyles.bar,
          { transform: [{ scaleY: bar1 }] },
        ]}
      />
      <Animated.View
        style={[
          eqStyles.bar,
          { transform: [{ scaleY: bar2 }] },
        ]}
      />
      <Animated.View
        style={[
          eqStyles.bar,
          { transform: [{ scaleY: bar3 }] },
        ]}
      />
    </View>
  );
};

const eqStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 16,
  },
  bar: {
    width: 3,
    marginHorizontal: 1.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    height: 12,
    transform: [{ scaleY: 0.4 }],
  },
});

export default SoundPlayingIcon;
