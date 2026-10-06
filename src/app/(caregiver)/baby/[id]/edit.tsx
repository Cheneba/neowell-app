import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, ErrorText, Loading, Screen, Title } from '@/components/ui';
import { babyToForm, type BabyFormValues, formErrorText, formToBaby, validateBabyForm } from '@/features/babies/baby-form';
import { AboutFields, BirthFields, WhereFields } from '@/features/babies/BabyFormFields';
import { useI18n } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { babyName } from '@/lib/format';
import { useSession } from '@/lib/session';

export default function EditBaby() {
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, me } = useSession();
  const [values, setValues] = useState<BabyFormValues>();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.baby(id).then(
      (b) => {
        setValues(babyToForm(b));
        setDisplayName(babyName(b.displayName, locale));
      },
      (e) => setError(errorMessage(e, t)),
    );
  }, [api, id, locale, t]);

  if (!values) return error ? <Screen><ErrorText>{error}</ErrorText></Screen> : <Loading />;
  const set = (patch: Partial<BabyFormValues>) => setValues((v) => ({ ...v!, ...patch }));

  async function save() {
    const problem = validateBabyForm(values!, 'all');
    if (problem) return setError(formErrorText(problem, t));
    setLoading(true);
    try {
      const body = formToBaby(values!);
      await api.updateBaby(id, { ...body, givenName: body.givenName ?? '' });
      router.back();
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  async function remove() {
    const ok = await confirm(t('baby.removeConfirm', { name: displayName }), undefined, { ok: t('baby.remove'), cancel: t('common.cancel') });
    if (!ok) return;
    await api.deleteBaby(id).catch(() => undefined);
    router.dismissTo('/');
  }

  const props = { values, set, lastName: me?.lastName ?? '' };
  return (
    <Screen footer={<Button title={t('common.save')} onPress={save} loading={loading} icon="checkmark-circle" />}>
      <AboutFields {...props} />
      <Title style={{ fontSize: 20 }}>{t('baby.stepBirth')}</Title>
      <BirthFields {...props} />
      <Title style={{ fontSize: 20 }}>{t('baby.stepWhere')}</Title>
      <WhereFields {...props} />
      <ErrorText>{error}</ErrorText>
      <Button title={t('baby.remove')} variant="ghost" icon="trash-outline" onPress={remove} />
    </Screen>
  );
}
