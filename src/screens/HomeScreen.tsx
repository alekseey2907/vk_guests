import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useGuestsStore } from '../store/guestsStore';
import { guestAnalyzer } from '../services/guestAnalyzer';
import GuestCard from '../components/GuestCard';
import StatsCard from '../components/StatsCard';

export default function HomeScreen() {
  const { user, isPremium } = useAuthStore();
  const { guests, isLoading, setLoading, setGuests } = useGuestsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const analyzedGuests = await guestAnalyzer.analyzeGuests();
      setGuests(analyzedGuests);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const topGuests = guests.slice(0, isPremium ? 10 : 3);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Welcome Section */}
      <View style={styles.welcomeSection}>
        <Image
          source={{ uri: user?.photo_200 || 'https://vk.com/images/camera_200.png' }}
          style={styles.avatar}
        />
        <View style={styles.welcomeText}>
          <Text style={styles.greeting}>Привет,</Text>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatsCard
          title="Сегодня"
          value={guests.length.toString()}
        />
        <StatsCard
          title="За неделю"
          value={(guests.length * 7).toString()}
        />
      </View>

      {/* Recent Guests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Вероятные гости</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Все</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Анализируем данные...</Text>
          </View>
        ) : (
          <>
            {topGuests.map((guest, index) => (
              <GuestCard key={guest.id} guest={guest} index={index} />
            ))}

            {!isPremium && guests.length > 3 && (
              <View style={styles.premiumPrompt}>
                <Text style={styles.premiumPromptText}>
                  🔒 Ещё {guests.length - 3} гостей доступны с Premium
                </Text>
                <TouchableOpacity style={styles.unlockButton}>
                  <Text style={styles.unlockButtonText}>Разблокировать</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Как это работает?</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            Мы анализируем активность пользователей: лайки, комментарии, 
            просмотры историй, порядок в списке друзей и другие косвенные 
            признаки, чтобы вычислить, кто интересуется вашей страницей.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  premiumBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  section: {
    backgroundColor: 'transparent',
    padding: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  seeAll: {
    fontSize: 15,
    color: '#A78BFA',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#818C99',
    fontSize: 16,
  },
  premiumPrompt: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  premiumPromptText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  tipCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
  },
});
