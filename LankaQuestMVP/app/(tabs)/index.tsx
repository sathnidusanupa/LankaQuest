import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Aluthin Add kala

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState("Locked");

  // TARGET: Ube dan inna thana (Previous step eke numbers ma thiyanna)
  const TARGET_LAT = 6.0971;
  const TARGET_LONG = 80.4747;
  const UNLOCK_RADIUS = 50;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (newLocation) => {
          setLocation(newLocation);
          const dist = getDistanceFromLatLonInMeters(
            newLocation.coords.latitude,
            newLocation.coords.longitude,
            TARGET_LAT,
            TARGET_LONG
          );
          setDistance(dist);
        }
      );
    })();
  }, []);

  // Haversine Formula
  function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  function deg2rad(deg: number) { return deg * (Math.PI / 180); }

  // Check if unlocked
  const isUnlocked = distance !== null && distance < UNLOCK_RADIUS;

  return (
    <View style={[styles.container, { backgroundColor: isUnlocked ? '#d4edda' : '#f8d7da' }]}>

      <Text style={styles.title}>LANKA QUEST</Text>

      {location ? (
        <View style={styles.card}>
          {/* MEKA THAMAI WENAS KARE: Icons Logic */}
          <MaterialCommunityIcons
            name={isUnlocked ? "treasure-chest-open" : "treasure-chest"}
            size={120}
            color={isUnlocked ? "#d4af37" : "#555"}
          />

          <Text style={[styles.status, { color: isUnlocked ? 'green' : '#721c24' }]}>
            {isUnlocked ? "QUEST COMPLETED!" : "LOCKED"}
          </Text>

          <Text style={styles.text}>
            {isUnlocked
              ? "You found the hidden treasure!"
              : `Walk ${distance?.toFixed(0)} meters more`}
          </Text>
        </View>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 10, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: { fontSize: 30, fontWeight: '900', marginBottom: 40, letterSpacing: 2 },
  status: { fontSize: 28, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  text: { fontSize: 16, marginTop: 10, color: 'gray', textAlign: 'center' },
});