import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ApiError, fetchLots, submitReport, Lot, LotStatus } from "../services/api";

const PRIMARY = "#4F46E5";
const REPORTER = "anonymous";
const REPORT_REWARD = 5;

const FALLBACK_LOTS_BY_CAMPUS: Record<string, string[]> = {
  SDSU: [
    "Parking Lot 1",
    "Parking Lot 2B",
    "Parking Lot 2C",
    "Parking Lot 3",
    "Parking Lot 4",
    "Parking Lot 12",
    "Parking Lot 15",
    "Parking Lot 17",
    "Parking Lot 17A",
    "Parking Lot 17B",
  ],
  UCSD: [
    "Gilman Parking Structure",
    "Hopkins Parking Structure",
    "Pangea Parking Structure",
  ],
  CSUSM: ["Lot B", "Lot C", "Parking Structure 1"],
};

// ─── Derive UI helpers from backend status string ───────────────────────────
function statusColor(status: LotStatus): string {
  if (status === "FULL") return "#EF4444";
  if (status === "LIMITED") return "#F59E0B";
  return "#22C55E";
}

function statusLabel(status: LotStatus): string {
  if (status === "FULL") return "Full";
  if (status === "LIMITED") return "Limited";
  return "Available";
}

// ─── Report Modal ────────────────────────────────────────────────────────────
function ReportModal({
  lot,
  campus,
  onClose,
  onReported,
}: {
  lot: Lot | null;
  campus: string;
  onClose: () => void;
  /** Called with the updated lot data after a successful report */
  onReported: (updated: Partial<Lot>) => void;
}) {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(400)).current;

  const [arrived, setArrived] = useState(false);
  const [left, setLeft] = useState(false);
  const [infoWrong, setInfoWrong] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const visible = lot !== null;

  useEffect(() => {
    if (visible) {
      setArrived(false);
      setLeft(false);
      setInfoWrong(false);
      setSubmitError(null);
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
          toValue: 400,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropAnim, sheetAnim]);

  if (!lot) return null;
  const currentLot = lot;

  /** Map user actions → a status string the backend understands */
  function deriveStatus(): LotStatus {
    if (infoWrong) return "FULL";
    if (left) return "AVAILABLE";
    if (arrived) return "LIMITED";
    return currentLot.status;
  }

  async function handleSubmit() {
    if (!arrived && !left && !infoWrong) {
      onClose();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitReport({
        campus,
        lot_name: currentLot.name,
        status: deriveStatus(),
        reporter: "anonymous",
      });

      if (result.success) {
        if (result.lot) {
          onReported(result.lot);
        }
        onClose();
      } else {
        setSubmitError(result.error ?? "Something went wrong.");
      }
    } catch (e) {
      setSubmitError("Network error — check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  const color = statusColor(currentLot.status);
  const label = statusLabel(currentLot.status);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]}
          />
        </TouchableOpacity>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{currentLot.name}</Text>
              <Text style={styles.sheetSubtitle}>
                Last updated: {new Date(lot.last_updated).toLocaleTimeString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: color + "22" }]}>
              <View style={[styles.statusDot, { backgroundColor: color }]} />
              <Text style={[styles.statusText, { color }]}>{label}</Text>
            </View>
          </View>

          <View style={styles.sheetDivider} />

          <View style={styles.fieldRow}>
            <TouchableOpacity
              style={[styles.actionBtn, arrived && styles.actionBtnActive]}
              activeOpacity={0.75}
              onPress={() => {
                setArrived((v) => !v);
                setLeft(false);
              }}
            >
              <Ionicons
                name={arrived ? "checkmark-circle" : "enter-outline"}
                size={20}
                color={arrived ? "#fff" : PRIMARY}
              />
              <Text style={[styles.actionBtnText, arrived && styles.actionBtnTextActive]}>
                {arrived ? "Arrived ✓" : "I Arrived"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, left && styles.actionBtnLeftActive]}
              activeOpacity={0.75}
              onPress={() => {
                setLeft((v) => !v);
                setArrived(false);
              }}
            >
              <Ionicons
                name={left ? "checkmark-circle" : "exit-outline"}
                size={20}
                color={left ? "#fff" : "#6B7280"}
              />
              <Text style={[styles.actionBtnText, left && styles.actionBtnTextActive]}>
                {left ? "Left ✓" : "I Left"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.reportToggle, infoWrong && styles.reportToggleActive]}
            activeOpacity={0.75}
            onPress={() => setInfoWrong((v) => !v)}
          >
            <Ionicons
              name={infoWrong ? "warning" : "warning-outline"}
              size={18}
              color={infoWrong ? "#fff" : "#F59E0B"}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.reportToggleText, infoWrong && styles.reportToggleTextActive]}>
              {infoWrong ? "Flagged — availability looks wrong" : "Report: availability looks wrong"}
            </Text>
          </TouchableOpacity>

          {submitError && <Text style={styles.errorText}>{submitError}</Text>}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}


