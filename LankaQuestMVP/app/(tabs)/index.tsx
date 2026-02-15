import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState("LOCKED 🔒");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- TARGET LOCATION SETTINGS ---
  // Methana Ube current location ekata langa thanaka coordinates danna.
  // Example: IIT Campus (Wellawatte)
  const TARGET_LAT = 6.8743;
  const TARGET_LONG = 79.8606;
  const UNLOCK_RADIUS = 50; // Meters

  useEffect(() => {
    (async () => {
      // 1. Permission Illanna
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // 2. Real-time Location Track Karanna
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // Every 5 meters update
        },
        (newLocation) => {
          setLocation(newLocation);

          // Calculate Distance
          const dist = getDistanceFromLatLonInMeters(
            newLocation.coords.latitude,
            newLocation.coords.longitude,
            TARGET_LAT,
            TARGET_LONG
          );

          setDistance(dist);

          // 3. LOGIC: User 50m athulata awada?
          if (dist < UNLOCK_RADIUS) {
            setStatus("UNLOCKED! 🎉 Welcome to IIT");
          } else {
            setStatus("LOCKED 🔒 (Walk Closer)");
          }
        }
      );
    })();
  }, []);

  // --- MATHEMATICS (HAVERSINE FORMULA) ---
  function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in meters
    return d;
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LANKA QUEST MVP</Text>

      {location ? (
        <>
          <Text style={styles.text}>
            Target Distance: {distance ? distance.toFixed(2) : '...'} meters
          </Text>

          <Text style={[styles.status, { color: distance && distance < UNLOCK_RADIUS ? 'green' : 'red' }]}>
            {status}
          </Text>

          <Text style={styles.smallText}>
            Current: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
        </>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}

      <Text style={styles.error}>{errorMsg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 18, marginBottom: 10 },
  status: { fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  smallText: { fontSize: 12, color: 'gray', marginTop: 30 },
  error: { color: 'red', marginTop: 10 },
});