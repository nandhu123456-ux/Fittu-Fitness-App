import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import CoachScreen from '../screens/CoachScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LogScreen from '../screens/LogScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

const EmptyScreen = () => null;

function iconFor(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabNavigator() {
  const theme = useTheme();
  const themedStyles = useMemo(() => StyleSheet.create({
    header: { backgroundColor: theme.colors.bg },
    headerTitle: { color: theme.colors.text },
    tabBar: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
  }), [theme]);
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: themedStyles.header,
        headerTitleStyle: themedStyles.headerTitle,
        tabBarStyle: themedStyles.tabBar,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: themedStyles.tabBarLabelStyle,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: iconFor('home-outline') }} />
      <Tab.Screen name="Log" component={LogScreen} options={{ tabBarLabel: 'Log', tabBarIcon: iconFor('add-circle-outline') }} />
      <Tab.Screen name="Coach" component={CoachScreen} options={{ tabBarLabel: 'Coach', tabBarIcon: iconFor('chatbubble-outline') }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progress', tabBarIcon: iconFor('stats-chart-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIcon: iconFor('person-outline') }} />

      {/* Hidden routes — still navigable programmatically, just not in the tab bar. */}
      <Tab.Screen name="Barcode" component={EmptyScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PhotoLog" component={EmptyScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="VoiceLog" component={EmptyScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="MenuScan" component={EmptyScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="AddCustomFood" component={EmptyScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Settings" component={EmptyScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="LogMenu" component={EmptyScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}