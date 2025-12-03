import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
// import { AdMobBanner } from 'expo-ads-admob';
import { monetization } from '../services/monetization';

interface AdBannerProps {
  style?: ViewStyle;
}

export default function AdBanner({ style }: AdBannerProps) {
  // В реальном приложении используйте AdMobBanner
  // Сейчас показываем заглушку

  return (
    <View style={[styles.container, style]}>
      {/* 
      <AdMobBanner
        bannerSize="smartBannerPortrait"
        adUnitID={monetization.getBannerAdId()}
        servePersonalizedAds
        onDidFailToReceiveAdWithError={(error) => console.log(error)}
      />
      */}
      
      {/* Заглушка для демонстрации */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>📢 Рекламный баннер</Text>
        <Text style={styles.placeholderSubtext}>
          Уберите рекламу с Premium подпиской
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: '100%',
    height: 60,
    backgroundColor: '#F2F3F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E3E6',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#818C99',
  },
  placeholderSubtext: {
    fontSize: 11,
    color: '#B8C1CC',
    marginTop: 2,
  },
});
