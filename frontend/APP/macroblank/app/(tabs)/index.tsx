import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { appTheme } from '../../constants/appTheme';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

type DetectionType = 'video' | 'image' | 'audio' | 'ai-generated';

interface DetectionCard {
  type: DetectionType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  description: string;
}

const detectionCards: DetectionCard[] = [
  {
    type: 'video',
    title: 'Video',
    subtitle: 'GenConViT',
    icon: 'videocam',
    gradient: ['#6366F1', '#8B5CF6'],
    description: 'Detect deepfake videos using advanced transformer analysis',
  },
  {
    type: 'image',
    title: 'Image',
    subtitle: 'ConvNeXt',
    icon: 'image',
    gradient: ['#EC4899', '#F43F5E'],
    description: 'Analyze face images for deepfake manipulations',
  },
  {
    type: 'audio',
    title: 'Audio',
    subtitle: 'Wav2Vec2',
    icon: 'mic',
    gradient: ['#10B981', '#14B8A6'],
    description: 'Detect voice cloning and audio synthesis',
  },
  {
    type: 'ai-generated',
    title: 'AI Generated',
    subtitle: 'EfficientNet',
    icon: 'sparkles',
    gradient: ['#F59E0B', '#EAB308'],
    description: 'Detect AI-generated images (DALL-E, Midjourney, etc.)',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleCardPress = (type: DetectionType) => {
    router.push(`/detect/${type}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#E8E8EC', '#A0A0B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="shield-checkmark" size={28} color="#050508" />
            </LinearGradient>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appName}>MacroBlank</Text>
            <Text style={styles.tagline}>Deepfake Detection Suite</Text>
          </View>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(232, 232, 236, 0.08)', 'rgba(160, 160, 176, 0.04)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Text style={styles.heroTitle}>Verify Authenticity</Text>
            <Text style={styles.heroSubtitle}>
              AI-powered detection for videos, images, audio, and text
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Detection Types</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>99%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>&lt;5s</Text>
            <Text style={styles.statLabel}>Analysis Time</Text>
          </View>
        </Animated.View>

        {/* Section Title */}
        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Detection Type</Text>
          <Text style={styles.sectionSubtitle}>Choose a category to analyze</Text>
        </Animated.View>

        {/* Detection Cards Grid */}
        <View style={styles.cardsGrid}>
          {detectionCards.map((card, index) => (
            <Animated.View 
              key={card.type}
              entering={FadeInDown.delay(400 + index * 100).duration(500).springify()}
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                onPress={() => handleCardPress(card.type)}
                activeOpacity={0.8}
              >
              <View style={styles.card}>
                <LinearGradient
                  colors={card.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconContainer}
                >
                  <Ionicons name={card.icon} size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {card.description}
                </Text>
                <View style={styles.cardArrow}>
                  <Ionicons name="arrow-forward" size={18} color={appTheme.colors.textMuted} />
                </View>
              </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info Section */}
        <Animated.View entering={FadeInDown.delay(800).duration(600).springify()} style={styles.infoSection}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoCard}
          >
            <Ionicons name="information-circle" size={24} color="#8B5CF6" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoDescription}>
                Upload your media file and our AI models will analyze it for signs of manipulation or AI generation.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoContainer: {
    marginRight: 12,
  },
  logoGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: appTheme.colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    marginTop: 2,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 236, 0.15)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: appTheme.colors.text,
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: appTheme.colors.textSecondary,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: appTheme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: appTheme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: appTheme.colors.border,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: appTheme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardWrapper: {
    width: cardWidth,
    marginBottom: 16,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    minHeight: 180,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: appTheme.colors.primary,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    lineHeight: 18,
  },
  cardArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: appTheme.colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: appTheme.colors.textSecondary,
    lineHeight: 20,
  },
});
