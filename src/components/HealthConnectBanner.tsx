import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import type { HealthPermissionStatus } from '../services/healthConnect';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
const APKMIRROR_URL =
  'https://www.apkmirror.com/apk/google-inc/health-connect-by-android/';

interface Props {
  status: HealthPermissionStatus;
  loading: boolean;
  lastError: string | null;
  onRequest: () => void;
}

export function HealthConnectBanner({ status, loading, lastError, onRequest }: Props) {
  const theme = useTheme();

  if (status === 'granted') return null;

  const config = (() => {
    switch (status) {
      case 'unavailable':
        return {
          icon: 'download-outline' as const,
          title: 'Health Connect not installed',
          body: 'Tap to install from Play Store',
          action: () => Linking.openURL(PLAY_STORE_URL).catch(() => Linking.openURL(APKMIRROR_URL)),
          buttonText: 'Install',
          color: theme.colors.accent,
        };
      case 'denied':
        return {
          icon: 'lock-closed-outline' as const,
          title: 'Health Connect permission denied',
          body: 'Grant access to sync steps and calories',
          action: onRequest,
          buttonText: 'Grant',
          color: theme.colors.accent,
        };
      case 'error':
        return {
          icon: 'alert-circle-outline' as const,
          title: 'Health Connect error',
          body: lastError ?? 'Unknown error',
          action: onRequest,
          buttonText: 'Retry',
          color: theme.colors.danger,
        };
      case 'unknown':
      default:
        return {
          icon: 'sync-outline' as const,
          title: 'Checking Health Connect',
          body: 'Please wait…',
          action: onRequest,
          buttonText: 'Retry',
          color: theme.colors.muted,
        };
    }
  })();

  const styles = StyleSheet.create({
    wrap: {
      backgroundColor: theme.colors.surface,
      borderColor: config.color,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    icon: { marginRight: 4 },
    textWrap: { flex: 1 },
    title: { color: theme.colors.text, fontSize: 14, fontWeight: '700' as const },
    body: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    button: {
      backgroundColor: config.color,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    buttonText: { color: theme.colors.bg, fontSize: 13, fontWeight: '700' as const },
  });

  return (
    <View style={styles.wrap}>
      <Ionicons name={config.icon} size={22} color={config.color} style={styles.icon} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.body}>{config.body}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={config.color} />
      ) : (
        <Pressable style={styles.button} onPress={config.action}>
          <Text style={styles.buttonText}>{config.buttonText}</Text>
        </Pressable>
      )}
    </View>
  );
}
