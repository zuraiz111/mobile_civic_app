import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { useApp } from '../../src/context/AppContext';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { logout } = useApp();
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [urgentOnly, setUrgentOnly] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('logout') || 'Logout',
      t('logoutConfirm') || 'Are you sure you want to log out?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('logout') || 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your preferences</Text>
          </View>
        </View>

        {/* ── Profile ── */}
        <Text style={styles.sectionTitle}>PROFILE</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{t('adminUser') || 'Admin User'}</Text>
              <Text style={styles.profileRole}>{t('systemAdmin') || 'System Administrator'}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editText}>{t('edit') || 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Notifications ── */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="notifications"
            iconColor="#8b5cf6"
            label={t('pushNotifications') || 'Push Notifications'}
            desc={t('receiveAlerts') || 'Receive real-time alerts for new reports'}
            value={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="mail"
            iconColor="#3b82f6"
            label={t('emailAlerts') || 'Email Alerts'}
            desc={t('getSummary') || 'Get daily summary emails'}
            value={emailAlerts}
            onToggle={setEmailAlerts}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="alert-circle"
            iconColor="#ef4444"
            label={t('urgentReportsOnly') || 'Urgent Reports Only'}
            desc={t('notifyUrgent') || 'Only notify for high-priority reports'}
            value={urgentOnly}
            onToggle={setUrgentOnly}
          />
        </View>

        {/* ── General ── */}
        <Text style={styles.sectionTitle}>GENERAL</Text>
        <View style={styles.card}>
          <MenuRow icon="lock-closed"  iconColor="#f59e0b" label={t('changePassword') || 'Change Password'} />
          <View style={styles.divider} />
          <MenuRow icon="download"     iconColor="#22c55e" label={t('exportReports') || 'Export Reports'} />
          <View style={styles.divider} />
          <MenuRow icon="question-circle" iconColor="#64748b" label={t('helpSupport') || 'Help & Support'} />
        </View>

        {/* ── Danger Zone ── */}
        <Text style={styles.sectionTitle}>DANGER ZONE</Text>
        <View style={styles.card}>
          <MenuRow icon="log-out" iconColor="#ef4444" label={t('logout') || 'Logout'} danger onPress={handleLogout} />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Ionicons name="building" size={18} color="#475569" style={{ marginBottom: 6 }} />
          <Text style={styles.appName}>CitizenConnect Admin</Text>
          <Text style={styles.appVersion}>v1.0.0</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Reusable row components ──
const ToggleRow = ({ icon, iconColor, label, desc, value, onToggle }) => (
  <View style={styles.settingRow}>
    <View style={[styles.settingIconBg, { backgroundColor: iconColor + '1A' }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>{label}</Text>
      {desc ? <Text style={styles.settingDesc}>{desc}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#334155', true: '#8b5cf6' }}
      thumbColor="#ffffff"
      ios_backgroundColor="#334155"
    />
  </View>
);

const MenuRow = ({ icon, iconColor, label, danger, onPress }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconBg, { backgroundColor: (iconColor || '#64748b') + '1A' }]}>
      <Ionicons name={icon} size={18} color={iconColor || '#64748b'} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color="#475569" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollView: { flex: 1 },

  // Header with back button
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 20 },
  backButton: { padding: 8, marginRight: 8 },
  headerText: {},
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#64748b' },

  // Sections
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#475569', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, marginHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#334155', marginLeft: 64 },

  // Profile
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  profileRole: { fontSize: 13, color: '#64748b' },
  editText: { color: '#8b5cf6', fontSize: 14, fontWeight: '500' },

  // Toggle rows
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, color: '#fff', marginBottom: 2 },
  settingDesc: { fontSize: 12, color: '#64748b' },

  // Menu rows
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#fff' },
  menuLabelDanger: { color: '#ef4444' },

  // App info
  appInfo: { alignItems: 'center', paddingVertical: 24 },
  appName: { fontSize: 14, color: '#475569', marginBottom: 3 },
  appVersion: { fontSize: 12, color: '#334155' },

  bottomSpacer: { height: 30 },
});
