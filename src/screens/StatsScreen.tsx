import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useGuestsStore, DailyStats } from '../store/guestsStore';
import { vkApi } from '../services/vkApi';
import AdBanner from '../components/AdBanner';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { accessToken, isPremium } = useAuthStore();
  const { dailyStats, setDailyStats } = useGuestsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // This would normally fetch from VK API
      // For now, using mock data
      const mockStats: DailyStats = {
        date: new Date().toISOString(),
        views: 156,
        visitors: 42,
        demographics: {
          male: 45,
          female: 55,
          ageGroups: {
            '18-24': 35,
            '25-34': 40,
            '35-44': 18,
            '45+': 7,
          },
          topCities: [
            { name: 'Москва', count: 15 },
            { name: 'Санкт-Петербург', count: 8 },
            { name: 'Казань', count: 5 },
            { name: 'Новосибирск', count: 4 },
            { name: 'Екатеринбург', count: 3 },
          ],
        },
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Overview Cards */}
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{stats?.views || 0}</Text>
          <Text style={styles.overviewLabel}>Просмотров</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{stats?.visitors || 0}</Text>
          <Text style={styles.overviewLabel}>Посетителей</Text>
        </View>
      </View>

      {/* Gender Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Пол посетителей</Text>
        <View style={styles.genderContainer}>
          <View style={styles.genderBar}>
            <View 
              style={[
                styles.genderMale, 
                { width: `${stats?.demographics.male || 50}%` }
              ]} 
            />
            <View 
              style={[
                styles.genderFemale, 
                { width: `${stats?.demographics.female || 50}%` }
              ]} 
            />
          </View>
          <View style={styles.genderLabels}>
            <Text style={styles.genderLabel}>
              👨 Мужчины: {stats?.demographics.male || 0}%
            </Text>
            <Text style={styles.genderLabel}>
              👩 Женщины: {stats?.demographics.female || 0}%
            </Text>
          </View>
        </View>
      </View>

      {/* Age Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Возраст</Text>
        {stats?.demographics.ageGroups && (
          <View style={styles.ageContainer}>
            {Object.entries(stats.demographics.ageGroups).map(([age, percent]) => (
              <View key={age} style={styles.ageRow}>
                <Text style={styles.ageLabel}>{age}</Text>
                <View style={styles.ageBarContainer}>
                  <View 
                    style={[styles.ageBar, { width: `${percent}%` }]} 
                  />
                </View>
                <Text style={styles.agePercent}>{percent}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Top Cities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏙️ Города</Text>
        {isPremium ? (
          <View style={styles.citiesContainer}>
            {stats?.demographics.topCities.map((city, index) => (
              <View key={city.name} style={styles.cityRow}>
                <Text style={styles.cityRank}>{index + 1}</Text>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.cityCount}>{city.count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.lockedSection}>
            <Text style={styles.lockedEmoji}>🔒</Text>
            <Text style={styles.lockedText}>
              Детальная статистика по городам доступна в Premium
            </Text>
          </View>
        )}
      </View>

      {/* Activity Graph */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Активность за неделю</Text>
        {isPremium ? (
          <View style={styles.graphContainer}>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => {
              const height = Math.random() * 80 + 20;
              return (
                <View key={day} style={styles.graphColumn}>
                  <View style={[styles.graphBar, { height }]} />
                  <Text style={styles.graphLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.lockedSection}>
            <Text style={styles.lockedEmoji}>🔒</Text>
            <Text style={styles.lockedText}>
              График активности доступен в Premium
            </Text>
          </View>
        )}
      </View>

      {/* Ad for non-premium */}
      {!isPremium && <AdBanner style={styles.ad} />}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F3F5',
  },
  overviewRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A76A8',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#818C99',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  genderContainer: {},
  genderBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  genderMale: {
    backgroundColor: '#5181B8',
  },
  genderFemale: {
    backgroundColor: '#E8A0BF',
  },
  genderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  genderLabel: {
    fontSize: 14,
    color: '#555',
  },
  ageContainer: {
    gap: 12,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageLabel: {
    width: 50,
    fontSize: 14,
    color: '#555',
  },
  ageBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#F2F3F5',
    borderRadius: 10,
    marginHorizontal: 8,
  },
  ageBar: {
    height: '100%',
    backgroundColor: '#4A76A8',
    borderRadius: 10,
  },
  agePercent: {
    width: 40,
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
  },
  citiesContainer: {
    gap: 8,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  cityRank: {
    width: 24,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A76A8',
  },
  cityName: {
    flex: 1,
    fontSize: 14,
    color: '#222',
  },
  cityCount: {
    fontSize: 14,
    color: '#818C99',
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  graphColumn: {
    alignItems: 'center',
  },
  graphBar: {
    width: 32,
    backgroundColor: '#4A76A8',
    borderRadius: 4,
  },
  graphLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#818C99',
  },
  lockedSection: {
    backgroundColor: '#F2F3F5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  lockedEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: '#818C99',
    textAlign: 'center',
  },
  ad: {
    margin: 8,
  },
  footer: {
    height: 20,
  },
});
