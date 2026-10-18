import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import CoachScreen from '../screens/CoachScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LogScreen from '../screens/LogScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RemindersScreen from '../screens/RemindersScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddCustomFoodScreen from '../screens/AddCustomFoodScreen';
import BarcodeScreen from '../screens/BarcodeScreen';
import PhotoLogScreen from '../screens/PhotoLogScreen';
import VoiceLogScreen from '../screens/VoiceLogScreen';
import MenuScanScreen from '../screens/MenuScanScreen';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

const EmptyScreen = () => null;

function iconFor(name: keyof typeof Ionicons.glyphMap) {
  return ({ color }: { color: string }) => (
    <Ionicons name={name} color={color} size={26} />
  );
}

export default function TabNavigator() {
  const theme = useTheme();
  const themedStyles = useMemo(() => StyleSheet.create({
    header: { backgroundColor: theme.colors.bg },
    headerTitle: { color: theme.colors.text },
    tabBar: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, height: 84, paddingBottom: 12, paddingTop: 10, width: '100%', flexDirection: 'row' },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 4, includeFontPadding: false },
  }), [theme]);
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: themedStyles.header,
        headerTitleStyle: themedStyles.headerTitle,
        tabBarStyle: themedStyles.tabBar,
        tabBarItemStyle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        tabBarIconStyle: { marginBottom: 0 },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: themedStyles.tabBarLabelStyle,
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: iconFor('home-outline') }} />
      <Tab.Screen name="Log" component={LogScreen} options={{ tabBarLabel: 'Log', tabBarIcon: iconFor('add-circle-outline') }} />
      <Tab.Screen name="Coach" component={CoachScreen} options={{ tabBarLabel: 'Chat', tabBarIcon: iconFor('chatbubble-outline') }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Stats', tabBarIcon: iconFor('stats-chart-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Me', tabBarIcon: iconFor('person-outline') }} />

      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarButton: () => null, headerShown: false, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="Preferences" component={PreferencesScreen} options={{ tabBarButton: () => null, headerShown: false, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="Reminders" component={RemindersScreen} options={{ tabBarButton: () => null, headerShown: false, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ tabBarButton: () => null, headerShown: false, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="AddCustomFood" component={AddCustomFoodScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="Barcode" component={BarcodeScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="PhotoLog" component={PhotoLogScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="VoiceLog" component={VoiceLogScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
      <Tab.Screen name="MenuScan" component={MenuScanScreen} options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none', width: 0, flex: 0 } }} />
    </Tab.Navigator>
  );
}