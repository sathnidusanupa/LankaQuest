import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator, TouchableOpacity,
  Modal, StatusBar, ScrollView, Dimensions, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { PROVIDER_GOOGLE } from 'react-native-maps';

// ─── Sri Lankan Landmark Quests ─────────────────────────────────────────────
const QUESTS = [
  {
    id: 1, name: "Home Base", sinhala: "ආරම්භය",
    description: "Where your adventure begins",
    lat: 6.0971, long: 80.4747,
    reward: "Adventurer's Compass 🧭",
    icon: "compass-rose" as const,
  },
  {
    id: 2, name: "Sigiriya", sinhala: "අටවන පුවත",
    description: "The 8th Wonder of the World",
    lat: 7.9570, long: 80.7603,
    reward: "Lion's Crown 🦁",
    icon: "castle" as const,
  },
  {
    id: 3, name: "Temple of the Tooth", sinhala: "දළදා මාලිගාව",
    description: "Sacred Relic of the Buddha",
    lat: 7.2906, long: 80.6337,
    reward: "Sacred Relic 📿",
    icon: "temple-buddhist" as const,
  },
  {
    id: 4, name: "Galle Fort", sinhala: "ගාලු කෝට්ටේ",
    description: "Where the ocean meets history",
    lat: 6.0269, long: 80.2170,
    reward: "Navigator's Map 🗺️",
    icon: "lighthouse" as const,
  },
  {
    id: 5, name: "IIT Campus", sinhala: "දැනුමේ පියවර",
    description: "Hall of Knowledge",
    lat: 6.8743, long: 79.8606,
    reward: "Scholar's Quill ✒️",
    icon: "school" as const,
  },
  {
    id: 6, name: "Nine Arch Bridge", sinhala: "ආරුක්කු නමයේ පාලම",
    description: "Colonial engineering marvel",
    lat: 6.8768, long: 81.0608,
    reward: "Train Ticket 🚂",
    icon: "bridge" as const,
  },
  {
    id: 7, name: "Polonnaruwa", sinhala: "පොළොන්නරුව",
    description: "Ancient Kingdom Ruins",
    lat: 7.9403, long: 81.0188,
    reward: "Royal Lotus 🌸",
    icon: "pillar" as const,
  },
  {
    id: 8, name: "Adam's Peak", sinhala: "ශ්‍රී පාදය",
    description: "Sacred Footprint",
    lat: 6.8096, long: 80.4994,
    reward: "Mountain bell 🔔",
    icon: "hiking" as const,
  },
];

// ─── Sri Lankan Heritage Color Palette ──────────────────────────────────────
const COLORS = {
  saffron: '#E65100',   // Buddhist temple saffron robes
  saffronLight: '#FF8F00',   // Warm saffron glow
  deepMaroon: '#5D1A1A',   // Kandyan craft wood tones
  tropicalGreen: '#1B5E20',   // Tea plantation green
  ancientGold: '#BF9B30',   // Sigiriya fresco jewelry
  ivoryWhite: '#FFF8E7',   // Temple ivory
  sandstone: '#D7CCC8',   // Ancient ruins stone
  oceanBlue: '#01579B',   // Southern coast deep blue
  textDark: '#3E2723',   // Rich brown text
  textLight: '#8D6E63',   // Warm gray-brown
  cardBg: '#FFFDF5',   // Slightly warm white
  overlay: 'rgba(62, 39, 35, 0.75)', // Dark warm overlay
};

