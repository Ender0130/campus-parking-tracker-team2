import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
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
import { fetchLots, submitReport, Lot, LotStatus } from "../services/api";

const PRIMARY = "#4F46E5";

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
  onClose,
  onReported,
}: {
  lot: Lot | null;
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
  }, [visible]);

  if (!lot) return null;

  /** Map user actions → a status string the backend understands */
  function deriveStatus(): LotStatus {
    if (infoWrong) return "FULL";   // flag as full when reporting wrong info
    if (left) return "AVAILABLE";   // someone left → more space
    if (arrived) return "LIMITED";  // someone arrived → less space
    return lot!.status;             // no change
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
        lot_name: lot!.name,
        status: deriveStatus(),
        reporter: "anonymous",   // swap with real user ID / auth token
      });

      if (result.success) {
        onReported({
          status: result.status,
          color: result.color,
          last_updated: result.last_updated,
        });
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

  const color = statusColor(lot.status);
  const label = statusLabel(lot.status);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableOpacity>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
          <View style={styles.sheetHandle} />

          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{lot.name}</Text>
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

          {/* Arrived / Left buttons */}
          <View style={styles.fieldRow}>
            <TouchableOpacity
              style={[styles.actionBtn, arrived && styles.actionBtnActive]}
              activeOpacity={0.75}
              onPress={() => { setArrived((v) => !v); setLeft(false); }}
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
              onPress={() => { setLeft((v) => !v); setArrived(false); }}
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

          {/* Report wrong info */}
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

          {/* Error message */}
          {submitError && (
            <Text style={styles.errorText}>{submitError}</Text>
          )}

          {/* Submit */}
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
                <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
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
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lot | null>(null);

  const loadLots = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      const data = await fetchLots();
      setLots(data);
    } catch (e) {
      setFetchError("Could not load parking data. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadLots(); }, [loadLots]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => loadLots(true), 60_000);
    return () => clearInterval(interval);
  }, [loadLots]);

  /** Patch a single lot in state after a user report */
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>SDSU Parking Lots</Text>
          <View style={styles.headerActions}>
            <View>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.push("/alerts")}>
                <Ionicons name="notifications-outline" size={20} color="#1a1a2e" />
              </TouchableOpacity>
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>4</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.push("/history")}>
              <Ionicons name="time-outline" size={20} color="#1a1a2e" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.push("/settings")}>
              <Ionicons name="settings-outline" size={20} color="#1a1a2e" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading state */}
        {loading && !refreshing && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading parking data…</Text>
          </View>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={40} color="#6B7280" />
            <Text style={styles.errorStateText}>{fetchError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadLots()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lots list */}
        {!loading && !fetchError && (
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
                    {lot.total_spots} total spots · Updated {new Date(lot.last_updated).toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>

      <ReportModal
        lot={selected}
        onClose={() => setSelected(null)}
        onReported={(updated) => {
          if (selected) handleReported(selected.name, updated);
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: { opacity: 0.75 },
  safe: { flex: 1 },

  // ── Header ──────────────────────────────────────────
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

  // ── States ───────────────────────────────────────────
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

  // ── Scroll ───────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },

  // ── Card ─────────────────────────────────────────────
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

  // ── Report Modal ──────────────────────────────────────
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
