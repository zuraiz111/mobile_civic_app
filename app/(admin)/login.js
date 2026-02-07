import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { useLanguage } from '../../src/context/LanguageContext';
import { useApp } from '../../src/context/AppContext';
import { verifyAdminRole } from '../../src/services/adminService';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('error'), t('pleaseEnterCredentials'));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const isAdmin = await verifyAdminRole(user.uid);

      if (isAdmin) {
        await login({ uid: user.uid, email: user.email, role: 'admin' });
        router.replace('/(admin)/dashboard');
      } else {
        await signOut(auth);
        Alert.alert(t('error'), 'Access Denied. Admin privileges required.');
      }
    } catch (error) {
      console.error('Login error:', error);
      let msg = 'An unexpected error occurred.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Invalid email format.';
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again later.';
      }
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBg}>
              <Text style={styles.lockIcon}>🔐</Text>
            </View>
            <Text style={styles.title}>{t('adminPortal') || 'Admin Portal'}</Text>
            <Text style={styles.subtitle}>{t('secureAccess') || 'Secure administrative access'}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder={t('email') || 'Email'}
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder={t('password') || 'Password'}
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? (t('loggingIn') || 'Signing in…') : (`${t('login') || 'Sign In'} →`)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('forgotPassword') || 'Forgot password?'}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.backToApp}>← {t('backToCitizenApp') || 'Back to Citizen App'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  // Header
  header: { alignItems: 'center', marginBottom: 48 },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockIcon: { fontSize: 44 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center' },

  // Form
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
  },
  inputIcon: { fontSize: 18, marginRight: 12, width: 24, textAlign: 'center' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#ffffff' },
  loginButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonDisabled: { backgroundColor: '#475569', shadowOpacity: 0 },
  loginButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  forgotPassword: { alignItems: 'center', marginTop: 4 },
  forgotPasswordText: { color: '#64748b', fontSize: 14 },

  // Footer
  footer: { marginTop: 48, alignItems: 'center' },
  backToApp: { color: '#8b5cf6', fontSize: 15, fontWeight: '500' },
});
