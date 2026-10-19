import { useMemo } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { signOut } from '../services/auth';
import {
  isHealthConnectAvailable,
  requestHealthPermissions,
} from '../services/healthConnect';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Profile'>;

interface ProfileRow {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();
  const { user, profile } = useAuthStore();

  const displayName = profile?.displayName ?? user?.displayName ?? 'there';
  const email = user?.email ?? profile?.email ?? '';

  const rows = useMemo<ProfileRow[]>(() => [
    { key: 'goals', icon: 'flag-outline', title: 'Goals', subtitle: 'Set your targets', onPress: () => navigation.navigate('Goals') },
    { key: 'mealPlan', icon: 'restaurant-outline', title: 'Meal Plan', subtitle: 'View your plan', onPress: () => navigation.navigate('Coach') },
    { key: 'reminders', icon: 'notifications-outline', title: 'Reminders', subtitle: 'Stay on track', onPress: () => navigation.navigate('Reminders') },
    { key: 'preferences', icon: 'options-outline', title: 'Preferences', subtitle: 'Units, theme, etc.', onPress: () => navigation.navigate('Preferences') },
    {
      key: 'health',
      icon: 'heart-outline',
      title: 'Health Connect',
      subtitle: 'Sync your health data',
      onPress: async () => {
        const available = await isHealthConnectAvailable();
        if (!available) {
          Alert.alert(
            'Health Connect not available',
            'Install Health Connect from the Play Store to sync your health data.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        const status = await requestHealthPermissions();
        
        if (status === 'granted') {
          Alert.alert('Connected', 'Health Connect is syncing your steps, calories burned, and sleep.');
        } else if (status === 'denied') {
          Alert.alert(
            'Permission needed',
            'Open the Health Connect app and enable the permissions manually.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Could not initialise Health Connect.');
        }
      },
    },
    { key: 'help', icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance', onPress: () => Linking.openURL('mailto:be_fit.support@gmail.com?subject=Be_fit%20Support') },
  ], [navigation]);

  const confirmSignOut = (): void => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { void signOut(); } },
    ]);
  };

  const themedStyles = useMemo(() => StyleSheet.create({
    hero: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 20, padding: 24 },
    
    // CHANGED: Background changed to black/theme bg, added a subtle border to frame the image
    avatar: { 
      alignItems: 'center', 
      backgroundColor: theme.colors.bg, 
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 42, 
      height: 84, 
      justifyContent: 'center', 
      overflow: 'hidden', 
      width: 84 
    },
    avatarImage: { height: '100%', resizeMode: 'cover', width: '100%' },
    avatarLetter: { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
    
    name: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
    email: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    premiumPill: { alignSelf: 'flex-start', backgroundColor: theme.colors.accentGlow, borderRadius: 999, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4 },
    premiumText: { color: theme.colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    listCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    row: { alignItems: 'center', flexDirection: 'row', gap: 18, height: 84, paddingHorizontal: 24 },
    rowDivider: { borderTopColor: theme.colors.border, borderTopWidth: 1 },
    rowText: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '600' },
    rowSubtitle: { color: theme.colors.muted, fontSize: 14, marginTop: 3 },
    coachCard: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 20, flexDirection: 'row', gap: 14, marginTop: 12, padding: 20 },
    coachText: { flex: 1 },
    coachTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
    coachSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 1 },
    signOut: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 10, marginTop: 12, padding: 16 },
    signOutText: { color: theme.colors.danger, fontSize: 15, fontWeight: '600' },
  }), [theme]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={styles.content}>
      <View style={themedStyles.hero}>
        <View style={themedStyles.avatar}>
          <Image source={require('../../icons/icon.png')} style={themedStyles.avatarImage} />
        </View>
        <View style={styles.identity}>
          <Text numberOfLines={1} style={themedStyles.name}>{displayName}</Text>
          <Text numberOfLines={1} style={themedStyles.email}>{email || 'No email on file'}</Text>
          <View style={themedStyles.premiumPill}>
            <Text style={themedStyles.premiumText}>Premium</Text>
          </View>
        </View>
      </View>

      <View style={themedStyles.listCard}>
        {rows.map((row, index) => (
          <Pressable key={row.key} onPress={row.onPress} style={[themedStyles.row, index > 0 && themedStyles.rowDivider]}>
            <Ionicons color={theme.colors.accent} name={row.icon} size={24} />
            <View style={themedStyles.rowText}>
              <Text style={themedStyles.rowTitle}>{row.title}</Text>
              <Text style={themedStyles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            <Ionicons color={theme.colors.muted} name="chevron-forward" size={20} />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => navigation.navigate('Coach')} style={themedStyles.coachCard}>
        <Ionicons color={theme.colors.accent} name="sparkles" size={24} />
        <View style={themedStyles.coachText}>
          <Text style={themedStyles.coachTitle}>AI Coach</Text>
          <Text style={themedStyles.coachSubtitle}>Chat with your nutrition coach</Text>
        </View>
        <Ionicons color={theme.colors.muted} name="chevron-forward" size={18} />
      </Pressable>

      <Pressable onPress={confirmSignOut} style={themedStyles.signOut}>
        <Ionicons color={theme.colors.danger} name="log-out-outline" size={20} />
        <Text style={themedStyles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  identity: { flex: 1 },
});