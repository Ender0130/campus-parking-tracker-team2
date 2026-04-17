import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const PRIMARY = "#4F46E5";

const CAMPUSES = ["SDSU", "UCSD", "CSUSM"];
const CAMPUS_LABELS: Record<string, string> = {
  SDSU: "SDSU - San Diego State University",
  UCSD: "UCSD - University of California San Diego",
  CSUSM: "CSUSM - California State University San Marcos",
};

const COMMUNITIES = [
  "Aztec Corner",
  "Aztec Shores",
  "Chapultepec Hall",
  "Cuicacalli Suites",
  "Diegueno Hall",
  "Olmeca Hall",
  "South Campus Plaza",
  "Tenochca Hall",
  "Tepeyac Hall",
  "Villa Alvarado",
  "Zura Hall",
];

type DropdownRowProps = {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  getLabel?: (value: string) => string;
};

function DropdownRow({ label, options, selected, onSelect, getLabel }: DropdownRowProps) {
  const [open, setOpen] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: 0,
          duration: 440,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: 320,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open]);

  const displayValue = selected ? (getLabel ? getLabel(selected) : selected) : "Not set";

  return (
    <>
      <TouchableOpacity style={styles.settingsRow} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowRight}>
          <Text style={styles.rowValue} numberOfLines={1}>
            {displayValue}
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#C4C4C4" />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.sheetItemText, item === selected && styles.sheetItemActive]}>
                    {getLabel ? getLabel(item) : item}
                  </Text>
                  {item === selected && (
                    <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Settings() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  const router = useRouter();
  const params = useLocalSearchParams<{
    campus?: string | string[];
    community?: string | string[];
  }>();

  const initialCampus =
    typeof params.campus === "string"
      ? params.campus
      : Array.isArray(params.campus)
        ? params.campus[0]
        : "SDSU";

  const initialCommunity =
    typeof params.community === "string"
      ? params.community
      : Array.isArray(params.community)
        ? params.community[0]
        : "Aztec Corner";

  const [name, setName] = useState("John Aztec");
  const [email, setEmail] = useState("");
  const [campus, setCampus] = useState(initialCampus);
  const [community, setCommunity] = useState(initialCommunity);
  const [notifications, setNotifications] = useState(true);
  const [spotAlerts, setSpotAlerts] = useState(true);
  const [highTrafficAlerts, setHighTrafficAlerts] = useState(true);
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(true);
  const [gameDayAlerts, setGameDayAlerts] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);

  if (!fontsLoaded) return null;

  const initials = getInitials(name || "U");

  return (
    <ImageBackground
      source={require("../assets/images/background.png")}
      style={styles.root}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Profile Hero ── */}
          <View style={styles.profileHero}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.profileName}>{name.trim() || "Your Name"}</Text>
            <View style={styles.badgeRow}>
              {campus ? (
                <View style={[styles.badge, styles.badgePrimary]}>
                  <Ionicons name="school-outline" size={11} color={PRIMARY} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: PRIMARY }]}>{campus}</Text>
                </View>
              ) : null}
              {community ? (
                <View style={[styles.badge, styles.badgeGray]}>
                  <Ionicons name="home-outline" size={11} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: "#6B7280" }]}>{community}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── My Profile ── */}
          <SectionLabel icon="person-circle-outline" title="MY PROFILE" />

          <View style={styles.card}>
            {/* Name */}
            <View style={styles.settingsRow}>
              <Text style={styles.rowLabel}>Full Name</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#C4C4C4"
                returnKeyType="done"
                selectionColor={PRIMARY}
              />
            </View>

            <Divider />

            {/* Email */}
            <View style={styles.settingsRow}>
              <Text style={styles.rowLabel}>Email</Text>
              <TextInput
                style={styles.nameInput}
                value={email}
                onChangeText={setEmail}
                placeholder="yourname@sdsu.edu"
                placeholderTextColor="#C4C4C4"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                selectionColor={PRIMARY}
              />
            </View>

            <Divider />

            <DropdownRow
              label="Campus"
              options={CAMPUSES}
              selected={campus}
              onSelect={setCampus}
              getLabel={(v) => CAMPUS_LABELS[v] ?? v}
            />

            <Divider />

            <DropdownRow
              label="Community"
              options={COMMUNITIES}
              selected={community}
              onSelect={setCommunity}
            />
          </View>

          {/* ── Preferences ── */}
          <SectionLabel icon="options-outline" title="PREFERENCES" />

          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="notifications-outline" size={16} color={PRIMARY} />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Push Notifications</Text>
                  <Text style={styles.toggleSub}>Updates on parking availability</Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#E5E7EB", true: PRIMARY + "70" }}
                thumbColor={notifications ? PRIMARY : "#D1D5DB"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <Divider />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons name="car-sport-outline" size={16} color="#22C55E" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Spot Alerts</Text>
                  <Text style={styles.toggleSub}>Alert when nearby spots open up</Text>
                </View>
              </View>
              <Switch
                value={spotAlerts}
                onValueChange={setSpotAlerts}
                trackColor={{ false: "#E5E7EB", true: PRIMARY + "70" }}
                thumbColor={spotAlerts ? PRIMARY : "#D1D5DB"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* ── Alert Types ── */}
          <SectionLabel icon="notifications-outline" title="ALERT TYPES" />

          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: "#DCFCE7" }]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Availability Updates</Text>
                  <Text style={styles.toggleSub}>When spots open or fill up</Text>
                </View>
              </View>
              <Switch
                value={spotAlerts}
                onValueChange={setSpotAlerts}
                trackColor={{ false: "#E5E7EB", true: PRIMARY + "70" }}
                thumbColor={spotAlerts ? PRIMARY : "#D1D5DB"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <Divider />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: "#FFFBEB" }]}>
                  <Ionicons name="warning-outline" size={16} color="#D97706" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>High Traffic Warnings</Text>
                  <Text style={styles.toggleSub}>When structures are nearly full</Text>
                </View>
              </View>
              <Switch
                value={highTrafficAlerts}
                onValueChange={setHighTrafficAlerts}
                trackColor={{ false: "#E5E7EB", true: PRIMARY + "70" }}
                thumbColor={highTrafficAlerts ? PRIMARY : "#D1D5DB"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <Divider />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="megaphone-outline" size={16} color={PRIMARY} />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Announcements</Text>
                  <Text style={styles.toggleSub}>Maintenance, closures & news</Text>
                </View>
              </View>
              <Switch
                value={announcementsEnabled}
                onValueChange={setAnnouncementsEnabled}
                trackColor={{ false: "#E5E7EB", true: PRIMARY + "70" }}
                thumbColor={announcementsEnabled ? PRIMARY : "#D1D5DB"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <Divider />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: "#F5F3FF" }]}>
                  <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Game Day Warnings</Text>
                  <Text style={styles.toggleSub}>Event & game day traffic alerts</Text>
                </View>
              </View>
              <Switch
                value={gameDayAlerts}
                onValueChange={setGameDayAlerts}
                trackColor={{ false: "#E5E7EB", true: PRIMARY + "70" }}
                thumbColor={gameDayAlerts ? PRIMARY : "#D1D5DB"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <Divider />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: "#F3F4F6" }]}>
                  <Ionicons name="bar-chart-outline" size={16} color="#6B7280" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Weekly Summary</Text>
                  <Text style={styles.toggleSub}>Your parking stats every Monday</Text>
                </View>
              </View>
              <Switch
                value={weeklySummary}
                onValueChange={setWeeklySummary}
                trackColor={{ false: "#E5E7EB", true: PRIMARY + "70" }}
                thumbColor={weeklySummary ? PRIMARY : "#D1D5DB"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* ── About ── */}
          <SectionLabel icon="information-circle-outline" title="ABOUT" />

          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.rowLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>

            <Divider />

            <View style={styles.aboutRow}>
              <Text style={styles.rowLabel}>Made for</Text>
              <Text style={styles.aboutValue}>{campus} Community</Text>
            </View>

            <Divider />

            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <Text style={styles.rowLabel}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={15} color="#C4C4C4" />
            </TouchableOpacity>
          </View>

          {/* ── Legal ── */}
          <SectionLabel icon="shield-outline" title="LEGAL" />

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={() => router.push("/legal?type=privacy")}
            >
              <View style={styles.legalRowLeft}>
                <View style={[styles.legalIcon, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={PRIMARY} />
                </View>
                <Text style={styles.rowLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#C4C4C4" />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={() => router.push("/legal?type=terms")}
            >
              <View style={styles.legalRowLeft}>
                <View style={[styles.legalIcon, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons name="document-text-outline" size={15} color="#16A34A" />
                </View>
                <Text style={styles.rowLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#C4C4C4" />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={() => router.push("/legal?type=licenses")}
            >
              <View style={styles.legalRowLeft}>
                <View style={[styles.legalIcon, { backgroundColor: "#F5F3FF" }]}>
                  <Ionicons name="code-slash-outline" size={15} color="#7C3AED" />
                </View>
                <Text style={styles.rowLabel}>Open Source Licenses</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#C4C4C4" />
            </TouchableOpacity>
          </View>

          {/* ── Sign Out ── */}
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.82}
            onPress={() => router.replace("/")}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 10 }} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>CampusPark · {campus} Edition · v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function SectionLabel({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Ionicons name={icon} size={13} color={PRIMARY} />
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: { opacity: 0.75 },
  safe: { flex: 1 },

  // ── Header ──────────────────────────────────────────
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

  // ── Scroll ──────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 52,
  },

  // ── Profile Hero ────────────────────────────────────
  profileHero: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
    marginBottom: 16,
    shadowColor: PRIMARY,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  avatar: {
    flex: 1,
    borderRadius: 43,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 30,
    color: "#fff",
    letterSpacing: 1.5,
  },
  profileName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#1a1a2e",
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  badgePrimary: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  badgeGray: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: "rgba(255,255,255,0.9)",
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  // ── Section Label ───────────────────────────────────
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: PRIMARY,
    letterSpacing: 1.3,
  },

  // ── Card ────────────────────────────────────────────
  card: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EBEBEB",
    marginHorizontal: 16,
  },

  // ── Row types ───────────────────────────────────────
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#1a1a2e",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  rowValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
    maxWidth: 180,
    textAlign: "right",
  },
  nameInput: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: PRIMARY,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
    padding: 0,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  aboutValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
  },

  // ── Toggle Row ──────────────────────────────────────
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#1a1a2e",
  },
  toggleSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 1,
  },

  // ── Legal Rows ──────────────────────────────────────
  legalRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  legalIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Sign Out ────────────────────────────────────────
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    backgroundColor: "rgba(254,242,242,0.85)",
    shadowColor: "#EF4444",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  signOutText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#EF4444",
  },

  footerNote: {
    textAlign: "center",
    marginTop: 28,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(26,26,46,0.38)",
    letterSpacing: 0.3,
  },

  // ── Bottom Sheet Modal ──────────────────────────────
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 44,
    maxHeight: "65%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#AEAEB2",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sheetItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F2F2F7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetItemText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#1a1a2e",
  },
  sheetItemActive: {
    fontFamily: "Poppins_600SemiBold",
    color: PRIMARY,
  },
});
