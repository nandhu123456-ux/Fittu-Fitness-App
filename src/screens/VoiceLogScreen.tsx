import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingPresets, getRecordingPermissionsAsync, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { PortionModal } from '../components/PortionModal';
import { addFoodLog } from '../services/foodLogService';
import type { FoodResult } from '../services/foodSearch';
import { parseVoice } from '../services/voiceLog';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import type { RootTabParamList } from '../types/navigation';

type VoiceRoute = RouteProp<RootTabParamList, 'VoiceLog'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'VoiceLog'>;

function mimeFromUri(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'm4a' || ext === 'mp4') return 'audio/mp4';
  if (ext === 'webm') return 'audio/webm';
  if (ext === 'wav') return 'audio/wav';
  return 'audio/mp4';
}

export default function VoiceLogScreen() {
  const theme = useTheme();
  const route = useRoute<VoiceRoute>();
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const mealType = route.params?.mealType ?? 'snack';

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });

  const [granted, setGranted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [food, setFood] = useState<FoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getRecordingPermissionsAsync().then((res) => setGranted(res.granted));
  }, []);

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { alignItems: 'center', backgroundColor: theme.colors.bg, flex: 1, justifyContent: 'center', padding: 28 },
    title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
    hint: { color: theme.colors.muted, fontSize: 14, marginTop: 10, textAlign: 'center' },
    mic: { alignItems: 'center', backgroundColor: recording ? theme.colors.danger : theme.colors.accent, borderRadius: 64, height: 128, justifyContent: 'center', marginTop: 40, width: 128 },
    micOff: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 64, height: 128, justifyContent: 'center', marginTop: 40, width: 128 },
    status: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginTop: 24, textAlign: 'center' },
    error: { color: theme.colors.danger, fontSize: 14, marginTop: 16, textAlign: 'center' },
    close: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 12, marginTop: 32, paddingHorizontal: 24, paddingVertical: 12 },
    closeText: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  }), [theme]);


  const ensurePermission = async (): Promise<boolean> => {
    const existing = await getRecordingPermissionsAsync();
    if (existing.granted) { setGranted(true); return true; }
    const requested = await requestRecordingPermissionsAsync();
    setGranted(requested.granted);
    return requested.granted;
  };

  const startRecording = async (): Promise<void> => {
    setError(null);
    if (!granted) {
      const ok = await ensurePermission();
      if (!ok) {
        setError('Microphone access is needed for voice logging.');
        return;
      }
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch {
      setError('Could not start recording.');
    }
  };

  const stopAndParse = async (): Promise<void> => {
    setRecording(false);
    setParsing(true);
    setError(null);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setError('No recording found. Try again.');
        setParsing(false);
        return;
      }
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const result = await parseVoice(base64, mimeFromUri(uri));
      if (!result) {
        setError("Couldn't understand that. Try speaking a food and quantity.");
        setParsing(false);
        return;
      }
      setFood(result);
    } catch {
      setError('Could not process the recording.');
    } finally {
      setParsing(false);
    }
  };

  const confirm = async (servings: number): Promise<void> => {
    if (!user || !food) return;
    try {
      setSaving(true);
      await addFoodLog(user.uid, { mealType, food, servings });
      setFood(null);
      navigation.goBack();
    } catch {
      setError('Could not save this entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!granted) {
    return (
      <View style={themedStyles.screen}>
        <Ionicons color={theme.colors.accent} name="mic" size={56} />
        <Text style={[themedStyles.title, { marginTop: 18 }]}>Microphone access needed</Text>
        <Text style={themedStyles.hint}>Allow the microphone to log food by speaking.</Text>
        <Pressable onPress={() => void ensurePermission()} style={themedStyles.close}>
          <Text style={themedStyles.closeText}>Grant permission</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={themedStyles.close}>
          <Text style={themedStyles.closeText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={themedStyles.screen}>
      <Text style={themedStyles.title}>Speak your food</Text>
      <Text style={themedStyles.hint}>Tap the mic, say something like "two rotis and dal", then tap again.</Text>
      {parsing ? (
        <>
          <View style={themedStyles.micOff}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
          <Text style={themedStyles.status}>Understanding your food…</Text>
        </>
      ) : (
        <Pressable onPress={() => (recording ? void stopAndParse() : void startRecording())} style={themedStyles.mic}>
          <Ionicons color={theme.colors.bg} name={recording ? 'stop' : 'mic'} size={52} />
        </Pressable>
      )}
      {recording ? <Text style={themedStyles.status}>Recording… tap to stop</Text> : null}
      {error ? <Text style={themedStyles.error}>{error}</Text> : null}
      <Pressable onPress={() => navigation.goBack()} style={themedStyles.close}>
        <Text style={themedStyles.closeText}>Cancel</Text>
      </Pressable>
      <PortionModal
        food={food}
        onClose={() => setFood(null)}
        onConfirm={(servings) => void confirm(servings)}
        visible={food !== null}
      />
      {saving ? (
        <View style={[StyleSheet.absoluteFill, themedStyles.screen, { opacity: 0.6 }]}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : null}
    </View>
  );
}
