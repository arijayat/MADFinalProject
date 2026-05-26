import { StyleSheet } from 'react-native';

/** Low-fidelity wireframe palette from the mockups */
export const Wireframe = {
  screenBg: '#2b2b2b',
  panelBg: '#ffffff',
  text: '#111111',
  textMuted: '#555555',
  border: '#cccccc',
  primaryButton: '#111111',
  primaryButtonText: '#ffffff',
  secondaryButton: '#e0e0e0',
  accentRed: '#c62828',
  accentYellow: '#f9a825',
  requirements: '#c62828',
  placeholder: '#999999',
};

export const wireframeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Wireframe.screenBg,
  },
  panel: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 12,
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
