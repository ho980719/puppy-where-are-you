import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import { Point } from '../hooks/useWalkTracking';

export default function WalkMap({ points }: { points: Point[] }) {
  const coords = points.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const last = coords[coords.length - 1];
  const defaultRegion = {
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
  const region = last
    ? {
        latitude: last.latitude,
        longitude: last.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        region={region}
      >
        {coords.length > 1 && (
          <Polyline coordinates={coords} strokeColor="#1E90FF" strokeWidth={5} />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
