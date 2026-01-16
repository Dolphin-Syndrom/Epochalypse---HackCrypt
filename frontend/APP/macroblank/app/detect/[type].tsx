import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { appTheme } from '../../constants/appTheme';
import { detectVideo, detectImage, detectAudio, detectAIGenerated, DetectionResult } from '../../services/api';

type DetectionType = 'video' | 'image' | 'audio' | 'ai-generated';

interface TypeConfig {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  acceptedTypes: string[];
  description: string;
}

const typeConfigs: Record<DetectionType, TypeConfig> = {
  video: {
    title: 'Video Detection',
    subtitle: 'GenConViT Model',
    icon: 'videocam',
    gradient: ['#6366F1', '#8B5CF6'],
    acceptedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'],
    description: 'Upload a video file to analyze for deepfake manipulation',
  },
  image: {
    title: 'Image Detection',
    subtitle: 'ConvNeXt-MTCNN',
    icon: 'image',
    gradient: ['#EC4899', '#F43F5E'],
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    description: 'Upload a face image to check for deepfake manipulation',
  },
  audio: {
    title: 'Audio Detection',
    subtitle: 'Wav2Vec2-AASIST',
    icon: 'mic',
    gradient: ['#10B981', '#14B8A6'],
    acceptedTypes: ['audio/wav', 'audio/mp3', 'audio/flac', 'audio/ogg'],
    description: 'Upload an audio file to detect voice cloning',
  },
  'ai-generated': {
    title: 'AI Generated Detection',
    subtitle: 'EfficientNet Model',
    icon: 'sparkles',
    gradient: ['#F59E0B', '#EAB308'],
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    description: 'Upload an image to check if it was AI-generated (DALL-E, Midjourney, Stable Diffusion)',
  },
};

