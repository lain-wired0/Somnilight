import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const newApp = () => {
  // ref
  const bottomSheetRef = useRef(null);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);

  // renders
  return (
    <View style={{backgroundColor:'purple',flex:1}}>
        <GestureHandlerRootView style={styles.container}>
            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={["40%", "90%"]}
                onChange={handleSheetChanges}
            >
                <BottomSheetView style={styles.contentContainer}>
                <Text>Awesome 🎉</Text>
                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
    </View>
        
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft:30,
    marginRight:30,
  },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: 'center',
    backgroundColor:'blue',
  },
});

export default newApp;