import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CenterFAB } from '../components/CenterFAB';
import { LogMenuModal } from '../components/LogMenuModal';

import BarcodeScreen from '../screens/BarcodeScreen';
import CoachScreen from '../screens/CoachScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LogScreen from '../screens/LogScreen';
import PhotoLogScreen from '../screens/PhotoLogScreen';
import AddCustomFoodScreen from '../screens/AddCustomFoodScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VoiceLogScreen from '../screens/VoiceLogScreen';
import MenuScanScreen from '../screens/MenuScanScreen';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

const EmptyScreen = () => null;

export default function TabNavigator() {
  const theme = useTheme();
  const [logMenuVisible, setLogMenuVisible] = useState(false);
  const themedStyles = useMemo(() => StyleSheet.create({
    header: { backgroundColor: theme.colors.bg },
    headerTitle: { color: theme.colors.text },
    tabBar: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
  }), [theme]);
  return (
    <>
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: themedStyles.header,
        headerTitleStyle: themedStyles.headerTitle,
        tabBarStyle: themedStyles.tabBar,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Barcode" component={BarcodeScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PhotoLog" component={PhotoLogScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="VoiceLog" component={VoiceLogScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="MenuScan" component={MenuScanScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen
        name="LogMenu"
        component={EmptyScreen}
        options={{
          tabBarButton: (props) => (
            <CenterFAB {...props} onPress={() => setLogMenuVisible(true)} />
          ),
        }}
      />
      <Tab.Screen name="AddCustomFood" component={AddCustomFoodScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
    </Tab.Navigator>
    <LogMenuModal visible={logMenuVisible} onClose={() => setLogMenuVisible(false)} />
    </>
  );
}
