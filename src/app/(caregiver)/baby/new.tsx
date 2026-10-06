import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ErrorText, Screen, Title } from '@/components/ui';
import { emptyBabyForm, formErrorText, formToBaby, validateBabyForm } from '@/features/babies/baby-form';
import { AboutFields, BirthFields, WhereFields } from '@/features/babies/BabyFormFields';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';
import { colors, spacing } from '@/theme';

const STEPS = ['about', 'birth', 'where'] as const;
const TITLES = { about: 'baby.stepAbout', birth: 'baby.stepBirth', where: 'baby.stepWhere' } as const;

/** Add a baby in three short steps (design guide §6.2). */
export default function NewBaby() {
  const { t } = useI18n();
  const { api, me } = useSession();
  const [values, setValues] = useState(emptyBabyForm);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const current = STEPS[step];
  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  async function next() {
    if (current !== 'where') {
      const problem = validateBabyForm(values, current);
      if (problem) return setError(formErrorText(problem, t));
      setError(undefined);
      return setStep(step + 1);
    }
    setLoading(true);
    try {
      const baby = await api.createBaby(formToBaby(values));
      router.replace({ pathname: '/baby/[id]', params: { id: baby.id } });
    } catch (e) {
      setError(errorMessage(e, t));
      setLoading(false);
    }
  }

  const props = { values, set, lastName: me?.lastName ?? '' };
  return (
    <Screen
      footer={
        <>
          <Button title={current === 'where' ? t('common.save') : t('common.next')} onPress={next} loading={loading} icon={current === 'where' ? 'checkmark-circle' : 'arrow-forward'} />
          {step > 0 ? <Button title={t('common.back')} variant="ghost" onPress={() => setStep(step - 1)} /> : null}
        </>
      }
    >
      <View style={styles.dots} accessibilityLabel={`${step + 1} / ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>
      <Title style={{ fontSize: 22 }}>{t(TITLES[current])}</Title>
      {current === 'about' ? <AboutFields {...props} /> : null}
      {current === 'birth' ? <BirthFields {...props} /> : null}
      {current === 'where' ? <WhereFields {...props} /> : null}
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'center' },
  dot: { width: 28, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.pink },
});
