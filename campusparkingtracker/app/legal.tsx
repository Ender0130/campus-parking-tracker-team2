import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const PRIMARY = "#4F46E5";

// ── Document Content ──────────────────────────────────────────────────────────

type Section = { heading: string; body: string };
type Doc = { icon: string; iconBg: string; iconColor: string; title: string; updated: string; sections: Section[] };

const DOCS: Record<string, Doc> = {
  privacy: {
    icon: "shield-checkmark-outline",
    iconBg: "#EEF2FF",
    iconColor: PRIMARY,
    title: "Privacy Policy",
    updated: "Effective March 6, 2026",
    sections: [
      {
        heading: "Information We Collect",
        body: "We collect your campus and residential community selections, parking activity (arrivals, departures, and reports you submit), device identifiers for notification delivery, and approximate location data when you interact with parking structures.",
      },
      {
        heading: "How We Use Your Information",
        body: "Your data is used to display real-time parking availability to the SDSU community, improve the accuracy of crowd-sourced availability data, send you relevant parking notifications, and generate anonymized analytics for SDSU Parking Services.",
      },
      {
        heading: "Data Sharing",
        body: "We do not sell your personal information. Aggregate, anonymized parking data may be shared with SDSU Parking Services for operational planning. We do not share identifiable information with third parties without your explicit consent.",
      },
      {
        heading: "Data Retention",
        body: "Parking and reporting history is retained for 90 days, after which it is automatically deleted. Account profile information (name, email, campus, community) is retained until you delete your account or submit a removal request.",
      },
      {
        heading: "Your Rights",
        body: "You may access, correct, or request deletion of your data at any time through the Settings screen or by contacting us directly. You may opt out of push notifications at any time in the Preferences section of Settings.",
      },
      {
        heading: "Security",
        body: "We implement industry-standard security measures to protect your information. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.",
      },
      {
        heading: "Contact Us",
        body: "For privacy-related questions or data deletion requests, please contact us at parkingapp@sdsu.edu. We aim to respond within 5 business days.",
      },
    ],
  },

  terms: {
    icon: "document-text-outline",
    iconBg: "#ECFDF5",
    iconColor: "#16A34A",
    title: "Terms of Service",
    updated: "Effective March 6, 2026",
    sections: [
      {
        heading: "Eligibility",
        body: "CampusPark is intended for enrolled SDSU students, faculty, staff, and on-campus residents. By using this app you confirm you are affiliated with San Diego State University and agree to be bound by these Terms.",
      },
      {
        heading: "Accurate Reporting",
        body: "You agree to submit honest and accurate reports. Submitting false arrival, departure, or availability reports degrades the experience for all users. Repeated inaccurate or malicious reports may result in account suspension.",
      },
      {
        heading: "Acceptable Use",
        body: "This app is for personal, non-commercial use only. You may not use the app to collect data for third-party services, automate reports via bots or scripts, or interfere with the app's functionality. Never use the app while operating a vehicle.",
      },
      {
        heading: "Accuracy Disclaimer",
        body: "Parking availability data is crowd-sourced and may not reflect real-time conditions. CampusPark makes no guarantees about the accuracy of any availability information and is not liable for parking citations, missed spots, or any inconvenience arising from inaccurate data.",
      },
      {
        heading: "Intellectual Property",
        body: "All content, branding, and code within CampusPark is the property of its developers. You may not reproduce, distribute, or create derivative works without prior written permission.",
      },
      {
        heading: "Termination",
        body: "We reserve the right to suspend or terminate accounts that violate these Terms, submit abusive reports, or engage in behavior that harms the community. You may delete your account at any time through the Settings screen.",
      },
      {
        heading: "Limitation of Liability",
        body: "To the maximum extent permitted by applicable law, CampusPark and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of, or inability to use, the app.",
      },
      {
        heading: "Changes to Terms",
        body: "We may update these Terms periodically. Material changes will be communicated through an in-app notice. Continued use of CampusPark after changes take effect constitutes your acceptance of the updated Terms.",
      },
      {
        heading: "Contact",
        body: "Questions about these Terms? Reach us at parkingapp@sdsu.edu.",
      },
    ],
  },

  licenses: {
    icon: "code-slash-outline",
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    title: "Open Source Licenses",
    updated: "CampusPark v1.0.0",
    sections: [
      {
        heading: "React Native",
        body: "Copyright © Meta Platforms, Inc. and affiliates.\nLicensed under the MIT License.\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction.",
      },
      {
        heading: "Expo",
        body: "Copyright © 2015-present 650 Industries, Inc. (Expo)\nLicensed under the MIT License.\n\nExpo provides the runtime and tooling that powers CampusPark, including the managed workflow, native modules, and OTA updates.",
      },
      {
        heading: "expo-router",
        body: "Copyright © 2022-present Evan Bacon\nLicensed under the MIT License.\n\nFile-based routing for React Native and web, built on top of React Navigation.",
      },
      {
        heading: "@expo/vector-icons",
        body: "Copyright © 2015 Joel Arvidsson\nLicensed under the MIT License.\n\nIncludes icon sets from Ionicons, FontAwesome, MaterialIcons, and others, bundled for use with Expo.",
      },
      {
        heading: "react-native-safe-area-context",
        body: "Copyright © Th3rdwave\nLicensed under the MIT License.\n\nProvides access to safe area insets so the UI avoids hardware notches, home indicators, and status bars.",
      },
      {
        heading: "Poppins Typeface",
        body: "Designed by Indian Type Foundry and Jonny Pinhorn.\nLicensed under the SIL Open Font License 1.1.\n\nDistributed via Google Fonts and @expo-google-fonts/poppins.",
      },
      {
        heading: "React Navigation",
        body: "Copyright © 2017 React Navigation Contributors\nLicensed under the MIT License.\n\nRouting and navigation for React Native apps. Expo Router is built on top of React Navigation primitives.",
      },
    ],
  },
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function Legal() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const doc = DOCS[type ?? "privacy"];

  if (!fontsLoaded || !doc) return null;

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
          <Text style={styles.headerTitle} numberOfLines={1}>{doc.title}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro card */}
          <View style={styles.introCard}>
            <View style={[styles.docIconWrap, { backgroundColor: doc.iconBg }]}>
              <Ionicons name={doc.icon as any} size={30} color={doc.iconColor} />
            </View>
            <Text style={styles.docTitle}>{doc.title}</Text>
            <Text style={styles.docDate}>{doc.updated}</Text>
          </View>

          {/* Sections */}
          {doc.sections.map((section, i) => (
            <View key={i} style={styles.sectionCard}>
              <View style={styles.sectionHeadingRow}>
                <View style={[styles.sectionAccent, { backgroundColor: doc.iconColor }]} />
                <Text style={[styles.sectionHeading, { color: doc.iconColor }]}>{section.heading}</Text>
              </View>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          <Text style={styles.footer}>CampusPark · SDSU Edition</Text>
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
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 52,
    gap: 12,
  },

  // ── Intro card ───────────────────────────────────────────
  introCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  docIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  docTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#1a1a2e",
    marginBottom: 5,
    textAlign: "center",
  },
  docDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },

  // ── Section cards ────────────────────────────────────────
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.95)",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionHeading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  sectionBody: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#374151",
    lineHeight: 22,
  },

  footer: {
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(26,26,46,0.38)",
    letterSpacing: 0.3,
    marginTop: 8,
  },
});
