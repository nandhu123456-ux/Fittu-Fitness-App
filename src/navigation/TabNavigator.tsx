import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';

import { colors } from '../constants/colors';
import BarcodeScreen from '../screens/BarcodeScreen';
import CoachScreen from '../screens/CoachScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LogScreen from '../screens/LogScreen';
import PhotoLogScreen from '../screens/PhotoLogScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Barcode" component={BarcodeScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PhotoLog" component={PhotoLogScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.bg,
  },
  headerTitle: {
    color: colors.text,
  },
  tabBar: {
    backgroundColor: colors.bg,
  },
});