// ─── Custom Google Map Style (Sepia/Retro) ──────────────────────────────────
const CUSTOM_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] },
  { "featureType": "administrative.land_parcel", "elementType": "geometry.stroke", "stylers": [{ "color": "#dcd2be" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#ae9e90" }] },
  { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#93817c" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#a5b076" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#447530" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#fdfcf8" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f8c967" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#e9bc62" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#e98d58" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry.stroke", "stylers": [{ "color": "#db8555" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#806b63" }] },
  { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "transit.line", "elementType": "labels.text.fill", "stylers": [{ "color": "#8f7d77" }] },
  { "featureType": "transit.line", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ebe3cd" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b9d3c2" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#92998d" }] }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearestQuest, setNearestQuest] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inventory, setInventory] = useState<string[]>([]);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  const UNLOCK_RADIUS = 50;

  // ─── Audio ─────────────────────────────────────────────────────────────
  const SOUNDS = {
    unlock: require('../../assets/sounds/unlock.mp3'),
    success: require('../../assets/sounds/success.mp3'),
  };

  const playSound = async (type: 'unlock' | 'success') => {
    try {
      const { sound } = await Audio.Sound.createAsync(SOUNDS[type]);
      await sound.playAsync();
      // Unload after playback to free memory
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  // ─── Inventory Persistence ──────────────────────────────────────────────
  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_inventory');
      if (saved !== null) setInventory(JSON.parse(saved));
    } catch (e) { console.log("Failed to load inventory"); }
  };

  const saveInventory = async (newInventory: string[]) => {
    try {
      await AsyncStorage.setItem('user_inventory', JSON.stringify(newInventory));
    } catch (e) { console.log("Failed to save inventory"); }
  };

  // ─── Location Tracking ─────────────────────────────────────────────────
  const lastUnlockedIdRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (newLocation) => {
          setLocation(newLocation);
          let closest: any = null;
          let minDist = Infinity;
          QUESTS.forEach((quest) => {
            const dist = haversine(
              newLocation.coords.latitude, newLocation.coords.longitude,
              quest.lat, quest.long
            );
            if (dist < minDist) { minDist = dist; closest = quest; }
          });
          if (closest) {
            setNearestQuest(closest);
            setDistance(minDist);
            const isNowUnlocked = minDist < UNLOCK_RADIUS;

            // Only play sound if we just entered the radius of a specific quest
            // and haven't played it for this specific entry yet
            if (isNowUnlocked && lastUnlockedIdRef.current !== closest.id) {
              playSound('unlock');
              lastUnlockedIdRef.current = closest.id;
            } else if (!isNowUnlocked) {
              // Reset if we leave the radius
              lastUnlockedIdRef.current = null;
            }

            setIsUnlocked(isNowUnlocked);
          }
        }
      );
    })();
  }, []);

  // ─── Reward Collection ─────────────────────────────────────────────────
  const collectReward = async () => {
    if (nearestQuest && !inventory.includes(nearestQuest.reward)) {
      const newInventory = [...inventory, nearestQuest.reward];
      setInventory(newInventory);
      await saveInventory(newInventory);
      playSound('success');
    }
    setRewardModalVisible(false);
    setProfileModalVisible(true);
  };

  // ─── Haversine Formula ─────────────────────────────────────────────────
  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const toRad = (d: number) => d * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ─── Format Distance ──────────────────────────────────────────────────
  const formatDist = (d: number | null) => {
    if (d === null) return '...';
    if (d >= 1000) return `${(d / 1000).toFixed(1)} km`;
    return `${d.toFixed(0)} m`;
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.deepMaroon} />

      {/* ── MAP SECTION ─────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            customMapStyle={CUSTOM_MAP_STYLE}
            style={styles.map}
            showsUserLocation
            region={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            }}
          >
            {QUESTS.map((quest) => (
              <React.Fragment key={quest.id}>
                <Marker
                  coordinate={{ latitude: quest.lat, longitude: quest.long }}
                  title={quest.name}
                  description={quest.sinhala}
                >
                  <View style={styles.markerContainer}>
                    <MaterialCommunityIcons
                      name={quest.icon}
                      size={24}
                      color={inventory.includes(quest.reward)
                        ? COLORS.tropicalGreen
                        : nearestQuest?.id === quest.id
                          ? COLORS.saffron
                          : COLORS.deepMaroon
                      }
                    />
                  </View>
                </Marker>
                {nearestQuest?.id === quest.id && (
                  <Circle
                    center={{ latitude: quest.lat, longitude: quest.long }}
                    radius={UNLOCK_RADIUS}
                    fillColor="rgba(230, 81, 0, 0.08)"
                    strokeColor={COLORS.saffron}
                    strokeWidth={1.5}
                  />
                )}
              </React.Fragment>
            ))}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.saffron} />
            <Text style={styles.loadingText}>Locating you on the island...</Text>
          </View>
        )}

        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <View>
            <Text style={styles.headerTitle}>🏛️ LANKA QUEST</Text>
            <Text style={styles.headerSubtitle}>ලංකා සාහසය</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setProfileModalVisible(true)}
          >
            <MaterialCommunityIcons name="compass-outline" size={24} color={COLORS.ivoryWhite} />
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{inventory.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── QUEST CARD PANEL ────────────────────────────────────────── */}
      <View style={styles.cardContainer}>
        {/* Decorative saffron top bar */}
        <View style={styles.saffronBar} />
        <View style={styles.dragIndicator} />

        {nearestQuest ? (
          <View style={styles.card}>
            {/* Quest Icon */}
            <View style={[
              styles.questIconCircle,
              { backgroundColor: isUnlocked ? COLORS.tropicalGreen : COLORS.saffron }
            ]}>
              <MaterialCommunityIcons
                name={nearestQuest.icon}
                size={28}
                color={COLORS.ivoryWhite}
              />
            </View>

            {/* Quest Info */}
            <Text style={styles.questTitle}>{nearestQuest.name.toUpperCase()}</Text>
            <Text style={styles.questSinhala}>{nearestQuest.sinhala}</Text>
            <Text style={styles.questDesc}>{nearestQuest.description}</Text>

            {/* Distance + Progress Row */}
            <View style={styles.infoRow}>
              <View style={styles.distanceBadge}>
                <MaterialCommunityIcons name="walk" size={18} color={COLORS.textLight} />
                <Text style={styles.questDist}>{formatDist(distance)}</Text>
              </View>
              <View style={styles.progressBadge}>
                <MaterialCommunityIcons name="treasure-chest" size={16} color={COLORS.ancientGold} />
                <Text style={styles.progressText}>
                  {inventory.length}/{QUESTS.length} discovered
                </Text>
              </View>
            </View>

            {/* Action Button */}
            {isUnlocked ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionUnlocked]}
                onPress={() => setRewardModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="treasure-chest" size={22} color={COLORS.ivoryWhite} />
                <Text style={styles.actionText}>  UNLOCK TREASURE 🏆</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.actionButton, styles.actionLocked]}>
                <MaterialCommunityIcons name="lock-outline" size={22} color={COLORS.ivoryWhite} />
                <Text style={styles.actionText}>  🔒 APPROACH TO UNLOCK</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.searchingContainer}>
            <MaterialCommunityIcons name="compass" size={40} color={COLORS.sandstone} />
            <Text style={styles.searchingText}>Scanning ancient coordinates...</Text>
          </View>
        )}
      </View>

      {/* ── REWARD MODAL ────────────────────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent
        visible={rewardModalVisible}
        onRequestClose={() => setRewardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rewardModal}>
            <View style={styles.rewardGoldBar} />
            <Text style={styles.rewardEmoji}>🎉</Text>
            <Text style={styles.rewardTitle}>TREASURE UNLOCKED!</Text>
            <Text style={styles.rewardSubtitle}>සම්පත් හමුවිය!</Text>

            <View style={styles.rewardIconCircle}>
              <MaterialCommunityIcons name="medal-outline" size={64} color={COLORS.ancientGold} />
            </View>

            <Text style={styles.rewardItemName}>{nearestQuest?.reward}</Text>
            <Text style={styles.rewardItemDesc}>
              Found at {nearestQuest?.name}
            </Text>

            <TouchableOpacity
              style={styles.collectButton}
              onPress={collectReward}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="hand-coin" size={20} color={COLORS.ivoryWhite} />
              <Text style={styles.collectButtonText}>  COLLECT TREASURE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── INVENTORY / SATCHEL MODAL ───────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.inventoryModal}>
            <View style={styles.inventoryHeader}>
              <Text style={styles.inventoryTitle}>🎒 EXPLORER'S SATCHEL</Text>
              <Text style={styles.inventorySinhala}>සොයාගත් දේ</Text>
            </View>

            <View style={styles.inventoryProgress}>
              <Text style={styles.inventoryProgressText}>
                {inventory.length} / {QUESTS.length} Treasures Collected
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill,
                  { width: `${(inventory.length / QUESTS.length) * 100}%` }
                ]} />
              </View>
            </View>

            <ScrollView style={styles.inventoryScroll} showsVerticalScrollIndicator={false}>
              {QUESTS.map((quest, index) => {
                const collected = inventory.includes(quest.reward);
                return (
                  <View key={quest.id} style={[
                    styles.inventoryItem,
                    !collected && styles.inventoryItemLocked
                  ]}>
                    <View style={[
                      styles.inventoryIconCircle,
                      { backgroundColor: collected ? COLORS.tropicalGreen : COLORS.sandstone }
                    ]}>
                      <MaterialCommunityIcons
                        name={collected ? quest.icon : "help"}
                        size={20}
                        color={collected ? COLORS.ivoryWhite : COLORS.textLight}
                      />
                    </View>
                    <View style={styles.inventoryItemInfo}>
                      <Text style={[
                        styles.inventoryItemName,
                        !collected && styles.inventoryItemNameLocked
                      ]}>
                        {collected ? quest.reward : "???"}
                      </Text>
                      <Text style={styles.inventoryItemLocation}>
                        {collected ? quest.name : "Undiscovered location"}
                      </Text>
                    </View>
                    {collected && (
                      <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.tropicalGreen} />
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setProfileModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>CLOSE SATCHEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: COLORS.ivoryWhite },
  mapContainer: { flex: 2.2 },
  map: { width: '100%', height: '100%' },

  // ── Loading State ─────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.ivoryWhite,
  },
  loadingText: {
    marginTop: 12, fontSize: 16, color: COLORS.textLight,
    fontStyle: 'italic',
  },

  // ── Map Markers ───────────────────────────────────────────────────────────
  markerContainer: {
    backgroundColor: COLORS.ivoryWhite, padding: 6,
    borderRadius: 20, borderWidth: 2, borderColor: COLORS.saffron,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3,
  },

  // ── Header Overlay ────────────────────────────────────────────────────────
  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 55 : 42,
    paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(93, 26, 26, 0.85)',
  },
  headerTitle: {
    fontSize: 22, fontWeight: '900', color: COLORS.ivoryWhite,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 13, color: COLORS.ancientGold, marginTop: 2,
    letterSpacing: 1,
  },

  // ── Profile Button ────────────────────────────────────────────────────────
  profileBtn: {
    backgroundColor: COLORS.saffron, padding: 11,
    borderRadius: 14, elevation: 5,
  },
  badgeCount: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: COLORS.tropicalGreen,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },

  // ── Quest Card Panel ──────────────────────────────────────────────────────
  cardContainer: {
    flex: 1.3, backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -28, elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 8,
    overflow: 'hidden',
  },
  saffronBar: {
    width: '100%', height: 4,
    backgroundColor: COLORS.saffron,
  },
  dragIndicator: {
    width: 36, height: 4, backgroundColor: COLORS.sandstone,
    borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6,
  },
  card: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 4 },

  // ── Quest Icon ────────────────────────────────────────────────────────────
  questIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },

  // ── Quest Text ────────────────────────────────────────────────────────────
  questTitle: {
    fontSize: 20, fontWeight: '800', color: COLORS.deepMaroon,
    letterSpacing: 1,
  },
  questSinhala: {
    fontSize: 14, color: COLORS.textLight, marginTop: 2,
    fontStyle: 'italic',
  },
  questDesc: {
    fontSize: 15, color: COLORS.textLight, marginTop: 4,
    marginBottom: 10, textAlign: 'center',
  },

  // ── Info Row ──────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 16, gap: 10,
  },
  distanceBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.sandstone, paddingVertical: 5,
    paddingHorizontal: 14, borderRadius: 20,
  },
  questDist: {
    fontSize: 13, color: COLORS.textDark, marginLeft: 5, fontWeight: '700',
  },
  progressBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF3E0', paddingVertical: 5,
    paddingHorizontal: 14, borderRadius: 20,
  },
  progressText: {
    fontSize: 12, color: COLORS.saffron, marginLeft: 5, fontWeight: '700',
  },

  // ── Action Buttons ────────────────────────────────────────────────────────
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', paddingVertical: 15, borderRadius: 16,
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  actionUnlocked: { backgroundColor: COLORS.saffron },
  actionLocked: { backgroundColor: COLORS.deepMaroon, opacity: 0.85 },
  actionText: {
    color: COLORS.ivoryWhite, fontSize: 16, fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // ── Searching State ───────────────────────────────────────────────────────
  searchingContainer: {
    alignItems: 'center', marginTop: 40,
  },
  searchingText: {
    marginTop: 12, fontSize: 16, color: COLORS.textLight,
    fontStyle: 'italic',
  },

  // ── Modal Common ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },

  // ── Reward Modal ──────────────────────────────────────────────────────────
  rewardModal: {
    width: '85%', backgroundColor: COLORS.cardBg,
    borderRadius: 24, padding: 28, alignItems: 'center',
    elevation: 15, overflow: 'hidden',
  },
  rewardGoldBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 5, backgroundColor: COLORS.ancientGold,
  },
  rewardEmoji: { fontSize: 40, marginBottom: 4 },
  rewardTitle: {
    fontSize: 22, fontWeight: '900', color: COLORS.deepMaroon,
    letterSpacing: 1,
  },
  rewardSubtitle: {
    fontSize: 14, color: COLORS.textLight, marginTop: 2, marginBottom: 10,
  },
  rewardIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FFF8E1', justifyContent: 'center',
    alignItems: 'center', marginVertical: 10,
    borderWidth: 2, borderColor: COLORS.ancientGold,
  },
  rewardItemName: {
    fontSize: 22, fontWeight: 'bold', color: COLORS.textDark,
    marginTop: 8,
  },
  rewardItemDesc: {
    fontSize: 14, color: COLORS.textLight, marginBottom: 20,
  },
  collectButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', paddingVertical: 15, borderRadius: 14,
    backgroundColor: COLORS.saffron, elevation: 4,
  },
  collectButtonText: {
    color: COLORS.ivoryWhite, fontSize: 16, fontWeight: 'bold',
  },

  // ── Inventory Modal ───────────────────────────────────────────────────────
  inventoryModal: {
    width: '90%', height: '65%',
    backgroundColor: COLORS.cardBg, borderRadius: 24,
    padding: 24, elevation: 15, overflow: 'hidden',
  },
  inventoryHeader: { alignItems: 'center', marginBottom: 6 },
  inventoryTitle: {
    fontSize: 20, fontWeight: '900', color: COLORS.deepMaroon,
    letterSpacing: 1,
  },
  inventorySinhala: {
    fontSize: 13, color: COLORS.textLight, marginTop: 2,
  },

  // ── Progress Bar ──────────────────────────────────────────────────────────
  inventoryProgress: { marginVertical: 12, width: '100%' },
  inventoryProgressText: {
    fontSize: 13, color: COLORS.textLight, textAlign: 'center',
    marginBottom: 6, fontWeight: '600',
  },
  progressBarBg: {
    width: '100%', height: 6, backgroundColor: COLORS.sandstone,
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', backgroundColor: COLORS.tropicalGreen,
    borderRadius: 3,
  },

  // ── Inventory Items ───────────────────────────────────────────────────────
  inventoryScroll: { flex: 1, width: '100%' },
  inventoryItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, backgroundColor: 'white', borderRadius: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#E8E0D5',
    elevation: 2,
  },
  inventoryItemLocked: {
    backgroundColor: '#F5F0EA', borderColor: '#E0D9D0',
    opacity: 0.7,
  },
  inventoryIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  inventoryItemInfo: { flex: 1, marginLeft: 12 },
  inventoryItemName: {
    fontSize: 15, fontWeight: '700', color: COLORS.textDark,
  },
  inventoryItemNameLocked: { color: COLORS.textLight, fontStyle: 'italic' },
  inventoryItemLocation: {
    fontSize: 12, color: COLORS.textLight, marginTop: 2,
  },

  // ── Close Button ──────────────────────────────────────────────────────────
  closeButton: {
    width: '100%', paddingVertical: 13, borderRadius: 14,
    backgroundColor: COLORS.deepMaroon, alignItems: 'center',
    marginTop: 12, elevation: 3,
  },
  closeButtonText: {
    color: COLORS.ivoryWhite, fontSize: 15, fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});