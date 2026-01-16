import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { appTheme } from '../../constants/appTheme';

// Mock history data - in a real app, this would come from AsyncStorage or a backend
const mockHistory: HistoryItem[] = [];

interface HistoryItem {
  id: string;
  type: 'video' | 'image' | 'audio' | 'text';
  filename: string;
  result: 'real' | 'fake';
  confidence: number;
  timestamp: Date;
}

const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'video': return 'videocam';
    case 'image': return 'image';
    case 'audio': return 'mic';
    case 'text': return 'document-text';
    default: return 'help-circle';
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'video': return '#6366F1';
    case 'image': return '#EC4899';
    case 'audio': return '#10B981';
    case 'text': return '#F59E0B';
    default: return '#6B7280';
  }
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.background} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your recent detection results</Text>
        </Animated.View>

        {/* Empty State */}
        {mockHistory.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="time-outline" size={64} color={appTheme.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyDescription}>
              Your detection results will appear here after you analyze your first file.
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.historyList}>
            {mockHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]}>
                  <Ionicons name={getTypeIcon(item.type)} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemFilename} numberOfLines={1}>
                    {item.filename}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.timestamp.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.resultBadge}>
                  <View style={[
                    styles.resultDot,
                    { backgroundColor: item.result === 'real' ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.resultText,
                    { color: item.result === 'real' ? '#10B981' : '#EF4444' }
                  ]}>
                    {item.confidence.toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
    flexGrow: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: appTheme.colors.text,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: appTheme.colors.textMuted,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: appTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: appTheme.colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  typeIndicator: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemFilename: {
    fontSize: 15,
    fontWeight: '500',
    color: appTheme.colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
