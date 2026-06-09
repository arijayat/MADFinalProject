import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useLocalization } from '@/contexts/LocalizationContext';

type Props = {
  title: string;
  description: string;
  requirements: string[];
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ActivityCard({ title, description, requirements, onPress }: Props) {
  const { colors, isDark } = useAppTheme();
  const { t } = useLocalization();
  const scale = useSharedValue(1);
  const requirementColor = isDark ? '#7dd3fc' : Wireframe.requirements;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={FadeInUp.duration(200).springify().damping(18)}
      layout={LinearTransition.duration(180)}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.985, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={[
        styles.card,
        {
          backgroundColor: colors.panelBg,
          borderColor: colors.border,
          boxShadow: colors.shadow,
        },
        animatedStyle,
      ]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBubble, { backgroundColor: colors.accentSoft }]}>
          <MaterialIcons name="science" size={20} color={Wireframe.accent} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
      </View>
      <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text>
      <Text style={[styles.reqLabel, { color: colors.text }]}>{t('requirements')}</Text>
      <Text style={[styles.reqList, { color: requirementColor }]}>
        {requirements.slice(0, 3).join(' · ')}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 16,
    marginBottom: 2,
    boxShadow: Wireframe.shadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Wireframe.text,
  },
  desc: {
    fontSize: 13,
    color: Wireframe.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  reqLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Wireframe.text,
    textTransform: 'uppercase',
  },
  reqList: {
    fontSize: 12,
    color: Wireframe.requirements,
    marginTop: 4,
    lineHeight: 17,
  },
});