// ─── Locked report card ─────────────────────────────────────────────────────
function LockedReportCard({
  campus,
  points,
  onPointsChanged,
  onUnlocked,
}: {
  campus: string;
  points: number;
  onPointsChanged: (points: number) => void;
  onUnlocked: () => void;
}) {
  const lotNames = FALLBACK_LOTS_BY_CAMPUS[campus] ?? FALLBACK_LOTS_BY_CAMPUS.SDSU;
  const [selectedLotName, setSelectedLotName] = useState(lotNames[0]);
  const [selectedStatus, setSelectedStatus] = useState<LotStatus>("LIMITED");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLotName(lotNames[0]);
  }, [campus, lotNames]);

  async function handleEarnPoints() {
    setSubmitting(true);
    setMessage(null);

    try {
      const result = await submitReport({
        campus,
        lot_name: selectedLotName,
        status: selectedStatus,
        reporter: REPORTER,
      });

      if (result.success) {
        if (result.points !== undefined) {
          onPointsChanged(result.points);
        }
        setMessage(`Report submitted. You earned ${REPORT_REWARD} points.`);
        onUnlocked();
      } else {
        setMessage(result.error ?? "Could not submit report.");
      }
    } catch (e) {
      setMessage("Could not submit report. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusOptions: { label: string; value: LotStatus; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: "Available", value: "AVAILABLE", icon: "checkmark-circle-outline" },
    { label: "Limited", value: "LIMITED", icon: "alert-circle-outline" },
    { label: "Full", value: "FULL", icon: "close-circle-outline" },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.lockCard}>
        <View style={styles.lockIconCircle}>
          <Ionicons name="lock-closed-outline" size={28} color={PRIMARY} />
        </View>

        <Text style={styles.lockTitle}>Parking data is locked</Text>
        <Text style={styles.lockBody}>
          Submit a quick parking report to earn points. After you earn points, the app will unlock the live parking list.
        </Text>

        <View style={styles.pointsPillLarge}>
          <Ionicons name="sparkles-outline" size={16} color={PRIMARY} />
          <Text style={styles.pointsPillText}>Current points: {points}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.formLabel}>1. Which lot are you reporting?</Text>
        <View style={styles.choiceWrap}>
          {lotNames.map((lotName) => (
            <TouchableOpacity
              key={lotName}
              style={[
                styles.choiceChip,
                selectedLotName === lotName && styles.choiceChipActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setSelectedLotName(lotName)}
            >
              <Text
                style={[
                  styles.choiceChipText,
                  selectedLotName === lotName && styles.choiceChipTextActive,
                ]}
              >
                {lotName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.formLabel, { marginTop: 18 }]}>2. What did you see?</Text>
        <View style={styles.statusChoiceColumn}>
          {statusOptions.map((option) => {
            const active = selectedStatus === option.value;
            const color = statusColor(option.value);

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusChoice,
                  active && { borderColor: color, backgroundColor: color + "18" },
                ]}
                activeOpacity={0.75}
                onPress={() => setSelectedStatus(option.value)}
              >
                <Ionicons name={option.icon} size={20} color={color} />
                <Text style={[styles.statusChoiceText, active && { color }]}>
                  {option.label}
                </Text>
                {active && <Ionicons name="checkmark" size={18} color={color} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {message && <Text style={styles.infoText}>{message}</Text>}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleEarnPoints}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Submit Report (+{REPORT_REWARD} points)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Home screen ─────────────────────────────────────────────────────────────
export default function Home() {
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

  const campus =
    typeof params.campus === "string"
      ? params.campus
      : Array.isArray(params.campus)
        ? params.campus[0]
        : "SDSU";

  const community =
    typeof params.community === "string"
      ? params.community
      : Array.isArray(params.community)
        ? params.community[0]
        : "";

  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lot | null>(null);
  const [points, setPoints] = useState(0);
  const [locked, setLocked] = useState(false);

  const loadLots = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setFetchError(null);

      try {
        const data = await fetchLots(campus, REPORTER);
        setLots(data.lots ?? []);
        setPoints(data.points ?? 0);
        setLocked(false);
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setLocked(true);
          setLots([]);
          setPoints(e.points ?? 0);
          setFetchError(null);
        } else {
          setLocked(false);
          setFetchError("Could not load parking data. Check your connection.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [campus]
  );

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  useEffect(() => {
    const interval = setInterval(() => loadLots(true), 60_000);
    return () => clearInterval(interval);
  }, [loadLots]);

  function handleReported(lotName: string, updated: Partial<Lot>) {
    setLots((prev) =>
      prev.map((l) => (l.name === lotName ? { ...l, ...updated } : l))
    );
  }

  if (!fontsLoaded) return null;

  return (
    <ImageBackground
      source={require("../assets/images/background.png")}
      style={styles.root}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.heading}>{campus} Parking Lots</Text>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            Points: {points}
          </Text>
          <View style={styles.headerActions}>
            <View>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={() => router.push("/alerts")}
              >
                <Ionicons name="notifications-outline" size={20} color="#1a1a2e" />
              </TouchableOpacity>
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>4</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => router.push("/history")}
            >
              <Ionicons name="time-outline" size={20} color="#1a1a2e" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/settings",
                  params: {
                    campus,
                    community,
                  },
                })
              }
            >
              <Ionicons name="settings-outline" size={20} color="#1a1a2e" />
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading parking data…</Text>
          </View>
        )}

        {!loading && fetchError && !locked && (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={40} color="#6B7280" />
            <Text style={styles.errorStateText}>{fetchError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadLots()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && locked && (
          <LockedReportCard
            campus={campus}
            points={points}
            onPointsChanged={setPoints}
            onUnlocked={() => loadLots(true)}
          />
        )}

        {!loading && !fetchError && !locked && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadLots(true)}
                tintColor={PRIMARY}
              />
            }
          >
            <View style={styles.unlockHintCard}>
              <Ionicons name="information-circle-outline" size={18} color={PRIMARY} />
              <Text style={styles.unlockHintText}>
                Viewing this list costs 1 point. Submit reports to keep earning points.
              </Text>
            </View>

            {lots.map((lot) => {
              const color = statusColor(lot.status);
              const label = statusLabel(lot.status);

              return (
                <TouchableOpacity
                  key={lot.name}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() => setSelected(lot)}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName}>{lot.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: color + "26" }]}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text style={[styles.statusText, { color }]}>{label}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardMeta}>
                    {lot.total_spots} total spots · Updated{" "}
                    {new Date(lot.last_updated).toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>

      <ReportModal
        lot={selected}
        campus={campus}
        onClose={() => setSelected(null)}
        onReported={(updated) => {
          if (selected) handleReported(selected.name, updated);
          loadLots(true);
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: { opacity: 0.75 },
  safe: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1a1a2e",
    letterSpacing: 0.2,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
  },
  notifBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
  },
  errorStateText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#1a1a2e",
    flex: 1,
    marginRight: 8,
  },
  cardMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },


  lockCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  lockTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#1a1a2e",
    textAlign: "center",
  },
  lockBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  pointsPillLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 16,
  },
  pointsPillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: PRIMARY,
  },
  unlockHintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  unlockHintText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  formLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#1a1a2e",
    marginBottom: 10,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceChipActive: {
    borderColor: PRIMARY,
    backgroundColor: "#EEF2FF",
  },
  choiceChipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#6B7280",
  },
  choiceChipTextActive: {
    color: PRIMARY,
  },
  statusChoiceColumn: {
    gap: 10,
  },
  statusChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusChoiceText: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#4B5563",
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 14,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#1a1a2e",
  },
  sheetSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: "#EEF2FF",
  },
  actionBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  actionBtnLeftActive: {
    backgroundColor: "#6B7280",
    borderColor: "#6B7280",
  },
  actionBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: PRIMARY,
  },
  actionBtnTextActive: {
    color: "#fff",
  },
  reportToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFBEB",
  },
  reportToggleActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
  },
  reportToggleText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#92400E",
    flex: 1,
  },
  reportToggleTextActive: {
    color: "#fff",
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#EF4444",
    marginTop: 10,
    textAlign: "center",
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
