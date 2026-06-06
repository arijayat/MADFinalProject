import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PredictionField } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

export function FieldBlock({
  field,
  value,
  onChange,
}: {
  field: PredictionField;
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useAppTheme();
  if (field.kind === 'dropdown') {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{field.label}</Text>
        <DropdownModal field={field} value={value} onChange={onChange} />
      </View>
    );
  }
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{field.label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
          },
        ]}
        placeholder={field.placeholder}
        placeholderTextColor={Wireframe.placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={field.kind === 'number' ? 'decimal-pad' : 'default'}
      />
    </View>
  );
}

function DropdownModal({
  field,
  value,
  onChange,
}: {
  field: Extract<PredictionField, { kind: 'dropdown' }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        style={[
          styles.inputLike,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setOpen(true)}>
        <Text style={[styles.inputText, { color: colors.text }, !value && styles.placeholder]}>
          {value || field.placeholder}
        </Text>
        <Text style={[styles.chev, { color: colors.textMuted }]}>▼</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.panelBg,
                borderColor: colors.border,
              },
            ]}>
            <FlatList
              data={field.options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.optionRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}>
                  <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Wireframe.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: Wireframe.text,
    backgroundColor: Wireframe.surfaceAlt,
  },
  inputLike: {
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: Wireframe.surfaceAlt,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: { fontSize: 14, color: Wireframe.text, flex: 1 },
  placeholder: { color: Wireframe.placeholder },
  chev: { fontSize: 12, color: Wireframe.textMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: Wireframe.border,
    overflow: 'hidden',
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Wireframe.border,
  },
  optionText: { fontSize: 15, color: Wireframe.text },
});
