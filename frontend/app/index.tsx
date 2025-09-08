import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { WaterProgress, WaterInput, WaterHistory } from '../components/WaterTracking';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <WaterProgress />
        <WaterInput />
        <WaterHistory />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});
