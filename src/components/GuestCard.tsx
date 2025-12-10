import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Guest } from '../store/guestsStore';

interface GuestCardProps {
  guest: Guest;
  index: number;
}

export default function GuestCard({ guest, index }: GuestCardProps) {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return '#4CAF50';
    if (probability >= 40) return '#FF9800';
    return '#9E9E9E';
  };

  const getActivityIcon = (type: Guest['activityType']) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'story_view':
        return '👁️';
      case 'message':
        return '✉️';
      case 'friend_order':
        return '⭐';
      default:
        return '👤';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Только что';
    if (hours < 24) return `${hours} ч. назад`;
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return `${Math.floor(days / 7)} нед. назад`;
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.rankContainer}>
        <Text style={styles.rank}>#{index + 1}</Text>
      </View>

      <Image
        source={{ uri: guest.user.photo_100 || 'https://vk.com/images/camera_100.png' }}
        style={styles.avatar}
      />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {guest.user.first_name} {guest.user.last_name}
          </Text>
          <Text style={styles.activityIcon}>
            {getActivityIcon(guest.activityType)}
          </Text>
        </View>

        <Text style={styles.details} numberOfLines={1}>
          {guest.details}
        </Text>

        <View style={styles.metaRow}>
          {guest.user.city && (
            <Text style={styles.meta}>📍 {guest.user.city}</Text>
          )}
          {guest.user.age && (
            <Text style={styles.meta}>🎂 {guest.user.age} лет</Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <View
          style={[
            styles.probabilityBadge,
            { backgroundColor: getProbabilityColor(guest.probability) },
          ]}
        >
          <Text style={styles.probabilityText}>{guest.probability}%</Text>
        </View>
        <Text style={styles.time}>{getTimeAgo(guest.lastActivity)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A76A8',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginRight: 6,
  },
  activityIcon: {
    fontSize: 14,
  },
  details: {
    fontSize: 13,
    color: '#818C99',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  meta: {
    fontSize: 12,
    color: '#818C99',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  probabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 48,
    alignItems: 'center',
  },
  probabilityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  time: {
    fontSize: 11,
    color: '#818C99',
    marginTop: 4,
  },
});
