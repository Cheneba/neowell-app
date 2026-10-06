import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { Consultation } from '@/api/types';
import { Avatar, Banner, Body, Button, Card, ErrorText, Pill } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { babyName, money, timeLabel } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { useSession } from '@/lib/session';
import { colors, fonts, spacing } from '@/theme';
import { Chat } from './Chat';
import { MEDIUM_ICON, STATUS_TONE } from './status';

const BANNER_TONE = { AWAITING_PAYMENT: 'warning', REQUESTED: 'pink', CONFIRMED: 'info', IN_PROGRESS: 'success', COMPLETED: 'success' } as const;

/** The consultation room shared by caregivers and clinicians (design guide §6.2/§6.3). */
export function ConsultationRoom({
  c,
  viewer,
  onChange,
  actions,
  top,
}: {
  c: Consultation;
  viewer: 'caregiver' | 'clinician';
  onChange: () => void;
  /** Role-specific buttons (pay/cancel/review, or accept/start/complete…). */
  actions?: ReactNode;
  /** Role-specific cards above the chat. */
  top?: ReactNode;
}) {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const [error, setError] = useState<string>();
  const [joining, setJoining] = useState(false);
  const title = viewer === 'caregiver' ? c.clinician.displayName : babyName(c.baby.displayName, locale);
  const hasCall = c.medium !== 'CHAT';

  async function joinCall() {
    setJoining(true);
    setError(undefined);
    try {
      const { joinUrl } = await api.callLink(c.id);
      await WebBrowser.openBrowserAsync(joinUrl);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setJoining(false);
    }
  }

  const bannerTone = (BANNER_TONE as Record<string, 'warning' | 'pink' | 'info' | 'success'>)[c.status] ?? 'danger';
  return (
    <>
      <Card>
        <View style={styles.row}>
          <Avatar name={title} uri={viewer === 'caregiver' ? c.clinician.photoUrl : null} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.title}>{title}</Text>
            <Body muted style={{ fontSize: 14 }}>
              {viewer === 'caregiver' ? `${babyName(c.baby.displayName, locale)} · ` : ''}
              {timeLabel(c.scheduledAt, locale)}
            </Body>
            <View style={styles.pills}>
              <Pill tone={STATUS_TONE[c.status]} label={t(`consultation.status.${c.status}`)} />
              <Pill icon={MEDIUM_ICON[c.medium]} label={t(`doctors.media.${c.medium}`)} />
              <Pill tone={c.paymentStatus === 'PAID' ? 'success' : 'warning'} label={`${money(viewer === 'clinician' && c.clinicianEarningXaf != null ? c.clinicianEarningXaf : c.feeXaf)} · ${t(`consultation.payment.${c.paymentStatus}`)}`} />
            </View>
          </View>
        </View>
      </Card>

      <Banner tone={bannerTone}>{t(`consultation.banner.${c.status}`, { time: timeLabel(c.scheduledAt, locale) })}</Banner>
      {c.reason ? <Body muted>“{c.reason}”</Body> : null}
      {top}

      {hasCall && c.canJoinCall ? (
        <View style={{ gap: spacing.xs }}>
          <Button title={t('consultation.joinCall')} icon={MEDIUM_ICON[c.medium]} loading={joining} onPress={joinCall} />
          <Body muted style={{ fontSize: 13, textAlign: 'center' }}>{t('consultation.callHint', { camera: c.medium === 'VIDEO' ? t('consultation.camera') : '' })}</Body>
        </View>
      ) : null}
      <ErrorText>{error}</ErrorText>

      {c.referral ? (
        <Card tint={colors.redSoft}>
          <View style={styles.row}>
            <Ionicons name="business" size={22} color={colors.red} />
            <Text style={[styles.title, { color: colors.red, flex: 1 }]}>{t('consultation.referralTitle')}</Text>
          </View>
          <Pill tone="danger" label={t(`consultation.urgency.${c.referral.urgency}`)} />
          <Body style={{ fontFamily: fonts.bold }}>{c.referral.facility?.name ?? c.referral.facilityName}</Body>
          <Body>{c.referral.reason}</Body>
          <Body style={{ fontFamily: fonts.extrabold }}>{t('consultation.referralCode', { code: c.referral.code })}</Body>
          {viewer === 'caregiver'
            ? (c.referral.facility?.departments.length
                ? c.referral.facility.departments
                : c.referral.facility?.mainPhone
                  ? [{ id: 'main', name: c.referral.facility.name, phone: c.referral.facility.mainPhone }]
                  : []
              ).map((d) => (
                <Button key={d.id} title={`${t('common.call')} ${d.name} · ${formatPhone(d.phone)}`} icon="call" variant="danger" onPress={() => Linking.openURL(`tel:${d.phone.replace(/\s/g, '')}`)} />
              ))
            : null}
        </Card>
      ) : null}

      {c.drugChart ? (
        <Card tint={colors.blueSoft}>
          <Text style={styles.title}>{t('consultation.medicinesTitle')}</Text>
          {c.drugChart.items.map((i) => (
            <Body key={i.id} style={{ fontSize: 15 }}>• {i.drugName} — {i.dose}, {i.route}, {i.timesOfDay.join(' · ')} × {i.durationDays} d</Body>
          ))}
        </Card>
      ) : null}

      {c.diagnosisSummary || c.clinicianNotes ? (
        <Card>
          <Text style={styles.title}>{t('consultation.notes')}</Text>
          {c.diagnosisSummary ? <Body style={{ fontFamily: fonts.bold }}>{c.diagnosisSummary}</Body> : null}
          {c.clinicianNotes ? <Body>{c.clinicianNotes}</Body> : null}
        </Card>
      ) : null}

      {actions}

      {c.status !== 'AWAITING_PAYMENT' ? <Chat consultationId={c.id} open={c.chatOpen} closedText={t(c.status === 'REQUESTED' ? 'consultation.chatAfterAccept' : 'consultation.chatClosed')} onActivity={onChange} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
