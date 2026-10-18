import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'TermsOfService'>;

export default function TermsOfServiceScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: theme.colors.bg, flex: 1 },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 20,
          paddingTop: 20,
        },
        headerTitle: {
          color: theme.colors.text,
          fontSize: 20,
          fontWeight: '600',
          marginLeft: 12,
        },
        section: {
          color: theme.colors.muted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1.4,
          marginTop: 20,
          paddingHorizontal: 20,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 20,
          borderWidth: 1,
          marginHorizontal: 20,
          marginTop: 8,
          padding: 16,
        },
        title: {
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 10,
        },
        body: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 22,
        },
        bodyBold: {
          color: theme.colors.text,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 22,
        },
        updated: {
          color: theme.colors.muted,
          fontSize: 12,
          marginBottom: 16,
          paddingHorizontal: 20,
        },
        listItem: {
          color: theme.colors.textSecondary,
          fontSize: 14,
          lineHeight: 22,
          paddingHorizontal: 20,
          marginTop: 6,
        },
      }),
    [theme]
  );

  return (
    <ScrollView style={themedStyles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={themedStyles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons color={theme.colors.text} name="chevron-back" size={24} />
        </Pressable>
        <Text style={themedStyles.headerTitle}>Terms of Service</Text>
      </View>

      <Text style={themedStyles.updated}>Last updated: October 18, 2026</Text>

      <Text style={themedStyles.section}>1. ACCEPTANCE OF TERMS</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          Welcome to Be_fit ('we', 'us', 'our'). These Terms of Service ('Terms') govern your access to and use of the Be_fit mobile application (the 'App'). By downloading, installing, or using the App, you agree to these Terms. If you do not agree, you may not use the App.
        </Text>
        <Text style={themedStyles.listItem}>
          By accessing or using the App, you represent that you are at least 13 years of age (or the minimum age required in your jurisdiction) and that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
        </Text>
      </View>

      <Text style={themedStyles.section}>2. DESCRIPTION OF SERVICE</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          Be_fit is a health and wellness mobile application that provides food logging, weight tracking, AI-powered coaching, and AI photo food recognition features. The App allows you to log meals, track weight, set nutrition goals, and receive AI-generated nutrition estimates and coaching responses.
        </Text>
      </View>

      <Text style={themedStyles.section}>3. USER ACCOUNTS</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          To use certain features of the App, you must create an account using Firebase Authentication (email/password or Google sign-in). You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
        </Text>
      </View>

      <Text style={themedStyles.section}>4. USER CONTENT AND DATA</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          You retain ownership of any data you submit to the App (such as food logs, weight entries, and chat messages). By submitting data, you grant Be_fit a license to use, store, and process that data solely to provide and improve the App's services.
        </Text>
        <Text style={themedStyles.listItem}>
          Data is stored in Firebase Firestore with offline persistence and may be processed through Cloud Functions for AI features.
        </Text>
      </View>

      <Text style={themedStyles.section}>5. AI FEATURES AND LIMITATIONS</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          The App uses AI features delivered exclusively through Cloud Functions (never called directly from the app): food photo analysis (Gemini Vision), nutrition estimation, and AI coach chat (GPT-4o-mini).
        </Text>
        <Text style={themedStyles.bodyBold}>
          AI-generated nutrition estimates and coaching responses are for informational purposes only and are not medical advice, diagnosis, or treatment. Accuracy is not guaranteed. Consult a qualified healthcare professional before making health or dietary decisions.
        </Text>
      </View>

      <Text style={themedStyles.section}>6. THIRD-PARTY SERVICES</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          The App may use data from third-party sources including OpenFoodFacts, USDA FoodData Central, and local food databases. Be_fit is not responsible for the accuracy, availability, or content of third-party data.
        </Text>
      </View>

      <Text style={themedStyles.section}>7. PROHIBITED USE</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          You agree not to use the App to: violate any law or regulation; upload harmful, abusive, or illegal content; attempt to reverse engineer or interfere with the App; or use the App for commercial purposes without authorization.
        </Text>
      </View>

      <Text style={themedStyles.section}>8. DISCLAIMER OF WARRANTIES</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          The App and all content are provided 'as is' and 'as available' without warranties of any kind, express or implied. Be_fit does not warrant that the App will be error-free, uninterrupted, secure, or free of viruses.
        </Text>
      </View>

      <Text style={themedStyles.section}>9. LIMITATION OF LIABILITY</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          To the fullest extent permitted by law, Be_fit and its affiliates are not liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising out of your use of or inability to use the App.
        </Text>
      </View>

      <Text style={themedStyles.section}>10. INDEMNIFICATION</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          You agree to indemnify and hold harmless Be_fit from any claims, damages, or expenses arising from your violation of these Terms or your use of the App.
        </Text>
      </View>

      <Text style={themedStyles.section}>11. TERMINATION</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          We may terminate or suspend your access to the App, without notice, for any reason, including violation of these Terms.
        </Text>
      </View>

      <Text style={themedStyles.section}>12. CHANGES TO THESE TERMS</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          We may update these Terms from time to time. We will post the updated version in the App with a revised 'Last updated' date. Your continued use constitutes acceptance of the revised Terms.
        </Text>
      </View>

      <Text style={themedStyles.section}>13. GOVERNING LAW</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          These Terms are governed by the laws of the jurisdiction in which Be_fit operates, without regard to conflict of law principles.
        </Text>
      </View>

      <Text style={themedStyles.section}>14. CONTACT US</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          If you have questions about these Terms, contact us through the App or at the support email listed in the App store listing.
        </Text>
      </View>
    </ScrollView>
  );
}
