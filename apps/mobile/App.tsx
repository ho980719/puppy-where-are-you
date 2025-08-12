import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Puppy Mobile Scaffold</Text>
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}
