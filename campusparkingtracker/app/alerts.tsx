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

type AlertType = "availability" | "warning" | "system" | "community" | "tip";

type Alert = {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  structureId?: string;
  time: string;
  read: boolean;
};

// ── Type visual config ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AlertType, { icon: string; bg: string; color: string; label: string }> = {
  availability: { icon: "checkmark-circle-outline", bg: "#DCFCE7", color: "#16A34A", label: "Available" },
  warning:      { icon: "warning-outline",          bg: "#FFFBEB", color: "#D97706", label: "Alert"     },
  system:       { icon: "megaphone-outline",         bg: "#EEF2FF", color: PRIMARY,   label: "System"    },
  community:    { icon: "calendar-outline",          bg: "#F5F3FF", color: "#7C3AED", label: "Event"     },
  tip:          { icon: "bulb-outline",              bg: "#F3F4F6", color: "#6B7280", label: "Tip"       },
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: Alert[] = [
  // ── Parking tab ──────────────────────────────────────────────────────────
  {
    id: "a1",
    type: "availability",
    title: "PS1 Opened Up",
    body: "47 spots just became available at Parking Structure 1 near Student Services West.",
    structureId: "PS1",
    time: "2 min ago",
    read: false,
  },
  {
    id: "a2",
    type: "warning",
    title: "PS3 Nearly Full",
    body: "Only 8 spots remaining. Consider PS4 (23 available) or PS7 (88 available) as alternatives.",
    structureId: "PS3",
    time: "18 min ago",
    read: false,
  },
  {
    id: "a3",
    type: "availability",
    title: "Spot Near Your Community",
    body: "A spot opened at PS5, the closest structure to Aztec Corner. Move fast — it's filling up.",
    structureId: "PS5",
    time: "35 min ago",
    read: true,
  },
  {
    id: "a4",
    type: "warning",
    title: "PS2 Is Full",
    body: "No spots available at PS2. PS4 and PS7 have availability right now.",
    structureId: "PS2",
    time: "1h ago",
    read: true,
  },
  {
    id: "a5",
    type: "availability",
    title: "PS8 Has 60+ Spots",
    body: "Parking Structure 8 near South Campus Plaza currently has plenty of open spaces.",
    structureId: "PS8",
    time: "3h ago",
    read: true,
  },
  {
    id: "a6",
    type: "warning",
    title: "PS6 Filling Fast",
    body: "15 spots remaining at PS6 near College of Business — filling at an above-average rate.",
    structureId: "PS6",
    time: "Yesterday",
    read: true,
  },

  // ── Announcements tab ─────────────────────────────────────────────────────
  {
    id: "b1",
    type: "system",
    title: "PS3 Weekend Maintenance",
    body: "Parking Structure 3 will operate at 60% capacity this Saturday and Sunday due to structural maintenance on floors 4–5.",
    time: "1h ago",
    read: false,
  },
  {
    id: "b2",
    type: "community",
    title: "Game Day — Aztecs vs. Fresno State",
    body: "Heavy parking demand expected Friday evening. Structures near Snapdragon Stadium will fill by 4 PM. Plan accordingly.",
    time: "3h ago",
    read: false,
  },
  {
    id: "b3",
    type: "system",
    title: "Commencement Week Parking",
    body: "Special parking restrictions are in effect May 14–17. Refer to the SDSU parking calendar for structure availability during ceremonies.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "b4",
    type: "system",
    title: "Spring Permit Renewals Open",
    body: "Renew your parking permit for Spring 2026 through the SDSU Parking Portal. Deadline is January 31 — late renewals may lose your zone assignment.",
    time: "Mar 4",
    read: true,
  },
  {
    id: "b5",
    type: "tip",
    title: "New EV Charging at PS8",
    body: "12 new Level 2 EV charging stations have been installed on the ground floor of Parking Structure 8. Available to all permit holders.",
    time: "Mar 2",
    read: true,
  },
  {
    id: "b6",
    type: "tip",
    title: "Friday Evening Parking Tip",
    body: "PS5 typically clears out by 6 PM on Fridays — a great option if you're heading to an evening event on campus.",
    time: "Mar 1",
    read: true,
  },
];

