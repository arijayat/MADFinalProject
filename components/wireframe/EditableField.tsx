import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';

type Props = {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
};

export function EditableField({
  label,
  value,
  onChangeText,
  editable = true,
  placeholder,
}: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editable && onChangeText ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={Wireframe.placeholder}
        />
      ) : (
        <Text style={styles.value}>{value || '—'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Wireframe.textMuted,
    marginBottom: 6,
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
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: Wireframe.text,
  },
});
