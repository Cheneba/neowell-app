import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { UploadFile } from '@/api/types';

/** Compressed photo from the camera or gallery (NFR-PERF-02: ≤ ~1280 px, quality 0.6). */
export async function pickImage(source: 'camera' | 'gallery'): Promise<UploadFile | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  const type = a.mimeType ?? 'image/jpeg';
  return { uri: a.uri, name: a.fileName ?? `photo.${type === 'image/png' ? 'png' : 'jpg'}`, type };
}

export async function pickPdf(): Promise<UploadFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.name, type: a.mimeType ?? 'application/pdf' };
}
