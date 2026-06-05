import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Wireframe, wireframeStyles } from '@/constants/wireframe-theme';

type Props = {
  title: string;
  children: (editing: boolean) => ReactNode;
  onSave: () => Promise<void>;
  onCancel: () => void;
};

export function EditableSection({ title, children, onSave, onCancel }: Props) {
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
    <View style={wireframeStyles.panel}>
      <View style={styles.titleRow}>
        <Text style={styles.panelTitle}>{title}</Text>
        {!editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title}`}
            onPress={() => setEditing(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <MaterialIcons name="edit" size={20} color={Wireframe.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {children(editing)}

      {editing ? (
        <View style={styles.actions}>
          <PrimaryButton
            label="CANCEL"
            variant="light"
            onPress={handleCancel}
            disabled={saving}
            style={styles.actionButton}
          />
          <PrimaryButton
            label={saving ? 'SAVING…' : 'SAVE'}
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
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Wireframe.text,
  },
  editButton: {
    padding: 4,
  },
  pressed: {
    opacity: 0.75,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
