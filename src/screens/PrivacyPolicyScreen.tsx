import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen() {
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
        <Text style={themedStyles.headerTitle}>Privacy Policy</Text>
      </View>

      <Text style={themedStyles.updated}>Last updated: October 18, 2026</Text>

      <Text style={themedStyles.section}>1. INFORMATION WE COLLECT</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.bodyBold}>
          Information you provide directly
        </Text>
        <Text style={themedStyles.listItem}>
          • Account information: email address and display name when you sign in with Firebase Authentication (email/password or Google sign-in).
        </Text>
        <Text style={themedStyles.listItem}>
          • Health and wellness data: food logs, meal entries, weight entries, saved meals, custom foods, step counts, sleep data, water intake, and mood entries.
        </Text>
        <Text style={themedStyles.listItem}>
          • Chat messages: messages you send to the AI coach, including any text or images you upload for food photo analysis.
        </Text>
        <Text style={themedStyles.bodyBold}>
          Information collected automatically
        </Text>
        <Text style={themedStyles.listItem}>
          • Device and usage information: device type, operating system, app version, crash logs, and anonymized usage analytics to improve the App.
        </Text>
        <Text style={themedStyles.listItem}>
          • Images: photos you upload for AI food recognition are processed through Cloud Functions and are not stored longer than necessary to generate the analysis.
        </Text>
      </View>

      <Text style={themedStyles.section}>2. HOW WE USE YOUR INFORMATION</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          We use your information to: provide and operate the App's features (food logging, weight tracking, AI coaching); personalize your experience (goals, targets, nutrition estimates); communicate with you about your account or the App; and improve, troubleshoot, and secure the App.
        </Text>
      </View>

      <Text style={themedStyles.section}>3. DATA STORAGE AND SECURITY</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          Your data is stored in Firebase Firestore with offline persistence, Firebase Authentication, and Firebase Cloud Storage. We use industry-standard security measures to protect your data, but no method of transmission or storage is 100% secure.
        </Text>
        <Text style={themedStyles.bodyBold}>
          AI features (food analysis, nutrition estimation, coach chat) are processed exclusively through Cloud Functions. AI inputs and outputs are not used to train public models by Be_fit.
        </Text>
      </View>

      <Text style={themedStyles.section}>4. SHARING AND DISCLOSURE</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          We do not sell your personal data. We may share data only: with Firebase/Google infrastructure providers as necessary to operate the App; as required by law, legal process, or to protect safety; or with your explicit consent.
        </Text>
      </View>

      <Text style={themedStyles.section}>5. THIRD-PARTY SERVICES</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          The App may integrate with third-party data sources such as OpenFoodFacts and USDA FoodData Central for food information. These services have their own privacy policies, and Be_fit is not responsible for their practices.
        </Text>
        <Text style={themedStyles.bodyBold}>
          AI features use third-party AI providers (such as Gemini Vision and GPT-4o-mini) via Cloud Functions. Inputs sent to these providers are subject to those providers' terms.
        </Text>
      </View>

      <Text style={themedStyles.section}>6. YOUR RIGHTS</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          Depending on your location, you may have the right to: access, correct, or delete your personal data; withdraw consent where processing is based on consent; export a copy of your data; or object to certain processing.
        </Text>
        <Text style={themedStyles.listItem}>
          To exercise these rights, contact us through the App.
        </Text>
      </View>

      <Text style={themedStyles.section}>7. CHILDREN</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          The App is not intended for children under 13. We do not knowingly collect personal data from children under 13. If you believe a child under 13 has provided us with personal data, contact us so we can delete it.
        </Text>
      </View>

      <Text style={themedStyles.section}>8. INTERNATIONAL TRANSFERS</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          Your data may be stored and processed in the United States or other countries where Firebase and our service providers operate. By using the App, you consent to such transfers.
        </Text>
      </View>

      <Text style={themedStyles.section}>9. RETENTION</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          We retain your data as long as your account is active or as needed to provide services. You may delete your account and associated data through the App or by contacting us.
        </Text>
      </View>

      <Text style={themedStyles.section}>10. CHANGES TO THIS POLICY</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          We may update this Privacy Policy from time to time. The updated version will be posted in the App with a revised 'Last updated' date. Your continued use constitutes acceptance.
        </Text>
      </View>

      <Text style={themedStyles.section}>11. CONTACT US</Text>
      <View style={themedStyles.card}>
        <Text style={themedStyles.body}>
          If you have questions about this Privacy Policy or your data, contact us through the App or at the support email listed in the App store listing.
        </Text>
      </View>
    </ScrollView>
  );
}
