import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { monetization } from '../services/monetization';

interface PlanOption {
  id: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  discount?: string;
}

const PLANS: PlanOption[] = [
  {
    id: 'weekly',
    title: 'Неделя',
    price: '99 ₽',
    period: '/ неделя',
    features: [
      'Все гости без ограничений',
      'Детальная статистика',
      'Без рекламы',
    ],
  },
  {
    id: 'monthly',
    title: 'Месяц',
    price: '249 ₽',
    period: '/ месяц',
    features: [
      'Все гости без ограничений',
      'Детальная статистика',
      'Без рекламы',
      'Уведомления о гостях',
    ],
    popular: true,
  },
  {
    id: 'yearly',
    title: 'Год',
    price: '1490 ₽',
    period: '/ год',
    discount: 'Экономия 50%',
    features: [
      'Все гости без ограничений',
      'Детальная статистика',
      'Без рекламы',
      'Уведомления о гостях',
      'Приоритетная поддержка',
    ],
  },
];

export default function PremiumScreen() {
  const { isPremium, premiumExpiry, setPremium } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const result = await monetization.purchasePremium(selectedPlan);
      if (result.success) {
        setPremium(result.expiry);
        Alert.alert('Успешно!', 'Вы получили Premium подписку');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось оформить подписку');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchAd = async () => {
    setIsLoading(true);
    try {
      const success = await monetization.watchRewardedAd();
      if (success) {
        Alert.alert('Награда!', 'Вы получили 24 часа Premium доступа');
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        setPremium(expiry);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить рекламу');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPremium && premiumExpiry) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.activeContainer}>
          <Text style={styles.activeTitle}>Premium активен</Text>
          <Text style={styles.activeExpiry}>
            До: {premiumExpiry.toLocaleDateString('ru-RU')}
          </Text>
          
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Ваши преимущества:</Text>
            <BenefitItem text="Все гости без ограничений" />
            <BenefitItem text="Детальная статистика" />
            <BenefitItem text="Без рекламы" />
            <BenefitItem text="Уведомления о гостях" />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Premium</Text>
        <Text style={styles.headerSubtitle}>
          Разблокируйте все возможности приложения
        </Text>
      </View>

      {/* Features Comparison */}
      <View style={styles.comparison}>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonFeature}>Функция</Text>
          <Text style={styles.comparisonFree}>Бесплатно</Text>
          <Text style={styles.comparisonPremium}>Premium</Text>
        </View>
        <ComparisonRow feature="Гости" free="5" premium="∞" />
        <ComparisonRow feature="Статистика" free="Базовая" premium="Полная" />
        <ComparisonRow feature="Реклама" free="Есть" premium="Нет" isPremiumBetter />
        <ComparisonRow feature="Уведомления" free="—" premium="✓" />
      </View>

      {/* Plan Selection */}
      <View style={styles.plansContainer}>
        <Text style={styles.plansTitle}>Выберите план</Text>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected,
              plan.popular && styles.planCardPopular,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Популярный</Text>
              </View>
            )}
            {plan.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{plan.discount}</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <View style={styles.planPriceContainer}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
            </View>
            <View style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <Text key={index} style={styles.planFeature}>
                  ✓ {feature}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Purchase Button */}
      <TouchableOpacity
        style={styles.purchaseButton}
        onPress={handlePurchase}
        disabled={isLoading}
      >
        <Text style={styles.purchaseButtonText}>
          {isLoading ? 'Загрузка...' : 'Оформить подписку'}
        </Text>
      </TouchableOpacity>

      {/* Watch Ad Option */}
      <View style={styles.adOption}>
        <Text style={styles.adOptionText}>Или получите 24 часа бесплатно</Text>
        <TouchableOpacity
          style={styles.watchAdButton}
          onPress={handleWatchAd}
          disabled={isLoading}
        >
          <Text style={styles.watchAdButtonText}>
            Посмотреть рекламу
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        Подписка автоматически продлевается. Отменить можно в любое время 
        в настройках App Store / Google Play.
      </Text>
    </ScrollView>
  );
}

const BenefitItem = ({ text }: { text: string }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitCheck}>✓</Text>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const ComparisonRow = ({
  feature,
  free,
  premium,
  isPremiumBetter = true,
}: {
  feature: string;
  free: string;
  premium: string;
  isPremiumBetter?: boolean;
}) => (
  <View style={styles.comparisonRow}>
    <Text style={styles.comparisonFeature}>{feature}</Text>
    <Text style={styles.comparisonFreeValue}>{free}</Text>
    <Text style={[
      styles.comparisonPremiumValue,
      isPremiumBetter && styles.comparisonPremiumBetter,
    ]}>
      {premium}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  header: {
    backgroundColor: 'transparent',
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 1)',
    textAlign: 'center',
  },
  comparison: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  comparisonRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    color: '#E5E7EB',
  },
  comparisonFree: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(148, 163, 184, 1)',
    textAlign: 'center',
  },
  comparisonPremium: {
    flex: 1,
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '600',
    textAlign: 'center',
  },
  comparisonFreeValue: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(148, 163, 184, 1)',
    textAlign: 'center',
  },
  comparisonPremiumValue: {
    flex: 1,
    fontSize: 14,
    color: '#A78BFA',
    textAlign: 'center',
  },
  comparisonPremiumBetter: {
    color: '#22C55E',
    fontWeight: '700',
  },
  plansContainer: {
    padding: 16,
    paddingTop: 0,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  planCardSelected: {
    borderColor: '#6366F1',
  },
  planCardPopular: {
    borderColor: '#22C55E',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#022C22',
  },
  discountBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  planPeriod: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 1)',
    marginLeft: 4,
  },
  planFeatures: {
    gap: 4,
  },
  planFeature: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 1)',
  },
  purchaseButton: {
    backgroundColor: '#6366F1',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  adOption: {
    alignItems: 'center',
    padding: 24,
  },
  adOptionText: {
    fontSize: 14,
    color: 'rgba(148, 163, 184, 1)',
    marginBottom: 12,
  },
  watchAdButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
  },
  watchAdButtonText: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(148, 163, 184, 1)',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  activeContainer: {
    alignItems: 'center',
    padding: 32,
  },
  activeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 8,
  },
  activeExpiry: {
    fontSize: 16,
    color: 'rgba(148, 163, 184, 1)',
    marginBottom: 32,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitCheck: {
    fontSize: 18,
    color: '#22C55E',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: 'rgba(148, 163, 184, 1)',
  },
});
