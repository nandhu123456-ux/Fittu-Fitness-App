import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { RecordingPresets, getRecordingPermissionsAsync, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { PortionModal } from '../components/PortionModal';
import { addFoodLog } from '../services/foodLogService';
import type { FoodResult } from '../services/foodSearch';
import { analyzeFoodText, parseVoice, type VoiceParseResult } from '../services/voiceLog';
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
  useAudioRecorderState(recorder);

  const [granted, setGranted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [food, setFood] = useState<FoodResult | null>(null);
  const [pendingFood, setPendingFood] = useState<FoodResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [textFallback, setTextFallback] = useState(false);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    void getRecordingPermissionsAsync().then((res) => setGranted(res.granted));
  }, []);

  const themedStyles = useMemo(() => StyleSheet.create({
    screen: { backgroundColor: theme.colors.bg, flex: 1 },
    scroll: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },
    title: { color: theme.colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
    hint: { color: theme.colors.muted, fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 10 },
    mic: { alignItems: 'center', backgroundColor: recording ? theme.colors.danger : theme.colors.accent, borderRadius: 64, height: 128, justifyContent: 'center', marginTop: 40, width: 128 },
    micOff: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 64, height: 128, justifyContent: 'center', marginTop: 40, width: 128 },
    status: { color: theme.colors.text, fontSize: 15, fontWeight: '600', marginTop: 24, textAlign: 'center' },
    error: { color: theme.colors.danger, fontSize: 14, marginTop: 16, textAlign: 'center' },
    close: { alignItems: 'center', backgroundColor: theme.colors.surfaceHi, borderRadius: 12, marginTop: 32, paddingHorizontal: 24, paddingVertical: 12 },
    closeText: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
    transcriptCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, marginTop: 24, padding: 16, width: '100%' },
    transcriptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    transcriptLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
    transcriptInput: { color: theme.colors.text, fontSize: 15, lineHeight: 22, padding: 8 },
    transcriptText: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
    transcriptActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    transcriptBtn: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, flex: 1, padding: 12 },
    transcriptBtnAccent: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    transcriptBtnText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
    transcriptBtnTextAccent: { color: theme.colors.bg },
    fallbackCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, marginTop: 16, padding: 16, width: '100%' },
    fallbackInput: { color: theme.colors.text, fontSize: 15, lineHeight: 22, padding: 8 },
    fallbackGo: { alignItems: 'center', backgroundColor: theme.colors.accent, borderRadius: 12, marginTop: 12, padding: 14 },
    fallbackGoText: { color: theme.colors.bg, fontWeight: '700' },
    reviewCard: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.accent, borderRadius: 16, borderWidth: 1, marginTop: 16, padding: 16, width: '100%' },
    reviewTitle: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: 4, textTransform: 'uppercase' },
    reviewName: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 6 },
    reviewMeta: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
    reviewActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  }), [theme, recording]);

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

  const stopRecording = async (): Promise<void> => {
    setRecording(false);
    setTranscribing(true);
    setError(null);
    setParseError(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setError('No recording found. Try again.');
        setTranscribing(false);
        return;
      }
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      if (base64.length < 5000) {
        setError('Recording too short — please speak for at least 3 seconds');
        setTranscribing(false);
        return;
      }
      const result: VoiceParseResult = await parseVoice(base64, mimeFromUri(uri));
      const text = result.transcript.trim();
      setTranscript(text);
      setEditedText(text);
      if (!text) {
        setParseError(true);
        setError("Couldn't understand that. Try speaking a food and quantity.");
      }
    } catch {
      setError('Could not process the recording.');
    } finally {
      setTranscribing(false);
    }
  };

  const analyzeTranscript = async (): Promise<void> => {
    const text = editingTranscript ? editedText.trim() : transcript.trim();
    if (!text || analyzing || !user) return;
    setAnalyzing(true);
    setError(null);
    setParseError(false);
    try {
      const result: FoodResult | null = await analyzeFoodText(text);
      if (result) {
        setPendingFood(result);
      } else {
        setParseError(true);
        setError("Couldn't extract food from that. Edit the transcript and try again.");
      }
    } catch {
      setError('Could not process that. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmPending = (): void => { if (pendingFood) setFood(pendingFood); setPendingFood(null); };
  const rejectPending = (): void => setPendingFood(null);
  const recordAgain = (): void => { setTranscript(''); setEditedText(''); setPendingFood(null); setParseError(false); setError(null); setEditingTranscript(false); };
  const useTextFallback = (): void => { setTextFallback(true); setParseError(false); setError(null); };

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
      <SafeAreaView style={[themedStyles.screen, { alignItems: 'center', justifyContent: 'center', padding: 28 }]}>
        <Ionicons color={theme.colors.accent} name="mic" size={56} />
        <Text style={[themedStyles.title, { marginTop: 18 }]}>Microphone access needed</Text>
        <Text style={themedStyles.hint}>Allow the microphone to log food by speaking.</Text>
        <Pressable onPress={() => void ensurePermission()} style={themedStyles.close}>
          <Text style={themedStyles.closeText}>Grant permission</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={themedStyles.close}>
          <Text style={themedStyles.closeText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themedStyles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={themedStyles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Text style={themedStyles.title}>Speak your food</Text>
          <Text style={themedStyles.hint}>Tap the mic, say something like "two rotis and dal", then tap again.</Text>

          {transcribing ? (
            <>
              <View style={themedStyles.micOff}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
              <Text style={themedStyles.status}>Transcribing…</Text>
            </>
          ) : analyzing ? (
            <>
              <View style={themedStyles.micOff}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
              <Text style={themedStyles.status}>Analysing meal…</Text>
            </>
          ) : pendingFood ? (
            <>
              <View style={themedStyles.micOff}><Ionicons color={theme.colors.accent} name="restaurant" size={56} /></View>
              <Text style={themedStyles.status}>Meal ready to review</Text>
            </>
          ) : (
            <Pressable onPress={() => (recording ? void stopRecording() : void startRecording())} style={themedStyles.mic}>
              <Ionicons color={theme.colors.bg} name={recording ? 'stop' : 'mic'} size={52} />
            </Pressable>
          )}
          {recording ? <Text style={themedStyles.status}>Recording… tap to stop</Text> : null}

          {transcript ? (
            <View style={themedStyles.transcriptCard}>
              <View style={themedStyles.transcriptHead}>
                <Text style={themedStyles.transcriptLabel}>Your meal</Text>
                <Pressable onPress={() => setEditingTranscript((v) => !v)} hitSlop={8}>
                  <Ionicons color={theme.colors.accent} name={editingTranscript ? 'checkmark' : 'pencil'} size={18} />
                </Pressable>
              </View>
              {editingTranscript ? (
                <TextInput multiline onChangeText={setEditedText} placeholder="Edit transcript" placeholderTextColor={theme.colors.muted} style={themedStyles.transcriptInput} value={editedText} />
              ) : (
                <Text style={themedStyles.transcriptText}>"{editedText || transcript}"</Text>
              )}
              {parseError && !pendingFood ? (
                <View style={themedStyles.transcriptActions}>
                  <Pressable onPress={recordAgain} style={themedStyles.transcriptBtn}><Text style={themedStyles.transcriptBtnText}>Record again</Text></Pressable>
                  <Pressable onPress={useTextFallback} style={[themedStyles.transcriptBtn, themedStyles.transcriptBtnAccent]}><Text style={[themedStyles.transcriptBtnText, themedStyles.transcriptBtnTextAccent]}>Type it instead</Text></Pressable>
                </View>
              ) : !pendingFood ? (
                <Pressable disabled={!editedText.trim() || analyzing} onPress={() => void analyzeTranscript()} style={[themedStyles.transcriptBtn, themedStyles.transcriptBtnAccent]}>
                  <Text style={[themedStyles.transcriptBtnText, themedStyles.transcriptBtnTextAccent]}>Analyse meal</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {textFallback ? (
            <View style={themedStyles.fallbackCard}>
              <TextInput multiline onChangeText={setEditedText} placeholder="Type what you want to log, e.g. two rotis and a bowl of dal" placeholderTextColor={theme.colors.muted} style={themedStyles.fallbackInput} value={editedText} />
              <Pressable disabled={!editedText.trim() || analyzing} onPress={() => void analyzeTranscript()} style={themedStyles.fallbackGo}><Text style={themedStyles.fallbackGoText}>Analyse meal</Text></Pressable>
            </View>
          ) : null}

          {pendingFood ? (
            <View style={themedStyles.reviewCard}>
              <Ionicons color={theme.colors.accent} name="restaurant-outline" size={20} />
              <Text style={themedStyles.reviewTitle}>Review before saving</Text>
              <Text style={themedStyles.reviewName}>{pendingFood.name}</Text>
              <Text style={themedStyles.reviewMeta}>{pendingFood.serving} · {pendingFood.cal} kcal</Text>
              <View style={themedStyles.reviewActions}>
                <Pressable onPress={rejectPending} style={themedStyles.transcriptBtn}><Text style={themedStyles.transcriptBtnText}>Back to edit</Text></Pressable>
                <Pressable onPress={confirmPending} style={[themedStyles.transcriptBtn, themedStyles.transcriptBtnAccent]}><Text style={[themedStyles.transcriptBtnText, themedStyles.transcriptBtnTextAccent]}>Confirm</Text></Pressable>
              </View>
            </View>
          ) : null}

          {error ? <Text style={themedStyles.error}>{error}</Text> : null}

          <Pressable onPress={() => navigation.goBack()} style={themedStyles.close}><Text style={themedStyles.closeText}>Cancel</Text></Pressable>
        </ScrollView>
        
        <PortionModal food={food} onClose={() => { setFood(null); setPendingFood(null); setTranscript(''); setEditedText(''); setParseError(false); setTextFallback(false); }} onConfirm={(servings) => void confirm(servings)} visible={food !== null} />
        
        {saving ? (
          <View style={[StyleSheet.absoluteFill, themedStyles.screen, { opacity: 0.6, alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}