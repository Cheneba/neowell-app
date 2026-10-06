import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { FacilityHit } from '@/api/types';
import { Field, ListRow, Pill } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useSession } from '@/lib/session';
import { spacing } from '@/theme';

/** Directory search with a free-text fallback ("Not in the list? Type the name"). */
export function FacilityPicker({
  label,
  selectedId,
  name,
  onChange,
}: {
  label: string;
  selectedId?: string;
  name: string;
  onChange: (id: string | undefined, name: string) => void;
}) {
  const { t } = useI18n();
  const { api } = useSession();
  const [hits, setHits] = useState<FacilityHit[]>([]);

  const searching = !selectedId && name.trim().length >= 2;
  useEffect(() => {
    if (!searching) return;
    const timer = setTimeout(() => {
      api.searchFacilities(name.trim()).then(setHits, () => setHits([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [api, name, searching]);

  return (
    <View style={{ gap: spacing.xs }}>
      <Field
        label={label}
        value={name}
        placeholder={t('baby.searchFacility')}
        onChangeText={(text) => onChange(undefined, text)}
        hint={selectedId ? undefined : t('baby.orTypeName')}
      />
      {selectedId ? <Pill tone="success" icon="checkmark-circle" label={name} /> : null}
      {(searching ? hits : []).map((h) => (
        <ListRow
          key={h.id}
          icon="business-outline"
          title={h.name}
          subtitle={[h.city, h.region].filter(Boolean).join(' · ')}
          onPress={() => {
            setHits([]);
            onChange(h.id, h.name);
          }}
        />
      ))}
    </View>
  );
}
