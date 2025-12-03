import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen() {
  const { user, isPremium, premiumExpiry, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleOpenVK = () => {
    Linking.openURL(`https://vk.com/id${user?.id}`);
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@vkguests.app');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://vkguests.app/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://vkguests.app/terms');
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.userSection}>
        <Image
          source={{ uri: user?.photo_200 || 'https://vk.com/images/camera_200.png' }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>
          {user?.first_name} {user?.last_name}
        </Text>
        {user?.city && (
          <Text style={styles.userCity}>{user.city.title}</Text>
        )}
        
        <TouchableOpacity style={styles.vkButton} onPress={handleOpenVK}>
          <Text style={styles.vkButtonText}>Открыть профиль VK</Text>
        </TouchableOpacity>
      </View>

      {/* Premium Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Подписка</Text>
        <View style={styles.premiumCard}>
          {isPremium ? (
            <>
              <Text style={styles.premiumStatus}>⭐ Premium активен</Text>
              <Text style={styles.premiumExpiry}>
                До: {premiumExpiry?.toLocaleDateString('ru-RU')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.premiumStatus}>Бесплатная версия</Text>
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Получить Premium</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настройки</Text>
        <SettingsItem
          icon="🔔"
          title="Уведомления"
          subtitle="Получать push-уведомления о гостях"
          onPress={() => {}}
          showArrow
        />
        <SettingsItem
          icon="🌙"
          title="Тёмная тема"
          subtitle="Скоро"
          onPress={() => {}}
          disabled
        />
        <SettingsItem
          icon="🌐"
          title="Язык"
          subtitle="Русский"
          onPress={() => {}}
        />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Поддержка</Text>
        <SettingsItem
          icon="💬"
          title="Написать в поддержку"
          onPress={handleSupport}
          showArrow
        />
        <SettingsItem
          icon="⭐"
          title="Оценить приложение"
          onPress={() => {}}
          showArrow
        />
        <SettingsItem
          icon="📤"
          title="Поделиться с друзьями"
          onPress={() => {}}
          showArrow
        />
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Правовая информация</Text>
        <SettingsItem
          icon="📄"
          title="Политика конфиденциальности"
          onPress={handlePrivacy}
          showArrow
        />
        <SettingsItem
          icon="📋"
          title="Условия использования"
          onPress={handleTerms}
          showArrow
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>Версия 1.0.0</Text>
    </ScrollView>
  );
}

const SettingsItem = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow,
  disabled,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.settingsItem, disabled && styles.settingsItemDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.settingsIcon}>{icon}</Text>
    <View style={styles.settingsContent}>
      <Text style={[styles.settingsTitle, disabled && styles.settingsDisabledText]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.settingsSubtitle}>{subtitle}</Text>
      )}
    </View>
    {showArrow && <Text style={styles.settingsArrow}>→</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F3F5',
  },
  userSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  userCity: {
    fontSize: 16,
    color: '#818C99',
    marginBottom: 16,
  },
  vkButton: {
    backgroundColor: '#4A76A8',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  vkButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#818C99',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  premiumCard: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  premiumStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  premiumExpiry: {
    fontSize: 14,
    color: '#818C99',
  },
  upgradeButton: {
    backgroundColor: '#FFD60A',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 8,
  },
  upgradeButtonText: {
    fontWeight: 'bold',
    color: '#000',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  settingsItemDisabled: {
    opacity: 0.5,
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    color: '#222',
  },
  settingsDisabledText: {
    color: '#818C99',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#818C99',
    marginTop: 2,
  },
  settingsArrow: {
    fontSize: 18,
    color: '#818C99',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#E64646',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#818C99',
    fontSize: 14,
    marginBottom: 32,
  },
});
