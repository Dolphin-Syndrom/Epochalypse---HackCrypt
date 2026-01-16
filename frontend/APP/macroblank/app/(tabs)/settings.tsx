import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { appTheme } from '../../constants/appTheme';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = true, rightElement }: SettingItemProps) {
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color={appTheme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showArrow && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color={appTheme.colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoSaveResults, setAutoSaveResults] = React.useState(true);
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
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </Animated.View>

        {/* App Info Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.appInfoCard}>
          <View style={styles.appLogoContainer}>
            <Ionicons name="shield-checkmark" size={32} color="#050508" />
          </View>
          <View style={styles.appInfoText}>
            <Text style={styles.appName}>MacroBlank</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </Animated.View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Receive analysis completion alerts"
              showArrow={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#3A3A45', true: 'rgba(232, 232, 236, 0.4)' }}
                  thumbColor={notificationsEnabled ? appTheme.colors.primary : '#888'}
                />
              }
            />
            <SettingItem
              icon="save-outline"
              title="Auto-save Results"
              subtitle="Save detection results to history"
              showArrow={false}
              rightElement={
                <Switch
                  value={autoSaveResults}
                  onValueChange={setAutoSaveResults}
                  trackColor={{ false: '#3A3A45', true: 'rgba(232, 232, 236, 0.4)' }}
                  thumbColor={autoSaveResults ? appTheme.colors.primary : '#888'}
                />
              }
            />
          </View>
        </View>

        {/* Detection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detection</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="server-outline"
              title="API Endpoint"
              subtitle="http://localhost:8002"
              showArrow={false}
            />
            <SettingItem
              icon="speedometer-outline"
              title="Video Frames"
              subtitle="15 frames per analysis"
              onPress={() => {}}
            />
            <SettingItem
              icon="options-outline"
              title="Default Model"
              subtitle="GenConViT-ED (Video)"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="information-circle-outline"
              title="About MacroBlank"
              onPress={() => {}}
            />
            <SettingItem
              icon="logo-github"
              title="View on GitHub"
              onPress={() => Linking.openURL('https://github.com')}
            />
            <SettingItem
              icon="document-text-outline"
              title="Privacy Policy"
              onPress={() => {}}
            />
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Model Info */}
        <View style={styles.modelInfoSection}>
          <Text style={styles.modelInfoTitle}>Detection Models</Text>
          <View style={styles.modelList}>
            <View style={styles.modelItem}>
              <View style={[styles.modelDot, { backgroundColor: '#6366F1' }]} />
              <Text style={styles.modelName}>GenConViT-ED</Text>
              <Text style={styles.modelType}>Video</Text>
            </View>
            <View style={styles.modelItem}>
              <View style={[styles.modelDot, { backgroundColor: '#EC4899' }]} />
              <Text style={styles.modelName}>ConvNeXt-MTCNN</Text>
              <Text style={styles.modelType}>Image</Text>
            </View>
            <View style={styles.modelItem}>
              <View style={[styles.modelDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.modelName}>Wav2Vec2-AASIST</Text>
              <Text style={styles.modelType}>Audio</Text>
            </View>
            <View style={styles.modelItem}>
              <View style={[styles.modelDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.modelName}>EfficientNet-B3</Text>
              <Text style={styles.modelType}>AI Generated</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for HackCrypt</Text>
          <Text style={styles.footerSubtext}>Epochalypse Team</Text>
        </View>

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
  appInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  appLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appInfoText: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  appVersion: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: appTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(232, 232, 236, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: appTheme.colors.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    marginTop: 2,
  },
  modelInfoSection: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  modelInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: appTheme.colors.text,
    marginBottom: 16,
  },
  modelList: {
    gap: 12,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  modelName: {
    flex: 1,
    fontSize: 14,
    color: appTheme.colors.textSecondary,
  },
  modelType: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
  footerSubtext: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    marginTop: 4,
    opacity: 0.7,
  },
});
