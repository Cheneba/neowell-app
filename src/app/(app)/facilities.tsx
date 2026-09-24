import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Facility } from '@/api/types';
import { Body, Button, Card, ErrorText, Loading, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { formatPhone } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, radius, spacing } from '@/theme';

type Result = { kind: 'denied' } | { kind: 'ready'; facilities: Facility[] };

export default function Facilities() {
  const { t } = useI18n();
  const { api } = useSession();
  const { data, error, loading, reload } = useFocusData<Result>(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { kind: 'denied' };
    const pos =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const facilities = await api.nearbyFacilities(pos.coords.latitude, pos.coords.longitude, 100);
    return { kind: 'ready', facilities };
  });

  if (loading) return <Loading label={t('facilities.locating')} />;

  return (
    <Screen>
      {error ? (
        <>
          <ErrorText>{errorMessage(error, t)}</ErrorText>
          <Button title={t('common.retry')} variant="outline" icon="refresh" onPress={reload} />
        </>
      ) : null}
      {data?.kind === 'denied' ? (
        <>
          <Body>{t('facilities.permissionDenied')}</Body>
          <Button title={t('facilities.openSettings')} icon="location" onPress={() => Linking.openSettings().catch(reload)} />
        </>
      ) : null}
      {data?.kind === 'ready' && data.facilities.length === 0 ? <Body>{t('facilities.none')}</Body> : null}
      {data?.kind === 'ready' ? data.facilities.map((f) => <FacilityCard key={f.id} facility={f} />) : null}
    </Screen>
  );
}

function FacilityCard({ facility: f }: { facility: Facility }) {
  const { t } = useI18n();
  const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  return (
    <Card>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{f.name}</Text>
          {f.city || f.hours ? (
            <Body muted style={{ fontSize: 14 }}>{[f.city, f.hours].filter(Boolean).join(' · ')}</Body>
          ) : null}
        </View>
        <View style={styles.distance}>
          <Ionicons name="navigate" size={14} color={colors.blueDeep} />
          <Text style={styles.distanceText}>{t('common.km', { n: f.distanceKm })}</Text>
        </View>
      </View>
      <View style={styles.tags}>
        {f.services.map((s) => (
          <Text key={s} style={styles.tag}>{t(`facilities.services.${s}`)}</Text>
        ))}
      </View>
      {f.departments.map((d) => (
        <PhoneRow key={d.id} label={d.name} phone={d.phone} onCall={call} />
      ))}
      {f.departments.length === 0 && f.mainPhone ? (
        <PhoneRow label={f.name} phone={f.mainPhone} onCall={call} />
      ) : null}
    </Card>
  );
}

function PhoneRow({ label, phone, onCall }: { label: string; phone: string; onCall: (p: string) => void }) {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={() => onCall(phone)}
      style={({ pressed }) => [styles.phoneRow, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={`${t('common.call')} ${label} ${phone}`}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.phoneLabel}>{label}</Text>
        <Text style={styles.phoneNumber}>{formatPhone(phone)}</Text>
      </View>
      <View style={styles.callButton}>
        <Ionicons name="call" size={22} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  phoneLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  phoneNumber: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blueDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  name: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.blueSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  distanceText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blueDeep },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.pinkDeep,
    backgroundColor: colors.pinkSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
