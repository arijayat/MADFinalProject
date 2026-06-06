import { StyleSheet } from 'react-native';

export const Wireframe = {
  screenBg: '#22577a',
  panelBg: '#ffffff',
  surfaceAlt: '#f6f8fb',
  text: '#14213d',
  textMuted: '#64748b',
  border: '#dbe4ee',
  primaryButton: '#2f6f88',
  primaryButtonText: '#ffffff',
  secondaryButton: '#edf4f7',
  accent: '#2f6f88',
  accentSoft: '#d9eef3',
  accentRed: '#d64545',
  accentYellow: '#f5a524',
  requirements: '#2f6f88',
  placeholder: '#94a3b8',
  shadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
};

export const wireframeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Wireframe.screenBg,
  },
  panel: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 16,
    boxShadow: Wireframe.shadow,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Wireframe.text,
  },
  subtitle: {
    fontSize: 13,
    color: Wireframe.textMuted,
    marginTop: 4,
  },
  body: {
    fontSize: 14,
    color: Wireframe.text,
  },
});
