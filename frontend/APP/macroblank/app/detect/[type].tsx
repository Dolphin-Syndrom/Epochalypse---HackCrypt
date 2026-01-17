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
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
    acceptedTypes: ['audio/*'],
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

// Glass Card Component
const GlassCard = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={20} tint="dark" style={[styles.glassCard, style]}>
        <View style={styles.glassHighlight} />
        {children}
      </BlurView>
    );
  }
  return (
    <View style={[styles.glassCardAndroid, style]}>
      <View style={styles.glassHighlight} />
      {children}
    </View>
  );
};

// Forensic Scanning Overlay - Cyberpunk style analysis animation
const ForensicScanOverlay = ({ isActive }: { isActive: boolean }) => {
  const scanLinePosition = useSharedValue(0);
  const [dataStrings, setDataStrings] = useState<string[]>([]);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 300 });
      // Animate scan line continuously
      const animate = () => {
        scanLinePosition.value = 0;
        scanLinePosition.value = withTiming(1, {
          duration: 2000,
          easing: Easing.linear
        });
      };
      animate();
      const interval = setInterval(animate, 2000);

      // Generate random data strings
      const dataInterval = setInterval(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const templates = [
          () => `${Math.floor(Math.random() * 9999999).toString().padStart(7, '0')}`,
          () => `<<<${Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}<<<`,
          () => `ID:${Math.floor(Math.random() * 999999)}`,
          () => `SCAN:${Math.floor(Math.random() * 100)}%`,
        ];
        setDataStrings(prev => {
          const newData = [...prev, templates[Math.floor(Math.random() * templates.length)]()];
          return newData.slice(-6);
        });
      }, 300);

      return () => {
        clearInterval(interval);
        clearInterval(dataInterval);
      };
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isActive, scanLinePosition, opacity]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLinePosition.value * 100}%`,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isActive) return null;

  return (
    <Animated.View style={[scanStyles.overlay, overlayStyle]}>
      {/* Scan line */}
      <Animated.View style={[scanStyles.scanLine, scanLineStyle]} />

      {/* Secondary scan line */}
      <Animated.View style={[scanStyles.scanLineSecondary, { top: `${(scanLinePosition.value * 100 + 20) % 100}%` }]} />

      {/* Corner brackets */}
      <View style={[scanStyles.corner, scanStyles.topLeft]} />
      <View style={[scanStyles.corner, scanStyles.topRight]} />
      <View style={[scanStyles.corner, scanStyles.bottomLeft]} />
      <View style={[scanStyles.corner, scanStyles.bottomRight]} />

      {/* Data overlays - Left */}
      <View style={scanStyles.dataLeft}>
        <Text style={scanStyles.dataText}>PASSPORT</Text>
        <Text style={scanStyles.dataText}>PASSEPORT/PASAPORTE</Text>
        {dataStrings.slice(0, 2).map((str, i) => (
          <Text key={i} style={scanStyles.dataText}>{str}</Text>
        ))}
      </View>

      {/* Data overlays - Right */}
      <View style={scanStyles.dataRight}>
        {dataStrings.slice(2, 4).map((str, i) => (
          <Text key={i} style={scanStyles.dataTextPurple}>{`<<<${str}`}</Text>
        ))}
      </View>

      {/* Bottom strip */}
      <View style={scanStyles.bottomStrip}>
        <Text style={scanStyles.dataText}>{"<<<ANALYZING<<<DEEPFAKE<<<"}</Text>
      </View>

      {/* AI Analysis badge */}
      <LinearGradient
        colors={['#EC4899', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={scanStyles.aiBadge}
      >
        <Text style={scanStyles.aiBadgeText}>AI ANALYSIS</Text>
      </LinearGradient>

      {/* Vignette */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.4)']}
        style={scanStyles.vignette}
      />
    </Animated.View>
  );
};

const scanStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#22D3EE',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  scanLineSecondary: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#C084FC',
    opacity: 0.6,
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  corner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: '#22D3EE',
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  dataLeft: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  dataRight: {
    position: 'absolute',
    top: 24,
    right: 24,
    alignItems: 'flex-end',
  },
  dataText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: 'rgba(34, 211, 238, 0.8)',
    marginBottom: 3,
  },
  dataTextPurple: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: 'rgba(192, 132, 252, 0.8)',
    marginBottom: 3,
  },
  bottomStrip: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  aiBadge: {
    position: 'absolute',
    bottom: 50,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
});

// Audio Waveform Analysis Overlay for Mobile
const AudioWaveformOverlay = ({ isActive }: { isActive: boolean }) => {
  const [bars, setBars] = useState<number[]>(Array(24).fill(20));
  const [analysisText, setAnalysisText] = useState('INITIALIZING...');
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 300 });

      const texts = [
        'ANALYZING VOICE PATTERNS...',
        'DETECTING FREQUENCY ANOMALIES...',
        'SCANNING FOR SYNTHESIS ARTIFACTS...',
        'VALIDATING AUDIO SIGNATURE...',
      ];
      let textIndex = 0;

      const barInterval = setInterval(() => {
        setBars(prev => prev.map(() => Math.random() * 80 + 20));
      }, 100);

      const textInterval = setInterval(() => {
        setAnalysisText(texts[textIndex % texts.length]);
        textIndex++;
      }, 1500);

      return () => {
        clearInterval(barInterval);
        clearInterval(textInterval);
      };
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isActive, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isActive) return null;

  return (
    <Animated.View style={[audioStyles.overlay, overlayStyle]}>
      {/* Waveform bars */}
      <View style={audioStyles.waveformContainer}>
        {bars.map((height, i) => (
          <View
            key={i}
            style={[
              audioStyles.bar,
              { height: `${height}%` }
            ]}
          />
        ))}
      </View>

      {/* Analysis status */}
      <View style={audioStyles.statusContainer}>
        <View style={audioStyles.statusDot} />
        <Text style={audioStyles.statusText}>{analysisText}</Text>
      </View>

      {/* Frequency labels */}
      <View style={audioStyles.freqLabels}>
        <Text style={audioStyles.freqText}>20Hz</Text>
        <Text style={audioStyles.freqText}>2kHz</Text>
        <Text style={audioStyles.freqText}>20kHz</Text>
      </View>

      {/* Badge */}
      <LinearGradient
        colors={['#10B981', '#14B8A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={audioStyles.badge}
      >
        <Text style={audioStyles.badgeText}>VOICE ANALYSIS</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const audioStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  waveformContainer: {
    position: 'absolute',
    top: '30%',
    left: 16,
    right: 16,
    height: '40%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    width: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  statusContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  freqLabels: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  freqText: {
    color: 'rgba(16, 185, 129, 0.6)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

// Video Frame Analysis Overlay for Mobile
const VideoAnalysisOverlay = ({ isActive }: { isActive: boolean }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameResults, setFrameResults] = useState<number[]>([]);
  const totalFrames = 30;
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 300 });

      const interval = setInterval(() => {
        setCurrentFrame(prev => {
          const next = prev + 1;
          if (next <= totalFrames) {
            setFrameResults(r => [...r, Math.random() * 100]);
          }
          return next > totalFrames ? 0 : next;
        });
      }, 150);

      return () => {
        clearInterval(interval);
        setFrameResults([]);
        setCurrentFrame(0);
      };
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isActive, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isActive) return null;

  return (
    <Animated.View style={[videoStyles.overlay, overlayStyle]}>
      {/* Frame counter */}
      <View style={videoStyles.frameCounter}>
        <Text style={videoStyles.frameLabel}>FRAME ANALYSIS</Text>
        <Text style={videoStyles.frameNumber}>
          {String(currentFrame).padStart(2, '0')}/{totalFrames}
        </Text>
      </View>

      {/* Timeline */}
      <View style={videoStyles.timeline}>
        <Text style={videoStyles.timelineLabel}>TEMPORAL CONSISTENCY</Text>
        <View style={videoStyles.timelineBar}>
          {frameResults.map((score, i) => (
            <View
              key={i}
              style={[
                videoStyles.timelineSegment,
                { backgroundColor: score > 70 ? '#EF4444' : score > 40 ? '#F59E0B' : '#22C55E' }
              ]}
            />
          ))}
        </View>
        <View style={videoStyles.timelineLabels}>
          <Text style={videoStyles.timelineLabelText}>START</Text>
          <Text style={videoStyles.timelineLabelText}>END</Text>
        </View>
      </View>

      {/* Badge */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={videoStyles.badge}
      >
        <Text style={videoStyles.badgeText}>VIDEO ANALYSIS</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const videoStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  frameCounter: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  frameLabel: {
    color: '#6366F1',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  frameNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timeline: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  timelineLabel: {
    color: '#6366F1',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  timelineBar: {
    height: 24,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  timelineSegment: {
    flex: 1,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timelineLabelText: {
    color: '#6B7280',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

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
              style={[styles.glassUploadArea, selectedFile && styles.uploadAreaSelected]}
              onPress={handleFilePick}
              activeOpacity={0.8}
            >
              {selectedFile ? (
                <View style={styles.selectedFileInfo}>
                  {/* Image Preview */}
                  {(type === 'image' || type === 'ai-generated') ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: selectedFile.uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      {/* Forensic Scan Overlay for images during analysis */}
                      <ForensicScanOverlay isActive={isAnalyzing} />
                    </View>
                  ) : type === 'video' ? (
                    <View style={styles.imagePreviewContainer}>
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={48} color="#6366F1" />
                        <Text style={styles.videoPlaceholderText}>{selectedFile.name}</Text>
                      </View>
                      {/* Video Analysis Overlay */}
                      <VideoAnalysisOverlay isActive={isAnalyzing} />
                    </View>
                  ) : type === 'audio' ? (
                    <View style={styles.imagePreviewContainer}>
                      <View style={styles.audioPlaceholder}>
                        <Ionicons name="mic" size={48} color="#10B981" />
                        <Text style={styles.audioPlaceholderText}>{selectedFile.name}</Text>
                      </View>
                      {/* Audio Waveform Overlay */}
                      <AudioWaveformOverlay isActive={isAnalyzing} />
                    </View>
                  ) : (
                    <View style={styles.fileIconContainer}>
                      <Ionicons name={config.icon} size={32} color={config.gradient[0]} />
                    </View>
                  )}
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
            <GlassCard>
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
            </GlassCard>
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
    width: '100%',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  videoPlaceholderText: {
    color: '#6366F1',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: '80%',
    textAlign: 'center',
  },
  audioPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  audioPlaceholderText: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: '80%',
    textAlign: 'center',
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
  // Glass effect styles
  glassCard: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: appTheme.colors.glassBorder,
    overflow: 'hidden',
    ...appTheme.shadows.glass,
  },
  glassCardAndroid: {
    backgroundColor: appTheme.colors.glass,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: appTheme.colors.glassBorder,
    ...appTheme.shadows.glass,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: appTheme.colors.glassHighlight,
  },
  glassUploadArea: {
    backgroundColor: appTheme.colors.glass,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: appTheme.colors.glassBorder,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
});
