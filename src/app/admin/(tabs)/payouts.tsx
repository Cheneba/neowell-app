import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, EmptyState, ErrorText, Field, Loading, Pill, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { dateLabel, money } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusData } from '@/lib/use-async';
import { colors, fonts, spacing } from '@/theme';

type Filter = 'PENDING' | 'PAID' | 'ALL';

/** Weekly clinician payouts; admins mark them paid with the mobile-money reference. */
export default function AdminPayouts() {
  const { t, locale } = useI18n();
  const { api } = useSession();
  const [filter, setFilter] = useState<Filter>('PENDING');
  const { data, error, loading, reload } = useFocusData(() =>
    api.adminPayouts(filter === 'ALL' ? undefined : filter),
  );
  const [paying, setPaying] = useState<string>();
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string>();

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void reload();
  }, [filter, reload]);

  async function markPaid(id: string) {
    if (!reference.trim()) return;
    setBusy(true);
    setActionError(undefined);
    try {
      await api.adminMarkPayoutPaid(id, reference.trim());
      setPaying(undefined);
      setReference('');
      await reload();
    } catch (e) {
      setActionError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'PENDING', label: t('admin.filters.PENDING') },
          { value: 'PAID', label: t('admin.filters.PAID') },
          { value: 'ALL', label: t('admin.filters.ALL') },
        ]}
      />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorText>{errorMessage(error, t)}</ErrorText> : null}
      {data && data.length === 0 ? <EmptyState icon="wallet-outline">{t('admin.noPayouts')}</EmptyState> : null}
      {data?.map((p) => {
        const clinician = [p.clinician.user.firstName, p.clinician.user.lastName].filter(Boolean).join(' ') || p.clinician.title;
        return (
          <Card key={p.id} style={{ gap: spacing.sm }}>
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={styles.amount}>{money(p.amountXaf)}</Text>
                <Body muted style={{ fontSize: 13 }}>{clinician}</Body>
                <Body muted style={{ fontSize: 13 }}>
                  {p.clinician.payoutPhone ?? '—'}{p.clinician.payoutProvider ? ` · ${p.clinician.payoutProvider}` : ''}
                </Body>
                <Body muted style={{ fontSize: 12 }}>
                  {dateLabel(p.periodStart, locale)} – {dateLabel(p.periodEnd, locale)}
                </Body>
              </View>
              <Pill
                tone={p.status === 'PAID' ? 'success' : 'warning'}
                label={t(p.status === 'PAID' ? 'admin.filters.PAID' : 'admin.filters.PENDING')}
              />
            </View>
            {p.status === 'PAID' ? (
              <Body muted style={{ fontSize: 13 }}>{t('admin.reference')}: {p.reference ?? '—'}</Body>
            ) : paying === p.id ? (
              <View style={{ gap: spacing.sm }}>
                <Field value={reference} onChangeText={setReference} placeholder={t('admin.referencePlaceholder')} autoFocus />
                <View style={styles.actions}>
                  <Button title={t('admin.confirmPaid')} onPress={() => markPaid(p.id)} loading={busy} disabled={!reference.trim()} style={{ flex: 1 }} />
                  <Button title={t('admin.cancel')} variant="ghost" onPress={() => { setPaying(undefined); setReference(''); }} />
                </View>
              </View>
            ) : (
              <Button title={t('admin.markPaid')} variant="outline" icon="cash-outline" onPress={() => { setPaying(p.id); setReference(''); }} />
            )}
          </Card>
        );
      })}
      <ErrorText>{actionError}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  amount: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
