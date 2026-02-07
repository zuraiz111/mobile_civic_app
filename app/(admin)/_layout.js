import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useApp } from '../../src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

// Screens where the bottom tab bar should be hidden
const HIDDEN_TAB_SCREENS = ['login', 'report-detail'];

export default function AdminLayout() {
  const { isAdmin } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAdminGroup = segments[0] === '(admin)';
    const currentScreen = segments[1]; // e.g. "login", "dashboard", "reports"…
    const isLoginPage = currentScreen === 'login';

    if (inAdminGroup && !isAdmin && !isLoginPage) {
      const t = setTimeout(() => router.replace('/(admin)/login'), 0);
      return () => clearTimeout(t);
    }
  }, [isAdmin, segments, router]);

  // Derive whether the current screen should hide the tab bar
  const currentScreen = segments[1];
  const hideTabBar = HIDDEN_TAB_SCREENS.includes(currentScreen);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: hideTabBar ? { display: 'none' } : styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* ── Hidden: Login (no tab bar, not in tab list) ── */}
      <Tabs.Screen
        name="login"
        options={{ href: null }}
      />

      {/* ── Visible Tab: Dashboard ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* ── Visible Tab: Reports ── */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* ── Visible Tab: Users ── */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* ── Visible Tab: Departments ── */}
      <Tabs.Screen
        name="departments"
        options={{
          title: 'Depts',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'business' : 'business-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* ── Hidden: Settings (reachable via dashboard header) ── */}
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />

      {/* ── Hidden: Report Detail (push-navigated from Dashboard / Reports) ── */}
      <Tabs.Screen
        name="report-detail"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    height: 64,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
