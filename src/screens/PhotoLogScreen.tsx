import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { PortionModal } from '../components/PortionModal';
import { colors } from '../constants/colors';
import type { MealType } from '../services/foodLogs';
import { addFoodLog } from '../services/foodLogService';
import type { FoodResult } from '../services/foodSearch';
import { analyzeMealPhoto } from '../services/mealAnalysis';
import { useAuthStore } from '../store/authStore';
import type { RootTabParamList } from '../types/navigation';

type PhotoLogRoute = RouteProp<RootTabParamList, 'PhotoLog'>;
type Navigation = BottomTabNavigationProp<RootTabParamList, 'PhotoLog'>;

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  quality: 0.4,
  base64: true,
  allowsEditing: true,
  aspect: [4, 3],
  exif: false,
};

export default function PhotoLogScreen() {
  const route = useRoute<PhotoLogRoute>();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuthStore();
  const mealType: MealType = route.params?.mealType ?? 'breakfast';
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [food, setFood] = useState<FoodResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');

  const analyze = async (asset: ImagePicker.ImagePickerAsset): Promise<void> => {
    if (!asset.base64) {
      Alert.alert('Could not identify food.', 'Try a clearer photo.');
      setStatus('idle');
      return;
    }
    setImageUri(asset.uri);
    setFood(null);
    setStatus('analyzing');
    try {
      const result = await analyzeMealPhoto(asset.base64, asset.mimeType ?? 'image/jpeg');
      if (!result) {
        Alert.alert('Could not identify food.', 'Try a clearer photo.');
        setStatus('idle');
        return;
      }
      setFood(result);
      setStatus('done');
      setModalVisible(true);
    } catch (e) {
      const message = e instanceof Error && e.message.startsWith('Photo too large')
        ? e.message
        : 'Try a clearer photo.';
      Alert.alert('Could not identify food.', message);
      setStatus('idle');
    }
  };

  const pick = async (launch: (options: ImagePicker.ImagePickerOptions) => Promise<ImagePicker.ImagePickerResult>): Promise<void> => {
    setStatus('uploading');
    try {
      const result = await launch(pickerOptions);
      if (result.canceled || !result.assets?.[0]) { setStatus('idle'); return; }
      await analyze(result.assets[0]);
    } catch {
      Alert.alert('Could not identify food.', 'Try a clearer photo.');
      setStatus('idle');
    }
  };

  const confirm = async (servings: number): Promise<void> => {
    if (!user || !food) return;
    try {
      await addFoodLog(user.uid, { mealType, food, servings });
      setModalVisible(false);
      navigation.goBack();
    } catch {
      Alert.alert('Could not save food.', 'Please try again.');
    }
  };

  const cancel = (): void => {
    setModalVisible(false);
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Snap your meal</Text>
      <Text style={styles.subtitle}>Take a photo and we will identify it.</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => void pick(ImagePicker.launchCameraAsync)} style={styles.button}>
          <Ionicons color={colors.bg} name="camera" size={20} />
          <Text style={styles.buttonText}>Take Photo</Text>
        </Pressable>
        <Pressable onPress={() => void pick(ImagePicker.launchImageLibraryAsync)} style={styles.secondary}>
          <Ionicons color={colors.text} name="images" size={20} />
          <Text style={styles.secondaryText}>Choose from Library</Text>
        </Pressable>
      </View>
      {imageUri !== null && (
        <Image resizeMode="cover" source={{ uri: imageUri }} style={styles.preview} />
      )}
      {(status === 'uploading' || status === 'analyzing') && (
        <View style={styles.state}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.stateText}>{status === 'uploading' ? 'Preparing photo…' : 'Identifying your meal…'}</Text>
        </View>
      )}
      {food !== null && status === 'done' && (
        <View style={styles.result}>
          <Text style={styles.name}>{food.name}</Text>
          <Text style={styles.serving}>
            {food.serving} · {food.cal} kcal
          </Text>
          <Text style={styles.macros}>
            P {food.protein}g · C {food.carbs}g · F {food.fat}g
          </Text>
        </View>
      )}
      <PortionModal food={food} onClose={cancel} onConfirm={(servings) => void confirm(servings)} visible={modalVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, flex: 1, padding: 20 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 14, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 15 },
  buttonText: { color: colors.bg, fontWeight: '700' },
  secondary: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 15 },
  secondaryText: { color: colors.text, fontWeight: '600' },
  preview: { borderRadius: 18, height: 240, marginTop: 20, width: '100%' },
  state: { alignItems: 'center', gap: 10, marginTop: 24 },
  stateText: { color: colors.muted, fontSize: 14 },
  result: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 20, padding: 16 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  serving: { color: colors.muted, fontSize: 13, marginTop: 4 },
  macros: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
