import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useGuestsStore, Guest } from '../store/guestsStore';
import { guestAnalyzer } from '../services/guestAnalyzer';
import GuestCard from '../components/GuestCard';
import AdBanner from '../components/AdBanner';

type FilterType = 'all' | 'high' | 'medium' | 'low';

export default function GuestsScreen() {
  const { isPremium } = useAuthStore();
  const { guests, isLoading, setLoading, setGuests } = useGuestsStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const analyzedGuests = await guestAnalyzer.analyzeGuests();
      setGuests(analyzedGuests);
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGuests();
    setRefreshing(false);
  };

  const filteredGuests = guests.filter((guest) => {
    switch (filter) {
      case 'high':
        return guest.probability >= 70;
      case 'medium':
        return guest.probability >= 40 && guest.probability < 70;
      case 'low':
        return guest.probability < 40;
      default:
        return true;
    }
  });

  // Limit guests for non-premium users
  const displayGuests = isPremium ? filteredGuests : filteredGuests.slice(0, 5);
  const lockedCount = isPremium ? 0 : Math.max(0, filteredGuests.length - 5);

  const renderItem = ({ item, index }: { item: Guest; index: number }) => (
    <>
      <GuestCard guest={item} index={index} />
      {/* Show ad every 5 items for non-premium users */}
      {!isPremium && (index + 1) % 5 === 0 && <AdBanner />}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterTab
          label="Все"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterTab
          label="Высокая"
          active={filter === 'high'}
          onPress={() => setFilter('high')}
          color="#22C55E"
        />
        <FilterTab
          label="Средняя"
          active={filter === 'medium'}
          onPress={() => setFilter('medium')}
          color="#F97316"
        />
        <FilterTab
          label="Низкая"
          active={filter === 'low'}
          onPress={() => setFilter('low')}
          color="#6B7280"
        />
      </View>

      {/* Guests List */}
      <FlatList
        data={displayGuests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Загрузка...' : 'Гостей пока не найдено'}
            </Text>
          </View>
        }
        ListFooterComponent={
          lockedCount > 0 ? (
            <View style={styles.lockedContainer}>
              <Text style={styles.lockedText}>
                Ещё {lockedCount} гостей
              </Text>
              <Text style={styles.lockedSubtext}>
                Получите Premium, чтобы видеть всех гостей
              </Text>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>
                  Получить Premium
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Bottom Ad Banner for non-premium */}
      {!isPremium && <AdBanner />}
    </View>
  );
}

const FilterTab = ({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity
    style={[
      styles.filterTab,
      active && styles.filterTabActive,
      active && color && { backgroundColor: color },
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.filterTabText,
        active && styles.filterTabTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(88, 28, 135, 0.9)',
    borderColor: 'rgba(167, 139, 250, 0.8)',
  },
  filterTabText: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 1)',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#E5E7EB',
  },
  listContent: {
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(148, 163, 184, 1)',
  },
  lockedContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 16,
    padding: 20,
    margin: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  lockedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  lockedSubtext: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 1)',
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
  },
});
