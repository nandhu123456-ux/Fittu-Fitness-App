import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type Navigation = BottomTabNavigationProp<RootTabParamList, 'Notifications'>;

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
}

const NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'You hit your streak!', body: '5 days logged in a row — keep it up.', time: 'Today, 10:00 AM' },
  { id: '2', title: 'Time to log lunch', body: "Don't forget to log your midday meal.", time: 'Today, 1:00 PM' },
  { id: '3', title: 'Water reminder', body: "It's time to hydrate.", time: 'Yesterday, 3:00 PM' },
  { id: '4', title: 'Weekly progress', body: 'You are on track to meet your goal.', time: 'Oct 12' },
];

export default function NotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Navigation>();

  const themed = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    headerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '600', marginLeft: 10 },
    card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, marginHorizontal: 16, marginTop: 10, overflow: 'hidden' },
    row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
    rowLeft: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    rowBody: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    rowTime: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
    empty: { color: theme.colors.muted, fontSize: 15, paddingVertical: 40, textAlign: 'center' },
  }), [theme]);

  return (
    <SafeAreaView style={themed.screen}>
      <ScrollView style={themed.screen} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={themed.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={themed.headerTitle}>Notifications</Text>
        </View>
        {NOTIFICATIONS.length === 0 ? (
          <Text style={themed.empty}>No notifications yet.</Text>
        ) : (
          NOTIFICATIONS.map((item) => (
            <View key={item.id} style={themed.card}>
              <View style={themed.row}>
                <View style={themed.rowLeft}>
                  <Text style={themed.rowTitle}>{item.title}</Text>
                  <Text style={themed.rowBody}>{item.body}</Text>
                </View>
                <Text style={themed.rowTime}>{item.time}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
