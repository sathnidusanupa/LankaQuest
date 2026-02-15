import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Map Library
import { FontAwesome } from '@expo/vector-icons';

// --- QUEST DATA ---
const QUESTS = [
  {
    id: 1,
    name: "Home Base",
    description: "Start your journey here.",
    // MEKA UBE CURRENT LOCATION EKATA MARU KARAPAN TEST KARANNA
    lat: 6.0971,
    long: 80.4747,
    color: "#4CAF50"
  },
  {
    id: 2,
    name: "IIT Campus",
    description: "Code Wizards Guild.",
    lat: 6.8743,
    long: 79.8606,
    color: "#2196F3"
  },
  {
    id: 3,
    name: "Sigiriya",
    description: "The Lion Rock Fortress.",
    lat: 7.9570,
    long: 80.7603,
    color: "#FF9800"
  }
];

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearestQuest, setNearestQuest] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const mapRef = useRef<MapView>(null); // Map eka control karanna
  const UNLOCK_RADIUS = 50;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (newLocation) => {
          setLocation(newLocation);

          // FIND NEAREST QUEST
          let closest = null;
          let minDist = Infinity;

          QUESTS.forEach((quest) => {
            const dist = getDistanceFromLatLonInMeters(
              newLocation.coords.latitude,
              newLocation.coords.longitude,
              quest.lat,
              quest.long
            );
            if (dist < minDist) {
              minDist = dist;
              closest = quest;
            }
          });

          if (closest) {
            setNearestQuest(closest);
            setDistance(minDist);
            setIsUnlocked(minDist < UNLOCK_RADIUS);
          }
        }
      );
    })();
  }, []);

  // HAVERSINE FORMULA
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

  return (
    <View style={styles.container}>

      {/* 1. MAP SECTION (UDA KOTASA) */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true} // Uba inna thana Blue dot eken pennanawa
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Quest eka thiyena thana MARKER ekak danna */}
            {nearestQuest && (
              <Marker
                coordinate={{ latitude: nearestQuest.lat, longitude: nearestQuest.long }}
                title={nearestQuest.name}
                description={nearestQuest.description}
                pinColor={isUnlocked ? "green" : "red"} // Unlock unoth Green pin
              />
            )}
          </MapView>
        ) : (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
        )}
      </View>

      {/* 2. CARD SECTION (YATA KOTASA) */}
      <View style={styles.cardContainer}>
        {nearestQuest ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.questTitle}>{nearestQuest.name}</Text>
              <Text style={styles.questDist}>{distance?.toFixed(0)}m away</Text>
            </View>

            {isUnlocked ? (
              <View style={styles.statusRow}>
                <FontAwesome name="unlock" size={30} color="green" />
                <Text style={styles.unlockedText}>QUEST UNLOCKED!</Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <FontAwesome name="lock" size={30} color="red" />
                <Text style={styles.lockedText}>LOCKED</Text>
              </View>
            )}
          </View>
        ) : (
          <Text>Searching for quests...</Text>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Map Styles
  mapContainer: { flex: 2 }, // Screen eken 2/3 k Map eka
  map: { width: '100%', height: '100%' },

  // Card Styles
  cardContainer: {
    flex: 1, // Screen eken 1/3 k Card eka
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
    marginTop: -20 // Map eka uda poddak overlap wenna
  },
  card: { alignItems: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  questTitle: { fontSize: 22, fontWeight: 'bold' },
  questDist: { fontSize: 16, color: 'gray', marginTop: 5 },

  statusRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 15, width: '100%', justifyContent: 'center' },
  unlockedText: { color: 'green', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
  lockedText: { color: 'red', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
});