import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const PRIMARY = "#4F46E5";
const PILL_PAD = 4;

// ── Types ─────────────────────────────────────────────────────────────────────

type ParkingRecord = {
  id: string;
  structureId: string;
  structureName: string;
  location: string;
  dateLabel: string;
  arrivedAt: string;
  leftAt: string | null;
  duration: string | null;
};

type ReportRecord = {
  id: string;
  structureId: string;
  structureName: string;
  location: string;
  dateLabel: string;
  arrived: boolean;
  left: boolean;
  flagged: boolean;
};

// ── Mock Data ─────────────────────────────────────────────────────────────────

const PARKING_HISTORY: ParkingRecord[] = [
  {
    id: "p1",
    structureId: "PS5",
    structureName: "Parking Structure 5",
    location: "Near Aztec Recreation Center",
    dateLabel: "Today",
    arrivedAt: "9:14 AM",
    leftAt: "11:32 AM",
    duration: "2h 18m",
  },
  {
    id: "p2",
    structureId: "PS1",
    structureName: "Parking Structure 1",
    location: "Near Student Services West",
    dateLabel: "Yesterday",
    arrivedAt: "2:05 PM",
    leftAt: "4:47 PM",
    duration: "2h 42m",
  },
  {
    id: "p3",
    structureId: "PS3",
    structureName: "Parking Structure 3",
    location: "Near College of Engineering",
    dateLabel: "Yesterday",
    arrivedAt: "8:45 AM",
    leftAt: "10:15 AM",
    duration: "1h 30m",
  },
  {
    id: "p4",
    structureId: "PS7",
    structureName: "Parking Structure 7",
    location: "Near The Conrad Prebys Aztec Student Union",
    dateLabel: "Mar 4, 2026",
    arrivedAt: "1:00 PM",
    leftAt: null,
    duration: null,
  },
  {
    id: "p5",
    structureId: "PS2",
    structureName: "Parking Structure 2",
    location: "Near Campanile Drive",
    dateLabel: "Mar 3, 2026",
    arrivedAt: "9:30 AM",
    leftAt: "12:00 PM",
    duration: "2h 30m",
  },
  {
    id: "p6",
    structureId: "PS8",
    structureName: "Parking Structure 8",
    location: "Near South Campus Plaza",
    dateLabel: "Mar 2, 2026",
    arrivedAt: "11:00 AM",
    leftAt: "1:45 PM",
    duration: "2h 45m",
  },
];

const REPORT_HISTORY: ReportRecord[] = [
  {
    id: "r1",
    structureId: "PS2",
    structureName: "Parking Structure 2",
    location: "Near Campanile Drive",
    dateLabel: "Today",
    arrived: false,
    left: false,
    flagged: true,
  },
  {
    id: "r2",
    structureId: "PS5",
    structureName: "Parking Structure 5",
    location: "Near Aztec Recreation Center",
    dateLabel: "Yesterday",
    arrived: true,
    left: true,
    flagged: false,
  },
  {
    id: "r3",
    structureId: "PS1",
    structureName: "Parking Structure 1",
    location: "Near Student Services West",
    dateLabel: "Yesterday",
    arrived: true,
    left: false,
    flagged: false,
  },
  {
    id: "r4",
    structureId: "PS4",
    structureName: "Parking Structure 4",
    location: "Near LOVE Library",
    dateLabel: "Mar 4, 2026",
    arrived: false,
    left: false,
    flagged: true,
  },
  {
    id: "r5",
    structureId: "PS8",
    structureName: "Parking Structure 8",
    location: "Near South Campus Plaza",
    dateLabel: "Mar 3, 2026",
    arrived: false,
    left: true,
    flagged: false,
  },
  {
    id: "r6",
    structureId: "PS6",
    structureName: "Parking Structure 6",
    location: "Near College of Business",
    dateLabel: "Mar 2, 2026",
    arrived: true,
    left: true,
    flagged: true,
  },
];

// ── Parking Card ──────────────────────────────────────────────────────────────