const PARKING_TYPES: AlertType[]      = ["availability", "warning"];
const ANNOUNCEMENT_TYPES: AlertType[] = ["system", "community", "tip"];

// ── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({ alert, onPress }: { alert: Alert; onPress: () => void }) {
  const cfg = TYPE_CONFIG[alert.type];

  return (
    <TouchableOpacity
      style={[styles.card, !alert.read && styles.cardUnread]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      {/* Unread left accent bar */}
      {!alert.read && <View style={styles.unreadBar} />}

      <View style={[styles.cardInner, !alert.read && { paddingLeft: 20 }]}>
        {/* Type icon */}
        <View style={[styles.alertIcon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={19} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={styles.alertContent}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text
              style={[styles.alertTitle, alert.read && styles.alertTitleRead]}
              numberOfLines={1}
            >
              {alert.title}
            </Text>
            <View style={styles.timeMeta}>
              {!alert.read && <View style={styles.unreadDot} />}
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
          </View>

          {/* Body */}
          <Text style={styles.alertBody} numberOfLines={2}>{alert.body}</Text>

          {/* Structure tag */}
          {alert.structureId && (
            <View style={styles.structureTag}>
              <Ionicons name="location-outline" size={10} color={cfg.color} style={{ marginRight: 3 }} />
              <Text style={[styles.structureTagText, { color: cfg.color }]}>{alert.structureId}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function Alerts() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [activeTab, setActiveTab] = useState(0);
  const [tabBarW, setTabBarW] = useState(0);
  const tabSlide = useRef(new Animated.Value(0)).current;

  if (!fontsLoaded) return null;

  const currentTypes = activeTab === 0 ? PARKING_TYPES : ANNOUNCEMENT_TYPES;
  const filtered = alerts.filter((a) => currentTypes.includes(a.type));
  const unreadCount = filtered.filter((a) => !a.read).length;

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

  function markAllRead() {
    setAlerts((prev) =>
      prev.map((a) => (currentTypes.includes(a.type) ? { ...a, read: true } : a))
    );
  }

  function markOneRead(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }

  return (
    <ImageBackground
      source={require("../assets/images/background.png")}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#1a1a2e" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Alerts</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={markAllRead}
            activeOpacity={0.7}
            disabled={unreadCount === 0}
          >
            <Text style={[styles.markReadBtn, unreadCount === 0 && styles.markReadBtnDisabled]}>
              Mark read
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab Bar ── */}
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
            <Ionicons name="car-outline" size={15} color={activeTab === 0 ? "#fff" : "#9CA3AF"} />
            <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>
              Parking
            </Text>
            {alerts.filter((a) => PARKING_TYPES.includes(a.type) && !a.read).length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {alerts.filter((a) => PARKING_TYPES.includes(a.type) && !a.read).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tab} onPress={() => switchTab(1)} activeOpacity={0.8}>
            <Ionicons name="megaphone-outline" size={15} color={activeTab === 1 ? "#fff" : "#9CA3AF"} />
            <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>
              Announcements
            </Text>
            {alerts.filter((a) => ANNOUNCEMENT_TYPES.includes(a.type) && !a.read).length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {alerts.filter((a) => ANNOUNCEMENT_TYPES.includes(a.type) && !a.read).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── List ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onPress={() => markOneRead(alert.id)}
            />
          ))}
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
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: "#1a1a2e",
    letterSpacing: 0.2,
  },
  headerBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#fff",
  },
  markReadBtn: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: PRIMARY,
  },
  markReadBtnDisabled: {
    color: "#C4C4C4",
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
  tabBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
  },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 10,
  },

  // ── Alert Card ───────────────────────────────────────────
  card: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.88)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(255,255,255,0.98)",
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
  },
  unreadBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: PRIMARY,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  alertContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  alertTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#1a1a2e",
    flex: 1,
  },
  alertTitleRead: {
    fontFamily: "Poppins_600SemiBold",
    color: "#374151",
  },
  timeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  alertTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#9CA3AF",
  },
  alertBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 8,
  },
  structureTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  structureTagText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
});
