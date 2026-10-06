import Ionicons from '@expo/vector-icons/Ionicons';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { UploadFile } from '@/api/types';
import { Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, fonts, radius, spacing } from '@/theme';

const MAX_SECONDS = 60;

/** Records a short voice note for mothers who prefer speaking (FR-VOICE-01). */
export function VoiceRecorder({ value, onChange }: { value: UploadFile | null; onChange: (f: UploadFile | null) => void }) {
  const { t } = useI18n();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const state = useAudioRecorderState(recorder, 250);
  const seconds = Math.floor((state.durationMillis ?? 0) / 1000);

  const stop = async () => {
    await recorder.stop();
    if (recorder.uri) onChange({ uri: recorder.uri, name: 'voice-note.m4a', type: 'audio/mp4' });
  };

  useEffect(() => {
    if (state.isRecording && seconds >= MAX_SECONDS) void stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, state.isRecording]);

  const start = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    onChange(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  if (value && !state.isRecording) {
    return (
      <View style={styles.done}>
        <Ionicons name="mic" size={22} color={colors.green} />
        <Text style={styles.doneText}>{t('check.recorded')}</Text>
        <Button title={t('check.removeVoice')} variant="ghost" onPress={() => onChange(null)} />
      </View>
    );
  }
  return state.isRecording ? (
    <Button title={`${t('check.stop')} · ${t('check.recording', { s: seconds })}`} icon="stop-circle" variant="danger" onPress={stop} />
  ) : (
    <Button title={t('check.record')} icon="mic" variant="outline" onPress={start} />
  );
}

const styles = StyleSheet.create({
  done: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.greenSoft, borderRadius: radius.md, paddingLeft: spacing.md },
  doneText: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.green },
});