function ParkingCard({ record }: { record: ParkingRecord }) {
  const inProgress = record.leftAt === null;

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{record.structureId}</Text>
        </View>
        <Text style={styles.dateLabel}>{record.dateLabel}</Text>
        {inProgress ? (
          <View style={[styles.pill, styles.pillGreen]}>
            <View style={styles.activeDot} />
            <Text style={[styles.pillText, { color: "#16A34A" }]}>Active</Text>
          </View>
        ) : (
          <View style={[styles.pill, styles.pillIndigo]}>
            <Ionicons name="time-outline" size={11} color={PRIMARY} style={{ marginRight: 3 }} />
            <Text style={[styles.pillText, { color: PRIMARY }]}>{record.duration}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardName}>{record.structureName}</Text>
      <Text style={styles.cardLocation} numberOfLines={1}>{record.location}</Text>

      <View style={styles.cardDivider} />

      {/* Arrival / Departure row */}
      <View style={styles.timesRow}>
        <View style={styles.timeBlock}>
          <View style={styles.timeHeader}>
            <View style={[styles.timeDot, { backgroundColor: "#22C55E" }]} />
            <Text style={styles.timeLabel}>Arrived</Text>
          </View>
          <Text style={styles.timeValue}>{record.arrivedAt}</Text>
        </View>

        <Ionicons name="arrow-forward" size={14} color="#D1D5DB" style={{ alignSelf: "center", marginBottom: 2 }} />

        <View style={[styles.timeBlock, { alignItems: "flex-end" }]}>
          {inProgress ? (
            <>
              <View style={[styles.timeHeader, { justifyContent: "flex-end" }]}>
                <View style={[styles.timeDot, { backgroundColor: "#E5E7EB" }]} />
                <Text style={styles.timeLabel}>Still parked</Text>
              </View>
              <Text style={[styles.timeValue, { color: "#D1D5DB" }]}>—</Text>
            </>
          ) : (
            <>
              <View style={[styles.timeHeader, { justifyContent: "flex-end" }]}>
                <View style={[styles.timeDot, { backgroundColor: "#6B7280" }]} />
                <Text style={styles.timeLabel}>Left</Text>
              </View>
              <Text style={styles.timeValue}>{record.leftAt}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────

function ReportCard({ record }: { record: ReportRecord }) {
  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{record.structureId}</Text>
        </View>
        <Text style={styles.dateLabel}>{record.dateLabel}</Text>
        <View style={[styles.pill, styles.pillGreen]}>
          <Ionicons name="checkmark-circle" size={11} color="#16A34A" style={{ marginRight: 3 }} />
          <Text style={[styles.pillText, { color: "#16A34A" }]}>Submitted</Text>
        </View>
      </View>

      <Text style={styles.cardName}>{record.structureName}</Text>
      <Text style={styles.cardLocation} numberOfLines={1}>{record.location}</Text>

      <View style={styles.cardDivider} />

      {/* Action chips */}
      <View style={styles.chipsRow}>
        {record.arrived && (
          <View style={[styles.chip, { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" }]}>
            <Ionicons name="enter-outline" size={12} color="#16A34A" />
            <Text style={[styles.chipText, { color: "#16A34A" }]}>Arrived</Text>
          </View>
        )}
        {record.left && (
          <View style={[styles.chip, { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" }]}>
            <Ionicons name="exit-outline" size={12} color="#6B7280" />
            <Text style={[styles.chipText, { color: "#6B7280" }]}>Left</Text>
          </View>
        )}
        {record.flagged && (
          <View style={[styles.chip, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
            <Ionicons name="warning-outline" size={12} color="#D97706" />
            <Text style={[styles.chipText, { color: "#D97706" }]}>Flagged info</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function History() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [tabBarW, setTabBarW] = useState(0);
  const tabSlide = useRef(new Animated.Value(0)).current;

  if (!fontsLoaded) return null;

  const pillWidth = tabBarW > 0 ? (tabBarW - PILL_PAD * 2) / 2 : 0;
  const pillX = tabSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [PILL_PAD, PILL_PAD + pillWidth],
  });

  function switchTab(idx: number) {
    setActiveTab(idx);
    Animated.spring(tabSlide, {
      toValue: idx,
      useNativeDriver: true,
      tension: 68,
      friction: 10,
    }).start();
  }

  return (
    <ImageBackground
      source={require("../assets/images/background.png")}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Animated Tab Bar */}
        <View
          style={styles.tabBar}
          onLayout={(e) => setTabBarW(e.nativeEvent.layout.width)}
        >
          {tabBarW > 0 && (
            <Animated.View
              style={[
                styles.tabPill,
                { width: pillWidth, transform: [{ translateX: pillX }] },
              ]}
            />
          )}

          <TouchableOpacity style={styles.tab} onPress={() => switchTab(0)} activeOpacity={0.8}>
            <Ionicons
              name="car-outline"
              size={15}
              color={activeTab === 0 ? "#fff" : "#9CA3AF"}
            />
            <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>
              Parking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => switchTab(1)} activeOpacity={0.8}>
            <Ionicons
              name="flag-outline"
              size={15}
              color={activeTab === 1 ? "#fff" : "#9CA3AF"}
            />
            <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>
              Reports
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 0
            ? PARKING_HISTORY.map((r) => <ParkingCard key={r.id} record={r} />)
            : REPORT_HISTORY.map((r) => <ReportCard key={r.id} record={r} />)}
        </ScrollView>

      </SafeAreaView>
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgImage: { opacity: 0.75 },
  safe: { flex: 1 },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: "#1a1a2e",
    letterSpacing: 0.2,
  },

  // ── Tab Bar ──────────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    padding: PILL_PAD,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabPill: {
    position: "absolute",
    top: PILL_PAD,
    bottom: PILL_PAD,
    left: 0,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#9CA3AF",
  },
  tabTextActive: {
    color: "#fff",
  },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },

  // ── Card ─────────────────────────────────────────────────
  card: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  idBadge: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  idText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#fff",
    letterSpacing: 0.4,
  },
  dateLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9CA3AF",
    flex: 1,
  },
  cardName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#1a1a2e",
    marginBottom: 2,
  },
  cardLocation: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 14,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginBottom: 14,
  },

  // ── Pill badges ──────────────────────────────────────────
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  pillGreen: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
  pillIndigo: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  pillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },

  // ── Times row (Parking) ──────────────────────────────────
  timesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  timeBlock: {
    flex: 1,
  },
  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  timeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  timeLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#9CA3AF",
  },
  timeValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: "#1a1a2e",
  },

  // ── Chips row (Reports) ──────────────────────────────────
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
});