export default function DetectionScreen() {
  const { type } = useLocalSearchParams<{ type: DetectionType }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = typeConfigs[type || 'video'];

  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  // Animation values
  const gaugeRotation = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const progressAnim = useSharedValue(0);

  // Pulse animation when analyzing
  useEffect(() => {
    if (isAnalyzing) {
      pulseAnim.value = withSequence(
        withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      );
      progressAnim.value = withTiming(1, { duration: 3000, easing: Easing.linear });
    } else {
      pulseAnim.value = 1;
      progressAnim.value = 0;
    }
  }, [isAnalyzing, pulseAnim, progressAnim]);

  const handleFilePick = useCallback(async () => {
    try {
      if (type === 'image' || type === 'ai-generated') {
        // Use image picker for images and AI-generated detection
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please grant access to your photo library.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setSelectedFile({
            name: asset.fileName || 'image.jpg',
            uri: asset.uri,
          });
          setResult(null);
        }
      } else if (type === 'video') {
        // Use image picker for videos
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please grant access to your media library.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setSelectedFile({
            name: asset.fileName || 'video.mp4',
            uri: asset.uri,
          });
          setResult(null);
        }
      } else {
        // Use document picker for audio
        const result = await DocumentPicker.getDocumentAsync({
          type: config.acceptedTypes.length > 0 ? config.acceptedTypes : '*/*',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
          setSelectedFile({
            name: result.assets[0].name,
            uri: result.assets[0].uri,
          });
          setResult(null);
        }
      }
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  }, [type, config]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first.');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    gaugeRotation.value = 0;
    resultOpacity.value = 0;

    try {
      let detectionResult: DetectionResult;

      if (type === 'video') {
        detectionResult = await detectVideo(selectedFile!.uri, selectedFile!.name);
      } else if (type === 'image') {
        detectionResult = await detectImage(selectedFile!.uri, selectedFile!.name);
      } else if (type === 'ai-generated') {
        detectionResult = await detectAIGenerated(selectedFile!.uri, selectedFile!.name);
      } else {
        detectionResult = await detectAudio(selectedFile!.uri, selectedFile!.name);
      }

      setResult(detectionResult);
      
      // Animate gauge
      const targetRotation = detectionResult.confidence * 1.8; // 180 degrees max
      gaugeRotation.value = withTiming(targetRotation, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
      resultOpacity.value = withTiming(1, { duration: 500 });
    } catch (error: any) {
      console.error('Detection error:', error);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze. Please check your connection and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [type, selectedFile, gaugeRotation, resultOpacity]);

  const gaugeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gaugeRotation.value}deg` }],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ translateY: withSpring(resultOpacity.value === 0 ? 30 : 0, { damping: 15, stiffness: 100 }) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={appTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <Text style={styles.headerSubtitle}>{config.subtitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Banner */}
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.typeBanner}
          >
            <View style={styles.bannerIconContainer}>
              <Ionicons name={config.icon} size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.bannerDescription}>{config.description}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Input Section */}
        <Animated.View entering={FadeInDown.delay(150).duration(500).springify()}>
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={[styles.uploadArea, selectedFile && styles.uploadAreaSelected]}
              onPress={handleFilePick}
              activeOpacity={0.8}
            >
              {selectedFile ? (
                <View style={styles.selectedFileInfo}>
                  <View style={styles.fileIconContainer}>
                    <Ionicons name={config.icon} size={32} color={config.gradient[0]} />
                  </View>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.tapToChange}>Tap to change</Text>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.uploadIconContainer}>
                    <Ionicons name="cloud-upload-outline" size={40} color={appTheme.colors.textMuted} />
                  </View>
                  <Text style={styles.uploadText}>Tap to select a file</Text>
                  <Text style={styles.uploadHint}>
                    {type === 'video' && 'MP4, AVI, MOV, MKV'}
                    {type === 'image' && 'JPG, PNG'}
                    {type === 'audio' && 'WAV, MP3, FLAC, OGG'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Analyze Button */}
        <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (isAnalyzing || !selectedFile) && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={isAnalyzing || !selectedFile}
          activeOpacity={0.8}
        >
          <Animated.View style={pulseStyle}>
            <LinearGradient
              colors={isAnalyzing ? ['#3A3A45', '#3A3A45'] : [config.gradient[0], config.gradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeButtonGradient}
            >
              {isAnalyzing ? (
                <View style={styles.analyzingContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                  <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBar, progressStyle]} />
                  </View>
                </View>
              ) : (
                <View style={styles.analyzeContent}>
                  <Ionicons name="scan" size={22} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
        </Animated.View>

        {/* Results Section */}
        {result && (
          <Animated.View style={[styles.resultSection, resultStyle]}>
            <View style={styles.resultCard}>
              {/* Gauge */}
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeBackground}>
                  <Animated.View style={[styles.gaugeNeedle, gaugeStyle]}>
                    <View style={styles.needleInner} />
                  </Animated.View>
                  <View style={styles.gaugeCenter}>
                    <Text style={styles.gaugeValue}>{result.confidence.toFixed(1)}%</Text>
                  </View>
                </View>
                <View style={styles.gaugeLabels}>
                  <Text style={styles.gaugeLabelLeft}>Real</Text>
                  <Text style={styles.gaugeLabelRight}>Fake</Text>
                </View>
              </View>

              {/* Verdict */}
              <View
                style={[
                  styles.verdictBadge,
                  { backgroundColor: result.prediction === 'REAL' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Ionicons
                  name={result.prediction === 'REAL' ? 'checkmark-circle' : 'warning'}
                  size={24}
                  color={result.prediction === 'REAL' ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.verdictText,
                    { color: result.prediction === 'REAL' ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {result.prediction === 'REAL' ? 'Likely Authentic' : 'Likely Manipulated'}
                </Text>
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Model</Text>
                  <Text style={styles.detailValue}>{result.model || config.subtitle}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Confidence</Text>
                  <Text style={styles.detailValue}>{result.confidence.toFixed(2)}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Classification</Text>
                  <Text style={styles.detailValue}>{result.prediction}</Text>
                </View>
              </View>

              {/* Probability Bars */}
              <View style={styles.probabilitySection}>
                <Text style={styles.probabilityTitle}>Probability Breakdown</Text>
                <View style={styles.probabilityBar}>
                  <Text style={styles.probabilityLabel}>Real</Text>
                  <View style={styles.probabilityTrack}>
                    <View
                      style={[
                        styles.probabilityFill,
                        {
                          width: `${result.prediction === 'REAL' ? result.confidence : 100 - result.confidence}%`,
                          backgroundColor: '#10B981',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.probabilityValue}>
                    {(result.prediction === 'REAL' ? result.confidence : 100 - result.confidence).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.probabilityBar}>
                  <Text style={styles.probabilityLabel}>Fake</Text>
                  <View style={styles.probabilityTrack}>
                    <View
                      style={[
                        styles.probabilityFill,
                        {
                          width: `${result.prediction === 'FAKE' ? result.confidence : 100 - result.confidence}%`,
                          backgroundColor: '#EF4444',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.probabilityValue}>
                    {(result.prediction === 'FAKE' ? result.confidence : 100 - result.confidence).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: appTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  typeBanner: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  bannerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bannerDescription: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadArea: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: appTheme.colors.border,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
  uploadAreaSelected: {
    borderColor: appTheme.colors.primary,
    borderStyle: 'solid',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: appTheme.colors.text,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  selectedFileInfo: {
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(232, 232, 236, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: appTheme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  tapToChange: {
    fontSize: 13,
    color: appTheme.colors.primary,
  },
  analyzeButton: {
    marginBottom: 24,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonGradient: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  analyzeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gaugeBackground: {
    width: 200,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: appTheme.colors.border,
  },
  gaugeNeedle: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: 4,
    height: 80,
    marginLeft: -2,
    transformOrigin: 'bottom center',
  },
  needleInner: {
    flex: 1,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 2,
  },
  gaugeCenter: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    transform: [{ translateX: -40 }],
    width: 80,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: appTheme.colors.border,
  },
  gaugeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 8,
  },
  gaugeLabelLeft: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  gaugeLabelRight: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  verdictText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: appTheme.colors.text,
  },
  probabilitySection: {
    marginTop: 8,
  },
  probabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.colors.textSecondary,
    marginBottom: 16,
  },
  probabilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  probabilityLabel: {
    width: 40,
    fontSize: 12,
    color: appTheme.colors.textMuted,
  },
  probabilityTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  probabilityValue: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.colors.text,
    textAlign: 'right',
  },
});
