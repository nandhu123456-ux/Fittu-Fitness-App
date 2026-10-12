import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../../constants/colors';
import type { OnboardingStackParamList } from '../../types/navigation';
import ActivityScreen from './ActivityScreen';
import BodyStatsScreen from './BodyStatsScreen';
import GenderScreen from './GenderScreen';
import GoalScreen from './GoalScreen';
import SummaryScreen from './SummaryScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Gender"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.bg },
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
