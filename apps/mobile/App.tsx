import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WalkMap from './src/components/WalkMap';
import { useWalkTracking } from './src/hooks/useWalkTracking';

export default function App() {
  // TODO: 실제 로그인 사용자 ID와 연결
  const userId = 'demo-user-1';
  const { isActive, points, start, stop } = useWalkTracking(userId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.mapWrap}>
        <WalkMap points={points} />
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, isActive ? styles.btnDisabled : styles.btnPrimary]}
          disabled={isActive}
          onPress={() => start().catch(console.warn)}
        >
          <Text style={styles.btnText}>{isActive ? 'Walking…' : 'Start Walk'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, !isActive ? styles.btnDisabled : styles.btnDanger]}
          disabled={!isActive}
          onPress={() => stop().catch(console.warn)}
        >
          <Text style={styles.btnText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapWrap: { flex: 1 },
  controls: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-around',
    backgroundColor: '#fff',
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#1E90FF' },
  btnDanger: { backgroundColor: '#FF5555' },
  btnDisabled: { backgroundColor: '#cccccc' },
  btnText: { color: '#fff', fontWeight: '600' },
});
