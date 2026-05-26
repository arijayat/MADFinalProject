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

export function FieldBlock({
  field,
  value,
  onChange,
}: {
  field: PredictionField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.kind === 'dropdown') {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{field.label}</Text>
        <DropdownModal field={field} value={value} onChange={onChange} />
      </View>
    );
  }
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        style={styles.input}
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={styles.inputLike} onPress={() => setOpen(true)}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value || field.placeholder}
        </Text>
        <Text style={styles.chev}>▼</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <FlatList
              data={field.options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}>
                  <Text style={styles.optionText}>{item}</Text>
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
    fontWeight: '600',
    color: Wireframe.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: Wireframe.text,
    backgroundColor: '#fafafa',
  },
  inputLike: {
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: { fontSize: 14, color: Wireframe.text, flex: 1 },
  placeholder: { color: Wireframe.placeholder },
  chev: { fontSize: 12, color: Wireframe.textMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 4,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Wireframe.border,
  },
  optionText: { fontSize: 15, color: Wireframe.text },
});
