import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Wireframe, wireframeStyles } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useLocalization } from '@/contexts/LocalizationContext';

type Props = {
  title: string;
  children: (editing: boolean) => ReactNode;
  onSave: () => Promise<void>;
  onCancel: () => void;
  /** When false, the section is view-only (no edit control). Defaults to true. */
  editable?: boolean;
};

export function EditableSection({
  title,
  children,
  onSave,
  onCancel,
  editable = true,
}: Props) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleCancel() {
    onCancel();
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        wireframeStyles.panel,
        {
          backgroundColor: colors.panelBg,
          borderColor: colors.border,
          boxShadow: colors.shadow,
        },
      ]}>
      <View style={styles.titleRow}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>{title}</Text>
        {editable && !editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title}`}
            onPress={() => setEditing(true)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: colors.surfaceAlt },
              pressed && styles.pressed,
            ]}>
            <MaterialIcons name="edit" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {children(editing)}

      {editing ? (
        <View style={styles.actions}>
          <PrimaryButton
            label={t('cancel')}
            variant="light"
            onPress={handleCancel}
            disabled={saving}
            style={styles.actionButton}
          />
          <PrimaryButton
            label={saving ? t('saving') : t('save')}
            onPress={handleSave}
            disabled={saving}
            style={styles.actionButton}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Wireframe.text,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Wireframe.surfaceAlt,
  },
  pressed: {
    opacity: 0.75,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
  },
});
