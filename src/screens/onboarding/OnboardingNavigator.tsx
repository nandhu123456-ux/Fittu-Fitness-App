import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import type { OnboardingStackParamList } from '../../types/navigation';
import ActivityScreen from './ActivityScreen';
import BodyStatsScreen from './BodyStatsScreen';
import GenderScreen from './GenderScreen';
import GoalScreen from './GoalScreen';
import SummaryScreen from './SummaryScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="Gender"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTitleStyle: { color: theme.colors.text },
        headerTintColor: theme.colors.accentAlt,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="Gender" component={GenderScreen} options={{ title: 'About you' }} />
      <Stack.Screen name="BodyStats" component={BodyStatsScreen} options={{ title: 'Body stats' }} />
      <Stack.Screen name="Activity" component={ActivityScreen} options={{ title: 'Activity level' }} />
      <Stack.Screen name="Goal" component={GoalScreen} options={{ title: 'Your goal' }} />
      <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: 'Summary' }} />
    </Stack.Navigator>
  );
}
