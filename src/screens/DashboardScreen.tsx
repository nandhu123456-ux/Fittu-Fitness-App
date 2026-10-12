import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    color: colors.text,
  },
});
